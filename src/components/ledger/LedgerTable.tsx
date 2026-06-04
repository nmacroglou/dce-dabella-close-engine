import { memo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency as fmtCurrency } from "@/lib/format";
import type { CommissionPayment } from "@/hooks/useCommissionLedger";
import type { DecoratedRow, LedgerSortKey, LedgerStatusFilter } from "@/lib/ledger/types";

const GRID_COLS =
  "110px minmax(140px,1.4fr) minmax(160px,1.6fr) minmax(90px,0.9fr) 110px 80px 110px 110px 110px 110px 110px 44px";
const ROW_HEIGHT = 56;

interface Props {
  rows: DecoratedRow[];
  totalCount: number;
  isLoading: boolean;
  search: string;
  onSearch: (v: string) => void;
  statusFilter: LedgerStatusFilter;
  onStatusFilter: (v: LedgerStatusFilter) => void;
  exportAll: boolean;
  onExportAll: (v: boolean) => void;
  sort: { key: LedgerSortKey; dir: "asc" | "desc" };
  onToggleSort: (k: LedgerSortKey) => void;
  onEdit: (r: CommissionPayment) => void;
  onDelete: (id: string) => void;
}

export default function LedgerTable({
  rows, totalCount, isLoading, search, onSearch, statusFilter, onStatusFilter,
  exportAll, onExportAll, sort, onToggleSort, onEdit, onDelete,
}: Props) {
  return (
    <div className="rounded-2xl border border-hairline bg-card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-hairline">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search customer or job #"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <div className="flex items-center gap-1 text-xs">
          {(["all", "pending", "front", "paid"] as const).map((s) => (
            <button
              key={s}
              onClick={() => onStatusFilter(s)}
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
            onChange={(e) => onExportAll(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-hairline accent-primary"
          />
          Export all rows
        </label>
        <span className="text-xs text-muted-foreground">
          {rows.length} of {totalCount}
        </span>
      </div>
      <VirtualLedgerTable
        rows={rows}
        isLoading={isLoading}
        totalCount={totalCount}
        onEdit={onEdit}
        onDelete={onDelete}
        sort={sort}
        onToggleSort={onToggleSort}
      />
    </div>
  );
}

function VirtualLedgerTable({
  rows, isLoading, totalCount, onEdit, onDelete, sort, onToggleSort,
}: {
  rows: DecoratedRow[];
  isLoading: boolean;
  totalCount: number;
  onEdit: (r: CommissionPayment) => void;
  onDelete: (id: string) => void;
  sort: { key: LedgerSortKey; dir: "asc" | "desc" };
  onToggleSort: (key: LedgerSortKey) => void;
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
        className="min-w-[1280px] overflow-y-auto"
        style={{
          maxHeight: 640,
          height: rows.length > 0 ? Math.min(rows.length * ROW_HEIGHT + 40, 640) : undefined,
          contain: "strict",
        }}
      >
        <div
          className="grid bg-muted/60 backdrop-blur text-xs uppercase tracking-wide text-muted-foreground border-b border-hairline sticky top-0 z-10"
          style={{ gridTemplateColumns: GRID_COLS }}
        >
          <SortHeader align="left" active={sort.key === "date"} dir={sort.dir} onClick={() => onToggleSort("date")}>Sale date</SortHeader>
          <SortHeader align="left" active={sort.key === "customer"} dir={sort.dir} onClick={() => onToggleSort("customer")}>Customer</SortHeader>
          <div className="text-left px-4 py-2.5">Address</div>
          <div className="text-left px-4 py-2.5">Job #</div>
          <div className="text-right px-4 py-2.5">Closed</div>
          <div className="text-right px-4 py-2.5">Comm %</div>
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
                    address={d.address}
                    closedAmount={d.closedAmount}
                    commissionPct={d.commissionPct}
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
  r, out, status, address, closedAmount, commissionPct, onEdit, onDelete,
}: {
  r: CommissionPayment;
  paid: number;
  out: number;
  status: "paid" | "front" | "pending";
  address: string;
  closedAmount: number;
  commissionPct: number;
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
      className="grid items-center border-t border-hairline hover:bg-muted/30 cursor-pointer text-sm transition-colors"
      style={{ gridTemplateColumns: GRID_COLS, minHeight: ROW_HEIGHT }}
      onClick={() => onEdit(r)}
    >
      <div className="px-4 py-2.5">{r.sale_date ?? "—"}</div>
      <div className="px-4 py-2.5 font-medium truncate">{r.customer_name ?? "—"}</div>
      <div className="px-4 py-2.5 text-muted-foreground truncate" title={address || undefined}>
        {address || "—"}
      </div>
      <div className="px-4 py-2.5 text-muted-foreground truncate">{r.job_number ?? "—"}</div>
      <div className="px-4 py-2.5 text-right tabular-nums">
        {closedAmount > 0 ? fmtCurrency(closedAmount) : "—"}
      </div>
      <div className="px-4 py-2.5 text-right tabular-nums">
        {commissionPct > 0
          ? <span className="font-semibold text-accent">{commissionPct}%</span>
          : <span className="text-muted-foreground">—</span>}
      </div>
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
