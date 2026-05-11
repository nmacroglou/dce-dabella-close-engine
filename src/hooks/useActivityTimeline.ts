import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { DealStage } from "@/types/deal";
import { STAGE_LABELS } from "@/types/deal";
import { OBJECTIONS } from "@/data/objections";

export type TimelineKind = "stage" | "won" | "lost" | "objection" | "followup_done" | "followup_overdue";

export interface TimelineEvent {
  id: string;
  at: string;            // ISO
  kind: TimelineKind;
  dealId: string;
  homeowner: string;
  title: string;
  detail?: string;
}

const objLabel = (id: string) => OBJECTIONS.find((o) => o.id === id)?.label ?? id;

export function useActivityTimeline(days = 14) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["activity-timeline", user?.id, days],
    enabled: !!user,
    queryFn: async (): Promise<TimelineEvent[]> => {
      const since = new Date(Date.now() - days * 864e5).toISOString();
      const [historyRes, dealsRes, objRes, fuRes] = await Promise.all([
        supabase.from("deal_stage_history").select("*").gte("changed_at", since).order("changed_at", { ascending: false }),
        supabase.from("deals").select("id, homeowner1"),
        supabase.from("deal_objections").select("*").gte("created_at", since).order("created_at", { ascending: false }),
        supabase.from("follow_ups").select("*").order("due_at", { ascending: false }).limit(500),
      ]);

      if (historyRes.error) throw historyRes.error;
      if (dealsRes.error) throw dealsRes.error;
      if (objRes.error) throw objRes.error;
      if (fuRes.error) throw fuRes.error;

      const homeownerByDeal = new Map<string, string>();
      (dealsRes.data ?? []).forEach((d: { id: string; homeowner1: string | null }) => {
        homeownerByDeal.set(d.id, d.homeowner1 ?? "Unnamed deal");
      });
      const events: TimelineEvent[] = [];

      // Stage changes (incl. wins/losses)
      for (const row of (historyRes.data ?? []) as Array<{
        id: string; deal_id: string; from_stage: DealStage | null; to_stage: DealStage; changed_at: string; note: string | null;
      }>) {
        const homeowner = homeownerByDeal.get(row.deal_id) ?? "Deal";
        const kind: TimelineKind = row.to_stage === "won" ? "won" : row.to_stage === "lost" ? "lost" : "stage";
        events.push({
          id: `h-${row.id}`,
          at: row.changed_at,
          kind,
          dealId: row.deal_id,
          homeowner,
          title:
            kind === "won" ? `Closed — ${homeowner}` :
            kind === "lost" ? `Lost — ${homeowner}` :
            `${row.from_stage ? STAGE_LABELS[row.from_stage] : "New"} → ${STAGE_LABELS[row.to_stage]}`,
          detail: row.note ?? undefined,
        });
      }

      // Objections
      for (const o of (objRes.data ?? []) as Array<{ id: string; deal_id: string; objection_type: string; notes: string | null; created_at: string }>) {
        events.push({
          id: `o-${o.id}`,
          at: o.created_at,
          kind: "objection",
          dealId: o.deal_id,
          homeowner: homeownerByDeal.get(o.deal_id) ?? "Deal",
          title: `Objection: ${objLabel(o.objection_type)}`,
          detail: o.notes ?? undefined,
        });
      }

      // Follow-ups (completed within window OR currently overdue)
      const sinceMs = Date.now() - days * 864e5;
      const now = Date.now();
      for (const f of (fuRes.data ?? []) as Array<{
        id: string; deal_id: string; due_at: string; completed_at: string | null; touchpoint_number: number; channel: string | null;
      }>) {
        const homeowner = homeownerByDeal.get(f.deal_id) ?? "Deal";
        if (f.completed_at && new Date(f.completed_at).getTime() >= sinceMs) {
          events.push({
            id: `fd-${f.id}`,
            at: f.completed_at,
            kind: "followup_done",
            dealId: f.deal_id,
            homeowner,
            title: `Follow-up #${f.touchpoint_number} sent`,
            detail: f.channel ?? undefined,
          });
        } else if (!f.completed_at && new Date(f.due_at).getTime() < now && new Date(f.due_at).getTime() >= sinceMs) {
          events.push({
            id: `fo-${f.id}`,
            at: f.due_at,
            kind: "followup_overdue",
            dealId: f.deal_id,
            homeowner,
            title: `Follow-up #${f.touchpoint_number} overdue`,
            detail: f.channel ?? undefined,
          });
        }
      }

      events.sort((a, b) => +new Date(b.at) - +new Date(a.at));
      return events;
    },
  });
}
