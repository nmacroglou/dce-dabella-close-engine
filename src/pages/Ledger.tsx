import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Download, Import, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnerScope } from "@/contexts/OwnerScopeContext";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { useUpsertPayment, useDeletePayment, type CommissionPayment } from "@/hooks/useCommissionLedger";
import { useLedgerData } from "@/hooks/useLedgerData";
import LedgerKpiTiles from "@/components/ledger/LedgerKpiTiles";
import LedgerTrendChart from "@/components/ledger/LedgerTrendChart";
import LedgerTable from "@/components/ledger/LedgerTable";
import LedgerEntryDialog, { type LedgerFormState } from "@/components/ledger/LedgerEntryDialog";
import { syncWonDealsToLedger } from "@/lib/ledger/syncWonDeals";
import { exportLedgerCsv } from "@/lib/ledger/exportCsv";

// Heavy below-the-fold widgets — deferred to speed up Ledger first paint.
const PaymentCalendar = lazy(() => import("@/components/ledger/PaymentCalendar"));
const CashflowForecast = lazy(() => import("@/components/ledger/CashflowForecast"));

const LedgerSectionFallback = () => (
  <div className="rounded-2xl border border-hairline bg-card/50 p-8 grid place-items-center">
    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
  </div>
);

const empty: LedgerFormState = {
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
  const { scope } = useOwnerScope();
  const viewingSelf = scope === "me";
  const qc = useQueryClient();
  const upsert = useUpsertPayment();
  const del = useDeletePayment();

  const {
    rows, deals, grid, isLoading,
    decorated, totals, trend, filteredRows,
    statusFilter, setStatusFilter,
    search, setSearch,
    sort, toggleSort,
  } = useLedgerData();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LedgerFormState>(empty);
  const [exportAll, setExportAll] = useState(false);
  const autoImportRan = useRef(false);

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

  async function runSync(opts: { silent?: boolean } = {}) {
    if (!grid || !user) return 0;
    if (!viewingSelf) {
      if (!opts.silent) toast.info("Switch to ‘Only mine’ to sync your own deals into the ledger.");
      return 0;
    }
    const changed = await syncWonDealsToLedger({ user, deals, rows, grid, silent: opts.silent });
    if (changed > 0) {
      qc.invalidateQueries({ queryKey: ["commission_payments", user.id] });
    }
    return changed;
  }

  // Auto-sync once after initial load so the ledger always reflects current won deals.
  // Only when viewing your own data — never write rows under another rep.
  useEffect(() => {
    if (autoImportRan.current) return;
    if (!viewingSelf) return;
    if (!user || !grid || !deals.length || isLoading) return;
    const existingDealIds = new Set(rows.map((r) => r.deal_id).filter(Boolean));
    const missing = deals.filter(
      (d) => d.stage === "won" && d.commission_sheet && !existingDealIds.has(d.id),
    );
    autoImportRan.current = true;
    if (missing.length > 0) {
      runSync({ silent: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, grid, deals, rows, isLoading, viewingSelf]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-extrabold tracking-tight">Commission Ledger</h1>
            <p className="text-sm text-muted-foreground">
              Track every dollar owed, paid front-half and back-half, in real time.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => runSync()}
              title="Pull in newly-won deals, refresh amounts, and remove entries for deals no longer marked won (only if no payments are recorded)"
            >
              <Import className="h-4 w-4 mr-1.5" /> Resync deals
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => exportLedgerCsv(exportAll ? decorated : filteredRows, exportAll)}
              disabled={!rows.length}
            >
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4 mr-1.5" /> Add entry
            </Button>
          </div>
        </div>

        <LedgerKpiTiles totals={totals} />

        {totals.expected > 0 && (
          <LedgerTrendChart
            data={trend.months}
            avgRate={trend.avgRate}
            momentum={trend.momentum}
            best={trend.best}
          />
        )}

        <Suspense fallback={<LedgerSectionFallback />}>
          <PaymentCalendar rows={rows} />
        </Suspense>

        <Suspense fallback={<LedgerSectionFallback />}>
          <CashflowForecast rows={rows} />
        </Suspense>

        <LedgerTable
          rows={filteredRows}
          totalCount={rows.length}
          isLoading={isLoading}
          search={search}
          onSearch={setSearch}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          exportAll={exportAll}
          onExportAll={setExportAll}
          sort={sort}
          onToggleSort={toggleSort}
          onEdit={openEdit}
          onDelete={(id) => del.mutate(id)}
        />
      </main>

      <LedgerEntryDialog
        open={open}
        onOpenChange={setOpen}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        isPending={upsert.isPending}
      />
    </div>
  );
}
