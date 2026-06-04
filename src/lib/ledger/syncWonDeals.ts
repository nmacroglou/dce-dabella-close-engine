import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Deal } from "@/types/deal";
import { computeCommissionSheet } from "@/types/commission";
import type { CommissionPayment } from "@/hooks/useCommissionLedger";

interface SyncArgs {
  user: { id: string };
  deals: Deal[];
  rows: CommissionPayment[];
  grid: { tiers: any[]; front_end_pct: number };
  silent?: boolean;
}

/**
 * Sync the commission ledger with current "won" deals:
 *  - Insert ledger rows for won deals missing from ledger
 *  - Refresh expected amounts for existing rows (in case commission sheet changed)
 *  - Remove ledger rows whose underlying deal is no longer "won" AND has no payments recorded
 */
export async function syncWonDealsToLedger({
  user, deals, rows, grid, silent,
}: SyncArgs): Promise<number> {
  const wonDealIds = new Set(deals.filter((d) => d.stage === "won").map((d) => d.id));
  const existingByDeal = new Map(
    rows.filter((r) => r.deal_id).map((r) => [r.deal_id as string, r] as const),
  );

  const staleIds = rows
    .filter((r) => {
      if (!r.deal_id) return false;
      if (wonDealIds.has(r.deal_id)) return false;
      const paid = (+r.front_paid_amount || 0) + (+r.back_paid_amount || 0);
      return paid <= 0.01;
    })
    .map((r) => r.id);

  const payloads = deals
    .filter((d) => d.stage === "won" && d.commission_sheet)
    .map((d) => {
      try {
        const c = computeCommissionSheet(d.commission_sheet, grid.tiers, grid.front_end_pct);
        const existing = existingByDeal.get(d.id);
        return {
          ...(existing ? { id: existing.id } : {}),
          rep_id: user.id,
          deal_id: d.id,
          customer_name: [d.homeowner1, d.homeowner2].filter(Boolean).join(" & ") || "Unnamed",
          job_number: d.commission_sheet.job_number ?? "",
          sale_date: d.commission_sheet.date_of_sale ?? d.closed_at?.slice(0, 10) ?? null,
          expected_total: c.rep1Commission,
          expected_front: c.rep1Advance,
          expected_back: c.rep1Earned,
          front_paid_amount: existing?.front_paid_amount ?? 0,
          back_paid_amount: existing?.back_paid_amount ?? 0,
          front_paid_at: existing?.front_paid_at ?? null,
          back_paid_at: existing?.back_paid_at ?? null,
          notes: existing?.notes ?? null,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as any[];

  const newCount = payloads.filter((p) => !p.id).length;

  if (!staleIds.length && !newCount && !payloads.length) {
    if (!silent) toast.info("Ledger already in sync");
    return 0;
  }

  if (staleIds.length) {
    const { error } = await supabase.from("commission_payments").delete().in("id", staleIds);
    if (error) {
      toast.error(`Cleanup failed: ${error.message}`);
      return 0;
    }
  }

  const updates = payloads.filter((p) => p.id);
  const inserts = payloads.filter((p) => !p.id);

  if (updates.length) {
    const results = await Promise.all(
      updates.map(({ id, ...patch }) =>
        supabase.from("commission_payments").update(patch).eq("id", id),
      ),
    );
    const firstErr = results.find((r) => r.error)?.error;
    if (firstErr) {
      toast.error(`Sync failed: ${firstErr.message}`);
      return 0;
    }
  }

  if (inserts.length) {
    const { error } = await supabase.from("commission_payments").insert(inserts);
    if (error) {
      toast.error(`Sync failed: ${error.message}`);
      return 0;
    }
  }

  if (!silent) {
    const parts: string[] = [];
    if (newCount) parts.push(`added ${newCount}`);
    const refreshed = payloads.length - newCount;
    if (refreshed) parts.push(`refreshed ${refreshed}`);
    if (staleIds.length) parts.push(`removed ${staleIds.length}`);
    toast.success(`Ledger synced: ${parts.join(" · ") || "no changes"}`);
  }
  return newCount + staleIds.length;
}
