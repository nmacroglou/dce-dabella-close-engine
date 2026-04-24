import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Deal, DealStage } from "@/types/deal";
import type { DealObjection } from "@/types/deal";

export interface DashboardStats {
  // Month
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
  // Streak — last 7 days close rate
  weeklyCloseRate: number;
  weeklyClosed: number;
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

  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<DashboardStats> => {
      const [dealsRes, objectionsRes] = await Promise.all([
        supabase.from("deals").select("*"),
        supabase.from("deal_objections").select("*"),
      ]);
      if (dealsRes.error) throw dealsRes.error;
      if (objectionsRes.error) throw objectionsRes.error;

      const deals = (dealsRes.data ?? []) as unknown as Deal[];
      const objections = (objectionsRes.data ?? []) as DealObjection[];

      const monthStart = startOfMonth();
      const weekStart = daysAgo(7);

      const monthDeals = deals.filter((d) => d.created_at >= monthStart);
      const monthClosedDeals = monthDeals.filter((d) => d.stage === "won");
      const monthLostDeals = monthDeals.filter((d) => d.stage === "lost");
      const monthFinished = monthClosedDeals.length + monthLostDeals.length;
      const monthCloseRate = monthFinished > 0 ? monthClosedDeals.length / monthFinished : 0;
      const monthRevenue = monthClosedDeals.reduce((sum, d) => sum + (d.closed_amount ?? 0), 0);

      // Funnel
      const stages: DealStage[] = ["inspecting", "presented", "follow_up", "won", "lost"];
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
        pending: deals.filter((d) => d.stage !== "won" && d.stage !== "lost").length,
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

      // Objection heatmap — for each objection type, total occurrences + how often it appeared on wins/losses
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

      // Weekly streak
      const weeklyDeals = deals.filter((d) => d.created_at >= weekStart);
      const weeklyClosedCount = weeklyDeals.filter((d) => d.stage === "won").length;
      const weeklyFinished =
        weeklyClosedCount + weeklyDeals.filter((d) => d.stage === "lost").length;

      // Time to close
      const closedWithDates = deals.filter((d) => d.closed_at && d.created_at);
      const avgDaysToClose =
        closedWithDates.length > 0
          ? closedWithDates.reduce((sum, d) => sum + daysBetween(d.created_at, d.closed_at!), 0) /
            closedWithDates.length
          : 0;

      // Next best action
      const followUpsOverdue = deals.filter(
        (d) => d.stage === "follow_up" && daysBetween(d.stage_changed_at, new Date().toISOString()) > 3
      ).length;
      const presentedStale = deals.filter(
        (d) => d.stage === "presented" && daysBetween(d.stage_changed_at, new Date().toISOString()) > 7
      ).length;

      const allTimeRevenue = deals
        .filter((d) => d.stage === "won")
        .reduce((sum, d) => sum + (d.closed_amount ?? 0), 0);

      return {
        monthDealsRun: monthDeals.length,
        monthClosed: monthClosedDeals.length,
        monthLost: monthLostDeals.length,
        monthCloseRate,
        monthRevenue,
        funnel,
        inspectedToPresented,
        presentedToWon,
        winLoss,
        optionMix,
        objectionCounts,
        weeklyCloseRate: weeklyFinished > 0 ? weeklyClosedCount / weeklyFinished : 0,
        weeklyClosed: weeklyClosedCount,
        weeklyRun: weeklyDeals.length,
        avgDaysToClose,
        followUpsOverdue,
        presentedStale,
        totalDeals: deals.length,
        totalWon,
        allTimeRevenue,
      };
    },
  });
}
