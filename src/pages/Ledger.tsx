import { useMemo, useState } from "react";
import { Plus, Trash2, DollarSign, Wallet, Clock, CheckCircle2, Download, Import } from "lucide-react";
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
import { fmt as fmtCurrency } from "@/lib/format";

type FormState = Partial<CommissionPayment>;

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
  const { data: rows = [], isLoading } = useCommissionLedger();
  const { data: deals = [] } = useDeals();
  const { data: grid } = useCommissionGrid();
  const upsert = useUpsertPayment();
  const del = useDeletePayment();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);

  const totals = useMemo(() => {
    const expected = rows.reduce((s, r) => s + Number(r.expected_total || 0), 0);
    const frontExp = rows.reduce((s, r) => s + Number(r.expected_front || 0), 0);
    const backExp = rows.reduce((s, r) => s + Number(r.expected_back || 0), 0);
    const frontPaid = rows.reduce((s, r) => s + Number(r.front_paid_amount || 0), 0);
    const backPaid = rows.reduce((s, r) => s + Number(r.back_paid_amount || 0), 0);
    const totalPaid = frontPaid + backPaid;
    const outstanding = Math.max(0, expected - totalPaid);
    return { expected, frontExp, backExp, frontPaid, backPaid, totalPaid, outstanding };
  }, [rows]);

  const monthly = useMemo(() => {
    const m = new Map<string, { paid: number; expected: number; label: string }>();
    rows.forEach((r) => {
      const d = r.sale_date || r.created_at?.slice(0, 10);
      if (!d) return;
      const key = d.slice(0, 7);
      if (!m.has(key)) {
        const [y, mo] = key.split("-");
        const label = new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString(undefined, {
          month: "short",
          year: "2-digit",
        });
        m.set(key, { paid: 0, expected: 0, label });
      }
      const e = m.get(key)!;
      e.expected += Number(r.expected_total || 0);
      e.paid += Number(r.front_paid_amount || 0) + Number(r.back_paid_amount || 0);
    });
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  const maxBar = Math.max(1, ...monthly.map(([, v]) => Math.max(v.expected, v.paid)));

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

  // Import won deals not yet in ledger
  function importWonDeals() {
    if (!grid) return;
    const existingDealIds = new Set(rows.map((r) => r.deal_id).filter(Boolean));
    const wonDeals = deals.filter(
      (d) => d.stage === "won" && d.commission_sheet && !existingDealIds.has(d.id),
    );
    if (!wonDeals.length) {
      return;
    }
    let imported = 0;
    wonDeals.forEach((d) => {
      try {
        const c = computeCommissionSheet(d.commission_sheet, grid.tiers, grid.front_end_pct);
        upsert.mutate({
          deal_id: d.id,
          customer_name: [d.homeowner1, d.homeowner2].filter(Boolean).join(" & ") || "Unnamed",
          job_number: d.commission_sheet.job_number ?? "",
          sale_date: d.commission_sheet.date_of_sale ?? d.closed_at?.slice(0, 10) ?? null,
          expected_total: c.rep1Commission,
          expected_front: c.rep1Advance,
          expected_back: c.rep1Earned,
          front_paid_amount: 0,
          back_paid_amount: 0,
        });
        imported++;
      } catch {}
    });
  }

  function exportCsv() {
    const headers = [
      "sale_date","customer","job_number","expected_total","expected_front","expected_back",
      "front_paid","front_paid_at","back_paid","back_paid_at","outstanding","notes",
    ];
    const lines = rows.map((r) => {
      const out = Number(r.expected_total || 0) - Number(r.front_paid_amount || 0) - Number(r.back_paid_amount || 0);
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
    a.download = `commission-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
            <Button variant="outline" size="sm" onClick={importWonDeals}>
              <Import className="h-4 w-4 mr-1.5" /> Import won deals
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
          <KpiTile icon={DollarSign} label="Total expected" value={fmtCurrency(totals.expected)} tone="primary" />
          <KpiTile icon={CheckCircle2} label="Total paid" value={fmtCurrency(totals.totalPaid)} tone="success"
            sub={`${totals.expected ? Math.round((totals.totalPaid / totals.expected) * 100) : 0}% of expected`} />
          <KpiTile icon={Clock} label="Outstanding" value={fmtCurrency(totals.outstanding)} tone="warning" />
          <KpiTile icon={Wallet} label="Front / Back paid"
            value={`${fmtCurrency(totals.frontPaid)} / ${fmtCurrency(totals.backPaid)}`} tone="muted"
            sub={`exp ${fmtCurrency(totals.frontExp)} / ${fmtCurrency(totals.backExp)}`} />
        </div>

        {/* Trend */}
        {monthly.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
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

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5">Sale date</th>
                  <th className="text-left px-4 py-2.5">Customer</th>
                  <th className="text-left px-4 py-2.5">Job #</th>
                  <th className="text-right px-4 py-2.5">Expected</th>
                  <th className="text-right px-4 py-2.5">Front paid</th>
                  <th className="text-right px-4 py-2.5">Back paid</th>
                  <th className="text-right px-4 py-2.5">Outstanding</th>
                  <th className="text-right px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={9} className="text-center text-muted-foreground py-8">Loading…</td></tr>
                )}
                {!isLoading && rows.length === 0 && (
                  <tr><td colSpan={9} className="text-center text-muted-foreground py-8">
                    No entries yet. Add one or import your won deals.
                  </td></tr>
                )}
                {rows.map((r) => {
                  const paid = Number(r.front_paid_amount || 0) + Number(r.back_paid_amount || 0);
                  const out = Number(r.expected_total || 0) - paid;
                  const status =
                    out <= 0.01 ? "Paid" :
                    Number(r.front_paid_amount || 0) > 0 ? "Front paid" : "Pending";
                  const tone =
                    status === "Paid" ? "bg-success/10 text-success" :
                    status === "Front paid" ? "bg-primary/10 text-primary" :
                    "bg-warning/10 text-warning";
                  return (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/30 cursor-pointer"
                        onClick={() => openEdit(r)}>
                      <td className="px-4 py-2.5">{r.sale_date ?? "—"}</td>
                      <td className="px-4 py-2.5 font-medium">{r.customer_name ?? "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.job_number ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{fmtCurrency(r.expected_total)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {fmtCurrency(r.front_paid_amount)}
                        {r.front_paid_at && <div className="text-[10px] text-muted-foreground">{r.front_paid_at}</div>}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {fmtCurrency(r.back_paid_amount)}
                        {r.back_paid_at && <div className="text-[10px] text-muted-foreground">{r.back_paid_at}</div>}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{fmtCurrency(out)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${tone}`}>{status}</span>
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <button
                          className="text-muted-foreground hover:text-destructive p-1"
                          onClick={(e) => { e.stopPropagation(); if (confirm("Delete entry?")) del.mutate(r.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
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
    <div className="rounded-2xl border border-border bg-card p-4">
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
