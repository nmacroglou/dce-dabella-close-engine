import { toast } from "sonner";
import type { DecoratedRow } from "./types";

export function exportLedgerCsv(source: DecoratedRow[], exportAll: boolean) {
  try {
    if (!source.length) {
      toast.info("Nothing to export");
      return;
    }
    const headers = [
      "sale_date","customer","address","job_number","closed_amount","commission_pct",
      "expected_total","expected_front","expected_back",
      "front_paid","front_paid_at","back_paid","back_paid_at","outstanding","notes",
    ];
    const safe = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const lines = source.map(({ row: r, out, address, closedAmount, commissionPct }) => [
      r.sale_date ?? "", safe(r.customer_name ?? ""), safe(address), safe(r.job_number ?? ""),
      closedAmount, commissionPct,
      r.expected_total, r.expected_front, r.expected_back,
      r.front_paid_amount, r.front_paid_at ?? "",
      r.back_paid_amount, r.back_paid_at ?? "",
      out, safe((r.notes ?? "").replace(/\n/g, " ")),
    ].join(","));
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const scope = exportAll ? "all" : "filtered";
    const filename = `commission-ledger-${scope}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${source.length} row${source.length === 1 ? "" : "s"}`, {
      description: filename,
    });
  } catch (e: any) {
    toast.error(`Export failed: ${e?.message ?? "unknown error"}`);
  }
}
