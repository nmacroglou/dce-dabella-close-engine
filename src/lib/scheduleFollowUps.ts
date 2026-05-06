import { supabase } from "@/integrations/supabase/client";
import type { FollowUpSLA } from "@/types/followUp";

/**
 * When a deal enters the follow_up stage, schedule the rep's SLA cadence.
 * Idempotent: skips if there are already incomplete follow-ups for this deal.
 */
export async function scheduleSLAFollowUps(
  dealId: string,
  repId: string,
  sla: FollowUpSLA
): Promise<number> {
  const { data: existing, error: e1 } = await supabase
    .from("follow_ups")
    .select("id, completed_at")
    .eq("deal_id", dealId);
  if (e1) throw e1;
  const hasOpen = (existing ?? []).some((f) => !f.completed_at);
  if (hasOpen) return 0;

  const now = Date.now();
  const rows = sla.touchpoints.map((tp, i) => ({
    deal_id: dealId,
    rep_id: repId,
    touchpoint_number: i + 1,
    due_at: new Date(now + tp.offset_hours * 36e5).toISOString(),
    channel: "email",
  }));
  if (rows.length === 0) return 0;
  const { error } = await supabase.from("follow_ups").insert(rows as never);
  if (error) throw error;
  return rows.length;
}
