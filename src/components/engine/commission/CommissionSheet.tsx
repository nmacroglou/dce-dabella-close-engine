import { memo, useEffect, useState, useMemo, useRef } from "react";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import { useDeal, useUpdateDeal } from "@/hooks/useDeals";
import { useCommissionGrid } from "@/hooks/useCommissionGrid";
import {
  computeCommissionSheet,
  emptyCommissionSheet,
  type CommissionSheetInputs,
} from "@/types/commission";
import { fmt } from "@/lib/format";
import { FileText, Loader2, Sparkles } from "lucide-react";
import StatCard from "../shared/StatCard";

interface FieldProps {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: "text" | "number" | "date";
  placeholder?: string;
  prefix?: string;
  hint?: string;
  readOnly?: boolean;
}

function Field({ label, value, onChange, type = "text", placeholder, prefix, hint, readOnly }: FieldProps) {
  return (
    <label className="space-y-1 block">
      {label && (
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">{label}</span>
      )}
      {hint && (
        <span className="block text-[10px] leading-snug text-muted-foreground/80 italic -mt-0.5">{hint}</span>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>
        )}
        <input
          type={type}
          value={value === 0 && type === "number" ? "" : value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full rounded-xl border ${readOnly ? "border-dashed border-border/60 bg-muted/40 text-muted-foreground" : "border-border bg-background text-foreground"} py-2 text-sm font-medium ${prefix ? "pl-7 pr-3" : "px-3"}`}
        />
      </div>
    </label>
  );
}

/** A single "trade" row: Worth + Sold For — the two numbers the rep actually knows. */
function TradeRow({
  label,
  worth,
  soldFor,
  onWorthChange,
  onSoldChange,
}: {
  label: string;
  worth: number;
  soldFor: number;
  onWorthChange: (v: string) => void;
  onSoldChange: (v: string) => void;
}) {
  const pct = worth > 0 ? (soldFor / worth) * 100 : 0;
  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold uppercase tracking-wide text-foreground">{label}</span>
        {worth > 0 && soldFor > 0 && (
          <span className="text-[10px] font-bold uppercase text-primary">
            {pct.toFixed(0)}% of worth
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Worth ($)"
          type="number"
          prefix="$"
          value={worth}
          onChange={onWorthChange}
          hint="Full Option A / 100% price"
        />
        <Field
          label="Sold For ($)"
          type="number"
          prefix="$"
          value={soldFor}
          onChange={onSoldChange}
          hint="What customer signed"
        />
      </div>
    </div>
  );
}

export default memo(function CommissionSheet() {
  const { activeDealId } = useActiveDeal();
  const { data: deal, isLoading: dealLoading } = useDeal(activeDealId);
  const { data: grid, isLoading: gridLoading } = useCommissionGrid();
  const updateDeal = useUpdateDeal();

  const [sheet, setSheet] = useState<CommissionSheetInputs>(emptyCommissionSheet());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

  // Hydrate from saved deal + auto-fill from engine_state when fields are blank
  useEffect(() => {
    if (!deal) return;
    const saved = (deal.commission_sheet ?? emptyCommissionSheet()) as CommissionSheetInputs;
    const engine = deal.engine_state ?? {};
    const auto: CommissionSheetInputs = {
      ...emptyCommissionSheet(),
      ...saved,
      project_price: saved.project_price || Number(engine.priceA ?? 0),
      contract_roof:
        saved.contract_roof ||
        (deal.selected_option === "B"
          ? Number(deal.price_b ?? 0)
          : deal.selected_option === "C"
          ? Number(deal.price_c ?? 0)
          : Number(deal.price_a ?? 0)),
      project_roof: saved.project_roof || Number(engine.priceA ?? 0),
    };
    setSheet(auto);
    hydrated.current = true;
  }, [deal]);

  // Debounced auto-save
  useEffect(() => {
    if (!hydrated.current || !activeDealId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateDeal.mutate({ id: activeDealId, updates: { commission_sheet: sheet } as never });
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet, activeDealId]);

  const computed = useMemo(
    () => computeCommissionSheet(sheet, grid?.tiers ?? [], grid?.front_end_pct ?? 50),
    [sheet, grid]
  );

  const set = <K extends keyof CommissionSheetInputs>(k: K, v: CommissionSheetInputs[K]) =>
    setSheet((prev) => ({ ...prev, [k]: v }));

  const setNum = (k: keyof CommissionSheetInputs) => (v: string) =>
    set(k as never, (Number(v) || 0) as never);

  if (!activeDealId) {
    return (
      <div className="card-elevated-lg p-8 text-center space-y-2">
        <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm font-semibold text-foreground">Select a deal to build its commission sheet</p>
        <p className="text-xs text-muted-foreground">Open the Deals page and pick a homeowner.</p>
      </div>
    );
  }

  if (dealLoading || gridLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header band */}
      <div className="rounded-2xl border border-border bg-success/10 p-4">
        <h3 className="text-center text-sm font-extrabold uppercase tracking-wider text-foreground">
          Hover Commission Sheet
        </h3>
        <p className="text-center text-[11px] text-muted-foreground mt-1">
          Just enter <strong className="text-foreground">Worth</strong> and <strong className="text-foreground">Sold For</strong> per trade — everything else fills in automatically.
        </p>
      </div>

      {/* Identity row */}
      <div className="card-elevated-lg p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Field
          label="Date of Sale"
          type="date"
          value={sheet.date_of_sale ?? ""}
          onChange={(v) => set("date_of_sale", v || null)}
          hint="The day the contract was signed"
        />
        <Field
          label="Customer Name"
          value={deal?.homeowner1 ?? ""}
          onChange={() => {}}
          placeholder="From deal"
          readOnly
          hint="Auto from this deal"
        />
        <Field
          label="Job #"
          value={sheet.job_number ?? ""}
          onChange={(v) => set("job_number", v || null)}
          hint="Hover/CRM job number e.g. 184502"
        />
        <Field
          label="Rep Last, First Initial"
          value={sheet.rep_last_first ?? ""}
          onChange={(v) => set("rep_last_first", v || null)}
          placeholder="Macroglou, N"
          hint="As it appears on payroll"
        />
      </div>

      {/* PRIMARY INPUTS — Trades (Worth + Sold For) */}
      <div className="card-elevated-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
            Step 1 — Enter Each Trade
          </h4>
        </div>
        <p className="text-[11px] text-muted-foreground -mt-1">
          For each trade you sold: enter what it was <em>worth</em> (full price) and what it <em>sold for</em> (signed price). Skip any trade that wasn't part of the deal.
        </p>

        <div className="grid gap-3 md:grid-cols-3">
          <TradeRow
            label="Roof"
            worth={sheet.project_roof}
            soldFor={sheet.contract_roof}
            onWorthChange={setNum("project_roof")}
            onSoldChange={setNum("contract_roof")}
          />
          <TradeRow
            label="Siding"
            worth={sheet.project_siding}
            soldFor={sheet.contract_siding}
            onWorthChange={setNum("project_siding")}
            onSoldChange={setNum("contract_siding")}
          />
          <TradeRow
            label="Gutters"
            worth={sheet.project_gutters}
            soldFor={sheet.contract_gutters}
            onWorthChange={setNum("project_gutters")}
            onSoldChange={setNum("contract_gutters")}
          />
        </div>

        {/* Auto totals from trades */}
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Worth</p>
            <p className="text-lg font-extrabold font-display text-foreground">{fmt(computed.projectTotal)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Sold For</p>
            <p className="text-lg font-extrabold font-display text-foreground">{fmt(computed.contractTotal)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">% of Worth</p>
            <p className="text-lg font-extrabold font-display text-primary">{computed.popPct.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Commission %</p>
            <p className="text-lg font-extrabold font-display text-accent">{computed.commissionPct}%</p>
          </div>
        </div>
      </div>

      {/* STEP 2 — Adjustments */}
      <div className="card-elevated-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
            Step 2 — Adjustments (optional)
          </h4>
        </div>

        {/* Active monthly promos quick-pick */}
        {grid?.promos?.some((p) => p.active) && (
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
              This Month's Promos · tap to apply
            </p>
            <div className="flex flex-wrap gap-2">
              {grid.promos
                .filter((p) => p.active)
                .map((p) => {
                  const applied =
                    sheet.promotion_pct_override === p.override_pct &&
                    sheet.promotion_note.includes(p.label);
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (applied) {
                          set("promotion_pct_override", 0);
                          set("promotion_note", "");
                        } else {
                          set("promotion_pct_override", p.override_pct);
                          set(
                            "promotion_note",
                            `${p.product}: ${p.label}${p.details ? ` — ${p.details}` : ""}`
                          );
                        }
                      }}
                      className={`text-left rounded-lg px-3 py-2 text-xs font-semibold border transition-colors ${
                        applied
                          ? "bg-accent text-accent-foreground border-accent"
                          : "bg-background border-border hover:border-accent/50 text-foreground"
                      }`}
                    >
                      <span className="block">
                        {p.product} · {p.label || "(no label)"}
                      </span>
                      {p.override_pct > 0 && (
                        <span className="block text-[10px] opacity-80 mt-0.5">
                          +{p.override_pct}% override
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Left column: financial inputs */}
          <div className="space-y-3">
            <Field
              label="Company Paid Finance Fees"
              type="number"
              prefix="$"
              value={sheet.company_paid_finance_fees}
              onChange={setNum("company_paid_finance_fees")}
              hint="Dealer fee DaBella absorbs. Lowers commissionable $ but NOT your POP tier."
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="$ for $"
                type="number"
                prefix="$"
                value={sheet.dollar_for_dollar}
                onChange={setNum("dollar_for_dollar")}
                hint="Referrals, demo $, etc. Splits per rep %."
              />
              <Field
                label="Bonus / Self-Gen"
                type="number"
                prefix="$"
                value={sheet.bonus_self_gen_fee}
                onChange={setNum("bonus_self_gen_fee")}
                hint="Self-gen bonus or spiff"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Promotion / Override %"
                type="number"
                value={sheet.promotion_pct_override}
                onChange={setNum("promotion_pct_override")}
                hint="e.g. 1 = +1% POI bump. Replaces grid % if > 0."
              />
              <label className="space-y-1 block">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Bonus Goes To
                </span>
                <span className="block text-[10px] leading-snug text-muted-foreground/80 italic -mt-0.5">
                  Who keeps the self-gen
                </span>
                <select
                  value={sheet.self_gen_to_rep}
                  onChange={(e) => set("self_gen_to_rep", Number(e.target.value) as 0 | 1 | 2)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground"
                >
                  <option value={0}>Split per rep %</option>
                  <option value={1}>Rep 1 (100%)</option>
                  <option value={2}>Rep 2 (100%)</option>
                </select>
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Promotion / Special Approved By
              </span>
              <span className="block text-[10px] leading-snug italic text-muted-foreground/80 -mt-0.5">
                Note who approved any extra % or override
              </span>
              <textarea
                value={sheet.promotion_note}
                onChange={(e) => set("promotion_note", e.target.value)}
                rows={2}
                placeholder='e.g. "Extra 1% for POI Bonus — RSM Smith"'
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground"
              />
            </label>
          </div>

          {/* Right column: cascading math (read-only) */}
          <div className="space-y-3">
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Auto-calculated
              </p>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Sold For Total</span>
                <span className="font-bold text-foreground">{fmt(computed.contractTotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">− Finance Fees</span>
                <span className="font-bold text-foreground">−{fmt(sheet.company_paid_finance_fees)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1.5 border-t border-border">
                <span className="text-muted-foreground">Net Sold (after fees)</span>
                <span className="font-bold text-foreground">{fmt(computed.contractLessFees)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">% of Worth (POP)</span>
                <span className="font-bold text-primary">{computed.popPct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Commission % {computed.commissionPctSource === "override" ? "(override)" : "(from grid)"}
                </span>
                <span className="font-bold text-accent">{computed.commissionPct}%</span>
              </div>
              <div className="flex justify-between text-xs pt-1.5 border-t border-border">
                <span className="text-muted-foreground">Subtotal Commission</span>
                <span className="font-bold text-foreground">{fmt(computed.subtotalCommissionDue)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">+ $ for $ / Bonuses</span>
                <span className="font-bold text-foreground">+{fmt(sheet.dollar_for_dollar + sheet.bonus_self_gen_fee)}</span>
              </div>
            </div>

            <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Commission Due</span>
                <span className="text-2xl font-extrabold font-display text-primary">{fmt(computed.totalCommissionDue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 3 — Split */}
      <div className="card-elevated-lg p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
            Step 3 — Split Between Reps
          </h4>
        </div>
        <p className="text-[11px] text-muted-foreground -mt-1">
          Solo deal? Leave Rep 1 at 100. Two reps? Set the split (must total 100). e.g. 50 / 50
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <Field label="Rep 1 %" type="number" value={sheet.rep1_pct} onChange={setNum("rep1_pct")} />
          <Field label="Rep 2 %" type="number" value={sheet.rep2_pct} onChange={setNum("rep2_pct")} />
        </div>
        {sheet.rep1_pct + sheet.rep2_pct !== 100 && (
          <p className="text-[11px] text-warning">⚠ Rep 1 + Rep 2 should total 100%</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          {[
            { label: "Rep 1", commission: computed.rep1Commission, advance: computed.rep1Advance, earned: computed.rep1Earned },
            { label: "Rep 2", commission: computed.rep2Commission, advance: computed.rep2Advance, earned: computed.rep2Earned },
          ].map((r) => (
            <div key={r.label} className="rounded-2xl border border-border bg-card p-4 space-y-2">
              <p className="text-xs font-extrabold uppercase tracking-wider text-foreground">{r.label}</p>
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="Actual Due" value={fmt(r.commission)} accent />
                <StatCard label={`Advance (${grid?.front_end_pct ?? 50}%)`} value={fmt(r.advance)} sub="Front-end" />
                <StatCard label="Earned" value={fmt(r.earned)} sub="On completion" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Auto-saves to this deal • Commission % is looked up from your grid below
      </p>
    </div>
  );
});
