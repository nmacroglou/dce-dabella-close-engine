import { lazy, Suspense, memo, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Plus, Trash2, DollarSign, Clock, CheckCircle2, Download, Import, TrendingUp, Search, ArrowUp, ArrowDown, ArrowUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  useCommissionLedger,
  useUpsertPayment,
  useDeletePayment,
  type CommissionPayment,
} from "@/hooks/useCommissionLedger";
import { useDeals } from "@/hooks/useDeals";
import { useCommissionGrid } from "@/hooks/useCommissionGrid";
import { computeCommissionSheet } from "@/types/commission";
import { formatCurrency as fmtCurrency } from "@/lib/format";

// Heavy below-the-fold widgets — deferred to speed up Ledger first paint.
const PaymentCalendar = lazy(() => import("@/components/ledger/PaymentCalendar"));
const CashflowForecast = lazy(() => import("@/components/ledger/CashflowForecast"));

const LedgerSectionFallback = () => (
  <div className="rounded-2xl border border-hairline bg-card/50 p-8 grid place-items-center">
    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
  </div>
);

type FormState = Partial<CommissionPayment>;
type SortKey = "date" | "customer" | "status" | "amount";

const empty: FormState = {
  customer_name: "",
  job_number: "",
  sale_date: new Date().toISOString().slice(0, 10),
  expected_total: 0,
  expected_front: 0,
  expected_back: 0,
  front_paid_amount: 0,
  back_paid_amount: 0,
  notes: "",
};

export default function Ledger() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useCommissionLedger();
  const { data: deals = [] } = useDeals();
  const { data: grid } = useCommissionGrid();
  const upsert = useUpsertPayment();
  const del = useDeletePayment();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "front" | "paid">("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "date", dir: "desc" });
  const [exportAll, setExportAll] = useState(false);
  const autoImportRan = useRef(false);

  // Single-pass derive: per-row metadata + totals + monthly buckets.
  const { decorated, totals, monthly } = useMemo(() => {
    const nowMonth = new Date().toISOString().slice(0, 7);
    let expected = 0, frontExp = 0, backExp = 0, frontPaid = 0, backPaid = 0, paidThisMonth = 0;
    const m = new Map<string, { paid: number; expected: number; label: string }>();
    const decorated = rows.map((r) => {
      const eT = +r.expected_total || 0;
      const eF = +r.expected_front || 0;
      const eB = +r.expected_back || 0;
      const fP = +r.front_paid_amount || 0;
      const bP = +r.back_paid_amount || 0;
      expected += eT; frontExp += eF; backExp += eB; frontPaid += fP; backPaid += bP;
      if (r.front_paid_at && r.front_paid_at.startsWith(nowMonth)) paidThisMonth += fP;
      if (r.back_paid_at && r.back_paid_at.startsWith(nowMonth)) paidThisMonth += bP;
      const paid = fP + bP;
      const out = eT - paid;
      const status: "paid" | "front" | "pending" =
        out <= 0.01 ? "paid" : fP > 0 ? "front" : "pending";
      const d = r.sale_date || r.created_at?.slice(0, 10);
      if (d) {
        const key = d.slice(0, 7);
        let e = m.get(key);
        if (!e) {
          const [y, mo] = key.split("-");
          e = {
            paid: 0,
            expected: 0,
            label: new Date(+y, +mo - 1, 1).toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
          };
          m.set(key, e);
        }
        e.expected += eT;
        e.paid += paid;
      }
      const searchHay = `${r.customer_name ?? ""} ${r.job_number ?? ""}`.toLowerCase();
      return { row: r, paid, out, status, searchHay };
    });
    const totalPaid = frontPaid + backPaid;
    const outstanding = Math.max(0, expected - totalPaid);
    const dealsCount = rows.length;
    return {
      decorated,
      totals: {
        expected, frontExp, backExp, frontPaid, backPaid, totalPaid, outstanding,
        paidThisMonth, dealsCount, avgDeal: dealsCount ? expected / dealsCount : 0,
      },
      monthly: [...m.entries()].sort(([a], [b]) => a.localeCompare(b)),
    };
  }, [rows]);

  // Build the last-12-months series for the trend chart, including collection rate
  // and momentum vs prior 3 months. This is what powers the upgraded KPI graph.
  const trend = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; expected: number; paid: number; rate: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const hit = monthly.find(([k]) => k === key);
      const expected = hit?.[1].expected ?? 0;
      const paid = hit?.[1].paid ?? 0;
      months.push({
        key,
        label: d.toLocaleDateString(undefined, { month: "short" }),
        expected,
        paid,
        rate: expected > 0 ? Math.min(100, (paid / expected) * 100) : 0,
      });
    }
    const last3 = months.slice(-3);
    const prev3 = months.slice(-6, -3);
    const sum = (arr: typeof months) => arr.reduce((s, m) => s + m.paid, 0);
    const last3Paid = sum(last3);
    const prev3Paid = sum(prev3);
    const momentum = prev3Paid > 0 ? ((last3Paid - prev3Paid) / prev3Paid) * 100 : last3Paid > 0 ? 100 : 0;
    const collected = months.reduce((s, m) => s + m.paid, 0);
    const billed = months.reduce((s, m) => s + m.expected, 0);
    const avgRate = billed > 0 ? (collected / billed) * 100 : 0;
    const best = months.reduce((b, m) => (m.paid > b.paid ? m : b), months[0]);
    return { months, momentum, avgRate, best, last3Paid, prev3Paid };
  }, [monthly]);

  const filteredRows = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const base = (statusFilter === "all" && !q)
      ? decorated
      : decorated.filter((d) => {
          if (statusFilter !== "all" && d.status !== statusFilter) return false;
          if (q && !d.searchHay.includes(q)) return false;
          return true;
        });
    const mult = sort.dir === "asc" ? 1 : -1;
    const statusRank = { pending: 0, front: 1, paid: 2 } as const;
    const sorted = [...base].sort((a, b) => {
      let cmp = 0;
      switch (sort.key) {
        case "date": {
          const ad = a.row.sale_date ?? a.row.created_at ?? "";
          const bd = b.row.sale_date ?? b.row.created_at ?? "";
          cmp = ad < bd ? -1 : ad > bd ? 1 : 0;
          break;
        }
        case "customer":
          cmp = (a.row.customer_name ?? "").localeCompare(b.row.customer_name ?? "");
          break;
        case "status":
          cmp = statusRank[a.status] - statusRank[b.status];
          break;
        case "amount":
          cmp = (+a.row.expected_total || 0) - (+b.row.expected_total || 0);
          break;
      }
      return cmp * mult;
    });
    return sorted;
  }, [decorated, statusFilter, deferredSearch, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) => s.key === key
      ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
      : { key, dir: key === "date" || key === "amount" ? "desc" : "asc" });
  }

  function openNew() {
    setForm(empty);
    setOpen(true);
  }
  function openEdit(r: CommissionPayment) {
    setForm({ ...r });
    setOpen(true);
  }

  function handleSave() {
    upsert.mutate(form, {
      onSuccess: () => {
        setOpen(false);
        setForm(empty);
      },
    });
  }

  // Sync ledger with current deal states:
  //  - Insert ledger rows for won deals missing from ledger
  //  - Refresh expected amounts for existing rows (in case commission sheet changed)
  //  - Remove ledger rows whose underlying deal is no longer "won" AND has no payments recorded
  async function importWonDeals(opts: { silent?: boolean } = {}) {
    if (!grid || !user) return 0;
    const dealById = new Map(deals.map((d) => [d.id, d] as const));
    const wonDealIds = new Set(deals.filter((d) => d.stage === "won").map((d) => d.id));
    const existingByDeal = new Map(
      rows.filter((r) => r.deal_id).map((r) => [r.deal_id as string, r] as const),
    );

    // 1. Determine stale ledger rows (deal no longer won) with no payments → safe to delete
    const staleIds = rows
      .filter((r) => {
        if (!r.deal_id) return false;
        if (wonDealIds.has(r.deal_id)) return false;
        const paid = (+r.front_paid_amount || 0) + (+r.back_paid_amount || 0);
        return paid <= 0.01;
      })
      .map((r) => r.id);

    // 2. Build payloads for all current won deals (upsert refreshes amounts)
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
            // Preserve any recorded payments
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
      if (!opts.silent) toast.info("Ledger already in sync");
      return 0;
    }

    // Delete stale rows
    if (staleIds.length) {
      const { error } = await supabase.from("commission_payments").delete().in("id", staleIds);
      if (error) {
        toast.error(`Cleanup failed: ${error.message}`);
        return 0;
      }
    }

    // Split into updates (existing rows by id) and inserts (new rows)
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

    qc.invalidateQueries({ queryKey: ["commission_payments", user.id] });
    if (!opts.silent) {
      const parts: string[] = [];
      if (newCount) parts.push(`added ${newCount}`);
      const refreshed = payloads.length - newCount;
      if (refreshed) parts.push(`refreshed ${refreshed}`);
      if (staleIds.length) parts.push(`removed ${staleIds.length}`);
      toast.success(`Ledger synced: ${parts.join(" · ") || "no changes"}`);
    }
    return newCount + staleIds.length;
  }

  // Auto-sync won deals on first mount (wait until ledger has finished loading
  // to avoid racing the initial fetch and re-importing rows that already exist)
  useEffect(() => {
    if (autoImportRan.current) return;
    if (!user || !grid || !deals.length || isLoading) return;
    const existingDealIds = new Set(rows.map((r) => r.deal_id).filter(Boolean));
    const missing = deals.filter(
      (d) => d.stage === "won" && d.commission_sheet && !existingDealIds.has(d.id),
    );
    autoImportRan.current = true;
    if (missing.length > 0) {
      importWonDeals({ silent: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, grid, deals, rows, isLoading]);

  function exportCsv() {
    try {
      const source = exportAll ? decorated : filteredRows;
      if (!source.length) {
        toast.info("Nothing to export");
        return;
      }
      const headers = [
        "sale_date","customer","job_number","expected_total","expected_front","expected_back",
        "front_paid","front_paid_at","back_paid","back_paid_at","outstanding","notes",
      ];
      const lines = source.map(({ row: r, out }) => {
        return [
          r.sale_date ?? "", r.customer_name ?? "", r.job_number ?? "",
          r.expected_total, r.expected_front, r.expected_back,
          r.front_paid_amount, r.front_paid_at ?? "",
          r.back_paid_amount, r.back_paid_at ?? "",
          out, (r.notes ?? "").replace(/[\n,]/g, " "),
        ].join(",");
      });
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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-extrabold tracking-tight">Commission Ledger</h1>
            <p className="text-sm text-muted-foreground">Track every dollar owed, paid front-half and back-half, in real time.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => importWonDeals()} title="Pull in newly-won deals, refresh amounts, and remove entries for deals no longer marked won (only if no payments are recorded)">
              <Import className="h-4 w-4 mr-1.5" /> Resync deals
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4 mr-1.5" /> Add entry
            </Button>
          </div>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiTile icon={DollarSign} label="Total expected" value={fmtCurrency(totals.expected)} tone="primary"
            sub={`${totals.dealsCount} deal${totals.dealsCount === 1 ? "" : "s"} · avg ${fmtCurrency(totals.avgDeal)}`} />
          <KpiTile icon={CheckCircle2} label="Total paid" value={fmtCurrency(totals.totalPaid)} tone="success"
            sub={`${totals.expected ? Math.round((totals.totalPaid / totals.expected) * 100) : 0}% of expected`} />
          <KpiTile icon={Clock} label="Outstanding" value={fmtCurrency(totals.outstanding)} tone="warning"
            sub={`front exp ${fmtCurrency(totals.frontExp)} · back exp ${fmtCurrency(totals.backExp)}`} />
          <KpiTile icon={TrendingUp} label="Paid this month" value={fmtCurrency(totals.paidThisMonth)} tone="muted"
            sub={`front ${fmtCurrency(totals.frontPaid)} · back ${fmtCurrency(totals.backPaid)}`} />
        </div>

        {/* Progress bar */}
        {totals.expected > 0 && (
          <div className="rounded-2xl border border-hairline bg-card p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold uppercase tracking-wide">Collection progress</span>
              <span className="tabular-nums">{fmtCurrency(totals.totalPaid)} / {fmtCurrency(totals.expected)}</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
              <div className="bg-primary h-full" style={{ width: `${Math.min(100, (totals.frontPaid / totals.expected) * 100)}%` }}
                title={`Front paid ${fmtCurrency(totals.frontPaid)}`} />
              <div className="bg-success h-full" style={{ width: `${Math.min(100, (totals.backPaid / totals.expected) * 100)}%` }}
                title={`Back paid ${fmtCurrency(totals.backPaid)}`} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-primary" /> Front-half paid</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-success" /> Back-half paid</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-muted-foreground/30" /> Outstanding</span>
            </div>
          </div>
        )}

        {/* Trend */}
        {monthly.length > 0 && (
          <div className="rounded-2xl border border-hairline bg-card p-4 sm:p-6">
            <h2 className="text-sm font-bold text-foreground mb-4">Expected vs Paid by month</h2>
            <div className="flex items-end gap-3 h-40">
              {monthly.map(([k, v]) => (
                <div key={k} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex items-end gap-1 h-32">
                    <div
                      className="flex-1 rounded-t bg-primary/30"
                      style={{ height: `${(v.expected / maxBar) * 100}%` }}
                      title={`Expected: ${fmtCurrency(v.expected)}`}
                    />
                    <div
                      className="flex-1 rounded-t bg-success"
                      style={{ height: `${(v.paid / maxBar) * 100}%` }}
                      title={`Paid: ${fmtCurrency(v.paid)}`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{v.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/30" /> Expected</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-success" /> Paid</span>
            </div>
          </div>
        )}

        {/* Payday calendar */}
        <Suspense fallback={<LedgerSectionFallback />}>
          <PaymentCalendar rows={rows} />
        </Suspense>

        {/* Cashflow forecast */}
        <Suspense fallback={<LedgerSectionFallback />}>
          <CashflowForecast rows={rows} />
        </Suspense>

        {/* Filters + Table */}
        <div className="rounded-2xl border border-hairline bg-card overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 p-3 border-b border-hairline">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search customer or job #"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-1 text-xs">
              {(["all", "pending", "front", "paid"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-full font-medium capitalize transition ${
                    statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {s === "front" ? "Front paid" : s}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto cursor-pointer select-none">
              <input
                type="checkbox"
                checked={exportAll}
                onChange={(e) => setExportAll(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-hairline accent-primary"
              />
              Export all rows
            </label>
            <span className="text-xs text-muted-foreground">
              {filteredRows.length} of {rows.length}
            </span>
          </div>
          <VirtualLedgerTable
            rows={filteredRows}
            isLoading={isLoading}
            totalCount={rows.length}
            onEdit={openEdit}
            onDelete={(id) => del.mutate(id)}
            sort={sort}
            onToggleSort={toggleSort}
          />
        </div>
      </main>

      {/* Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit entry" : "New ledger entry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sale date">
                <Input type="date" value={form.sale_date ?? ""} onChange={(e) => setForm({ ...form, sale_date: e.target.value })} />
              </Field>
              <Field label="Job #">
                <Input value={form.job_number ?? ""} onChange={(e) => setForm({ ...form, job_number: e.target.value })} />
              </Field>
            </div>
            <Field label="Customer">
              <Input value={form.customer_name ?? ""} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Expected total">
                <Input type="number" value={form.expected_total ?? 0} onChange={(e) => setForm({ ...form, expected_total: Number(e.target.value) })} />
              </Field>
              <Field label="Expected front">
                <Input type="number" value={form.expected_front ?? 0} onChange={(e) => setForm({ ...form, expected_front: Number(e.target.value) })} />
              </Field>
              <Field label="Expected back">
                <Input type="number" value={form.expected_back ?? 0} onChange={(e) => setForm({ ...form, expected_back: Number(e.target.value) })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Front paid amount">
                <Input type="number" value={form.front_paid_amount ?? 0} onChange={(e) => setForm({ ...form, front_paid_amount: Number(e.target.value) })} />
              </Field>
              <Field label="Front paid date">
                <Input type="date" value={form.front_paid_at ?? ""} onChange={(e) => setForm({ ...form, front_paid_at: e.target.value || null })} />
              </Field>
              <Field label="Back paid amount">
                <Input type="number" value={form.back_paid_amount ?? 0} onChange={(e) => setForm({ ...form, back_paid_amount: Number(e.target.value) })} />
              </Field>
              <Field label="Back paid date">
                <Input type="date" value={form.back_paid_at ?? ""} onChange={(e) => setForm({ ...form, back_paid_at: e.target.value || null })} />
              </Field>
            </div>
            <Field label="Notes">
              <Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type DecoratedRow = {
  row: CommissionPayment;
  paid: number;
  out: number;
  status: "paid" | "front" | "pending";
  searchHay: string;
};

const GRID_COLS =
  "110px minmax(140px,1.5fr) minmax(90px,1fr) 110px 120px 120px 120px 110px 44px";
const ROW_HEIGHT = 52;

function VirtualLedgerTable({
  rows, isLoading, totalCount, onEdit, onDelete, sort, onToggleSort,
}: {
  rows: DecoratedRow[];
  isLoading: boolean;
  totalCount: number;
  onEdit: (r: CommissionPayment) => void;
  onDelete: (id: string) => void;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onToggleSort: (key: SortKey) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
    getItemKey: (i) => rows[i].row.id,
  });

  const items = virtualizer.getVirtualItems();
  const total = virtualizer.getTotalSize();

  const emptyState = !isLoading && totalCount === 0
    ? "No entries yet. Add one or sync your won deals."
    : !isLoading && rows.length === 0
    ? "No entries match your filters."
    : null;

  return (
    <div className="overflow-x-auto">
      <div
        ref={parentRef}
        className="min-w-[960px] overflow-y-auto"
        style={{
          maxHeight: 640,
          // Let small lists shrink naturally; sticky header still works.
          height: rows.length > 0 ? Math.min(rows.length * ROW_HEIGHT + 40, 640) : undefined,
          contain: "strict",
        }}
      >
        {/* Sticky header */}
        <div
          className="grid bg-muted/60 backdrop-blur text-xs uppercase tracking-wide text-muted-foreground border-b border-hairline sticky top-0 z-10"
          style={{ gridTemplateColumns: GRID_COLS }}
        >
          <SortHeader align="left" active={sort.key === "date"} dir={sort.dir} onClick={() => onToggleSort("date")}>Sale date</SortHeader>
          <SortHeader align="left" active={sort.key === "customer"} dir={sort.dir} onClick={() => onToggleSort("customer")}>Customer</SortHeader>
          <div className="text-left px-4 py-2.5">Job #</div>
          <SortHeader align="right" active={sort.key === "amount"} dir={sort.dir} onClick={() => onToggleSort("amount")}>Expected</SortHeader>
          <div className="text-right px-4 py-2.5">Front paid</div>
          <div className="text-right px-4 py-2.5">Back paid</div>
          <div className="text-right px-4 py-2.5">Outstanding</div>
          <SortHeader align="right" active={sort.key === "status"} dir={sort.dir} onClick={() => onToggleSort("status")}>Status</SortHeader>
          <div className="px-2 py-2.5" />
        </div>

        {isLoading && (
          <div className="text-center text-muted-foreground py-8 text-sm">Loading…</div>
        )}
        {emptyState && (
          <div className="text-center text-muted-foreground py-8 text-sm">{emptyState}</div>
        )}

        {!isLoading && rows.length > 0 && (
          <div style={{ height: total, position: "relative", width: "100%" }}>
            {items.map((vi) => {
              const d = rows[vi.index];
              return (
                <div
                  key={vi.key}
                  data-index={vi.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${vi.start}px)`,
                  }}
                >
                  <LedgerRow
                    r={d.row}
                    paid={d.paid}
                    out={d.out}
                    status={d.status}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const LedgerRow = memo(function LedgerRow({
  r, paid, out, status, onEdit, onDelete,
}: {
  r: CommissionPayment;
  paid: number;
  out: number;
  status: "paid" | "front" | "pending";
  onEdit: (r: CommissionPayment) => void;
  onDelete: (id: string) => void;
}) {
  const label = status === "paid" ? "Paid" : status === "front" ? "Front paid" : "Pending";
  const tone =
    status === "paid" ? "bg-success/10 text-success" :
    status === "front" ? "bg-primary/10 text-primary" :
    "bg-warning/10 text-warning";
  return (
    <div
      className="grid items-center border-t border-hairline hover:bg-muted/30 cursor-pointer text-sm"
      style={{ gridTemplateColumns: GRID_COLS, minHeight: ROW_HEIGHT }}
      onClick={() => onEdit(r)}
    >
      <div className="px-4 py-2.5">{r.sale_date ?? "—"}</div>
      <div className="px-4 py-2.5 font-medium truncate">{r.customer_name ?? "—"}</div>
      <div className="px-4 py-2.5 text-muted-foreground truncate">{r.job_number ?? "—"}</div>
      <div className="px-4 py-2.5 text-right tabular-nums">{fmtCurrency(r.expected_total)}</div>
      <div className="px-4 py-2.5 text-right tabular-nums">
        {fmtCurrency(r.front_paid_amount)}
        {r.front_paid_at && <div className="text-[10px] text-muted-foreground">{r.front_paid_at}</div>}
      </div>
      <div className="px-4 py-2.5 text-right tabular-nums">
        {fmtCurrency(r.back_paid_amount)}
        {r.back_paid_at && <div className="text-[10px] text-muted-foreground">{r.back_paid_at}</div>}
      </div>
      <div className="px-4 py-2.5 text-right tabular-nums font-semibold">{fmtCurrency(out)}</div>
      <div className="px-4 py-2.5 text-right">
        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${tone}`}>{label}</span>
      </div>
      <div className="px-2 py-2.5 text-right">
        <button
          className="text-muted-foreground hover:text-destructive p-1"
          onClick={(e) => { e.stopPropagation(); if (confirm("Delete entry?")) onDelete(r.id); }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SortHeader({
  align, active, dir, onClick, children,
}: {
  align: "left" | "right";
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-4 py-2.5 select-none uppercase tracking-wide text-xs font-semibold transition hover:text-foreground active:text-foreground touch-manipulation ${
        align === "right" ? "justify-end" : "justify-start"
      } ${active ? "text-foreground" : ""}`}
    >
      <span>{children}</span>
      <Icon className={`h-3 w-3 ${active ? "opacity-100" : "opacity-50"}`} />
    </button>
  );
}


function KpiTile({
  icon: Icon, label, value, sub, tone,
}: {
  icon: any; label: string; value: string; sub?: string;
  tone: "primary" | "success" | "warning" | "muted";
}) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    muted: "bg-muted text-foreground",
  };
  return (
    <div className="rounded-2xl border border-hairline bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${toneMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{label}</span>
      </div>
      <div className="text-xl font-display font-extrabold tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
