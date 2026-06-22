import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnerScope } from "@/contexts/OwnerScopeContext";
import type { Deal, DealStage } from "@/types/deal";
import type { DealObjection } from "@/types/deal";

export interface DashboardStats {
  // Month (all "this month" metrics use closed_at; monthDealsRun uses created_at)
  monthDealsRun: number;
  monthClosed: number;
  monthLost: number;
  monthCloseRate: number;
  monthRevenue: number;
  // Funnel
  funnel: { stage: DealStage; count: number }[];
  inspectedToPresented: number;
  presentedToWon: number;
  // Win/Loss
  winLoss: { won: number; lost: number; pending: number; avgWon: number; avgLost: number };
  // Option mix
  optionMix: { A: number; B: number; C: number };
  // Objection heatmap
  objectionCounts: Record<string, { total: number; onWins: number; onLosses: number }>;
  // Streak — last 7 days, measured by close date
  weeklyCloseRate: number;
  weeklyClosed: number;
  weeklyFinished: number;
  weeklyRun: number;
  // Time to close
  avgDaysToClose: number;
  // Next best action
  followUpsOverdue: number;
  presentedStale: number;
  // Totals
  totalDeals: number;
  totalWon: number;
  allTimeRevenue: number;
  // Inspection adoption — deals with at least one uploaded + tagged photo
  inspectionReportsCount: number;
  inspectionAdoptionPct: number;
  inspectionReportsThisMonth: number;
}

const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
};

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const daysBetween = (a: string, b: string) =>
  Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));

export function useDashboardStats() {
  const { user } = useAuth();
  const { effectiveRepId, scope } = useOwnerScope();

  return useQuery({
    queryKey: ["dashboard-stats", user?.id, scope, effectiveRepId],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async (): Promise<DashboardStats> => {
      let dealsQ = supabase.from("deals").select("*");
      let objQ = supabase.from("deal_objections").select("*");
      let photosQ = supabase
        .from("deal_photos")
        .select("deal_id, inspection_tags, created_at")
        .not("inspection_tags", "is", null);
      if (effectiveRepId) {
        dealsQ = dealsQ.eq("rep_id", effectiveRepId);
        objQ = objQ.eq("rep_id", effectiveRepId);
        photosQ = photosQ.eq("rep_id", effectiveRepId);
      }
      const [dealsRes, objectionsRes, photosRes] = await Promise.all([dealsQ, objQ, photosQ]);
      if (dealsRes.error) throw dealsRes.error;
      if (objectionsRes.error) throw objectionsRes.error;
      if (photosRes.error) throw photosRes.error;

      const deals = (dealsRes.data ?? []) as unknown as Deal[];
      const objections = (objectionsRes.data ?? []) as DealObjection[];
      const taggedPhotos = (photosRes.data ?? []) as {
        deal_id: string; inspection_tags: string[] | null; created_at: string;
      }[];

      const monthStart = startOfMonth();
      const weekStart = daysAgo(7);

      // Activity counter — how many deals you *started* this month.
      const monthDeals = deals.filter((d) => d.created_at >= monthStart);

      // Outcome counters — based on when the deal closed, not when it was created.
      // This is what reps expect from "revenue this month" and "close rate this month."
      const closedThisMonthWon = deals.filter(
        (d) => d.stage === "won" && d.closed_at && d.closed_at >= monthStart,
      );
      const closedThisMonthLost = deals.filter(
        (d) => d.stage === "lost" && d.closed_at && d.closed_at >= monthStart,
      );
      const monthFinished = closedThisMonthWon.length + closedThisMonthLost.length;
      const monthCloseRate = monthFinished > 0 ? closedThisMonthWon.length / monthFinished : 0;
      const monthRevenue = closedThisMonthWon.reduce((sum, d) => sum + (d.closed_amount ?? 0), 0);

      // Funnel
      const stages: DealStage[] = ["inspecting", "presented", "follow_up", "won", "lost", "disqualified"];
      const funnel = stages.map((stage) => ({
        stage,
        count: deals.filter((d) => d.stage === stage).length,
      }));
      const totalEverPresented = deals.filter(
        (d) => d.stage === "presented" || d.stage === "follow_up" || d.stage === "won" || d.stage === "lost"
      ).length;
      const totalWon = deals.filter((d) => d.stage === "won").length;
      const totalLost = deals.filter((d) => d.stage === "lost").length;
      const inspectedToPresented = deals.length > 0 ? totalEverPresented / deals.length : 0;
      const presentedToWon = totalEverPresented > 0 ? totalWon / totalEverPresented : 0;

      // Win/Loss
      const wonAmounts = deals.filter((d) => d.stage === "won").map((d) => d.closed_amount ?? 0);
      const lostAmounts = deals
        .filter((d) => d.stage === "lost")
        .map((d) => d.price_a ?? d.price_b ?? d.price_c ?? 0);
      const winLoss = {
        won: totalWon,
        lost: totalLost,
        pending: deals.filter((d) => d.stage !== "won" && d.stage !== "lost" && d.stage !== "disqualified").length,
        avgWon: wonAmounts.length > 0 ? wonAmounts.reduce((a, b) => a + b, 0) / wonAmounts.length : 0,
        avgLost: lostAmounts.length > 0 ? lostAmounts.reduce((a, b) => a + b, 0) / lostAmounts.length : 0,
      };

      // Option mix
      const wonDeals = deals.filter((d) => d.stage === "won" && d.selected_option);
      const optionMix = {
        A: wonDeals.filter((d) => d.selected_option === "A").length,
        B: wonDeals.filter((d) => d.selected_option === "B").length,
        C: wonDeals.filter((d) => d.selected_option === "C").length,
      };

      // Objection heatmap
      const dealOutcome = new Map<string, DealStage>();
      deals.forEach((d) => dealOutcome.set(d.id, d.stage));
      const objectionCounts: Record<string, { total: number; onWins: number; onLosses: number }> = {};
      objections.forEach((o) => {
        const existing = objectionCounts[o.objection_type] ?? { total: 0, onWins: 0, onLosses: 0 };
        existing.total += 1;
        const outcome = dealOutcome.get(o.deal_id);
        if (outcome === "won") existing.onWins += 1;
        if (outcome === "lost") existing.onLosses += 1;
        objectionCounts[o.objection_type] = existing;
      });

      // Last-7-days — by closed_at so a 60-day-old deal closed yesterday counts.
      const weeklyWon = deals.filter(
        (d) => d.stage === "won" && d.closed_at && d.closed_at >= weekStart,
      ).length;
      const weeklyLost = deals.filter(
        (d) => d.stage === "lost" && d.closed_at && d.closed_at >= weekStart,
      ).length;
      const weeklyFinished = weeklyWon + weeklyLost;
      const weeklyRunCreated = deals.filter((d) => d.created_at >= weekStart).length;

      // Time to close
      const closedWithDates = deals.filter((d) => d.closed_at && d.created_at);
      const avgDaysToClose =
        closedWithDates.length > 0
          ? closedWithDates.reduce((sum, d) => sum + daysBetween(d.created_at, d.closed_at!), 0) /
            closedWithDates.length
          : 0;

      const followUpsOverdue = deals.filter(
        (d) => d.stage === "follow_up" && daysBetween(d.stage_changed_at, new Date().toISOString()) > 3
      ).length;
      const presentedStale = deals.filter(
        (d) => d.stage === "presented" && daysBetween(d.stage_changed_at, new Date().toISOString()) > 7
      ).length;

      const allTimeRevenue = deals
        .filter((d) => d.stage === "won")
        .reduce((sum, d) => sum + (d.closed_amount ?? 0), 0);

      // Inspection report adoption — a "report" exists when a deal has at
      // least one photo with one or more tags (i.e. the rep actually
      // documented findings, not just snapped a picture).
      const dealIdSet = new Set(deals.map((d) => d.id));
      const inspectedDealIds = new Set<string>();
      const inspectedDealIdsThisMonth = new Set<string>();
      for (const p of taggedPhotos) {
        if (!p.deal_id || !dealIdSet.has(p.deal_id)) continue;
        const tags = Array.isArray(p.inspection_tags) ? p.inspection_tags : [];
        if (tags.length === 0) continue;
        inspectedDealIds.add(p.deal_id);
        if (p.created_at >= monthStart) inspectedDealIdsThisMonth.add(p.deal_id);
      }
      const inspectionReportsCount = inspectedDealIds.size;
      const inspectionAdoptionPct =
        deals.length > 0 ? inspectionReportsCount / deals.length : 0;
      const inspectionReportsThisMonth = inspectedDealIdsThisMonth.size;

      return {
        monthDealsRun: monthDeals.length,
        monthClosed: closedThisMonthWon.length,
        monthLost: closedThisMonthLost.length,
        monthCloseRate,
        monthRevenue,
        funnel,
        inspectedToPresented,
        presentedToWon,
        winLoss,
        optionMix,
        objectionCounts,
        weeklyCloseRate: weeklyFinished > 0 ? weeklyWon / weeklyFinished : 0,
        weeklyClosed: weeklyWon,
        weeklyFinished,
        weeklyRun: weeklyRunCreated,
        avgDaysToClose,
        followUpsOverdue,
        presentedStale,
        totalDeals: deals.length,
        totalWon,
        allTimeRevenue,
        inspectionReportsCount,
        inspectionAdoptionPct,
        inspectionReportsThisMonth,
      };
    },
  });
}
