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
import { FileText, Loader2 } from "lucide-react";
import StatCard from "../shared/StatCard";

interface FieldProps {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: "text" | "number" | "date";
  placeholder?: string;
  prefix?: string;
  hint?: string;
}

function Field({ label, value, onChange, type = "text", placeholder, prefix, hint }: FieldProps) {
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
          className={`w-full rounded-xl border border-border bg-background py-2 text-sm font-medium text-foreground ${prefix ? "pl-7 pr-3" : "px-3"}`}
        />
      </div>
    </label>
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
      </div>

      {/* Identity row */}
      <div className="card-elevated-lg p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Field
          label="Date of Sale"
          type="date"
          value={sheet.date_of_sale ?? ""}
          onChange={(v) => set("date_of_sale", v || null)}
          hint="The day the contract was signed. e.g. 04/22/2026"
        />
        <Field
          label="Customer Name"
          value={deal?.homeowner1 ?? ""}
          onChange={() => {}}
          placeholder="From deal"
          hint="Auto-filled from this deal's homeowner. Read-only."
        />
        <Field
          label="Job #"
          value={sheet.job_number ?? ""}
          onChange={(v) => set("job_number", v || null)}
          hint="Hover/CRM job number from the signed contract. e.g. 184502"
        />
        <Field
          label="Rep Last, First Initial"
          value={sheet.rep_last_first ?? ""}
          onChange={(v) => set("rep_last_first", v || null)}
          placeholder="Macroglou, N"
          hint="Your name as it appears on payroll. e.g. Macroglou, N"
        />
      </div>

      {/* Project Total panel */}
      <div className="card-elevated-lg p-5 space-y-4">
        <div className="rounded-xl bg-foreground/5 px-4 py-2 space-y-1">
          <h4 className="text-center text-xs font-extrabold uppercase tracking-wider text-foreground">Project Total</h4>
          <p className="text-center text-[10px] italic text-muted-foreground/80 leading-snug">
            Tip: Project Price is your 100% benchmark. Contract Total ÷ Project Price = % of Project, which picks your commission tier.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Left column: financials */}
          <div className="space-y-3">
            <Field
              label="Company Paid Finance Fees"
              type="number"
              prefix="$"
              value={sheet.company_paid_finance_fees}
              onChange={setNum("company_paid_finance_fees")}
              hint="Dealer fee DaBella absorbs for the finance plan. e.g. $4,200 on a 9.99% 15-yr"
            />
            <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Contract Total</span>
                <span className="font-bold text-foreground">{fmt(computed.contractTotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Contract Less Co. Paid Finance Fees</span>
                <span className="font-bold text-foreground">{fmt(computed.contractLessFees)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">% of Project Price After Finance Fees</span>
                <span className="font-bold text-primary">{computed.popPct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-xs pt-1.5 border-t border-border">
                <span className="text-muted-foreground">Commission % (from grid)</span>
                <span className="font-bold text-accent">{computed.commissionPct}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal Commission Due</span>
                <span className="font-bold text-foreground">{fmt(computed.subtotalCommissionDue)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="$ for $"
                type="number"
                prefix="$"
                value={sheet.dollar_for_dollar}
                onChange={setNum("dollar_for_dollar")}
                hint="Dollar-for-dollar add-on (referrals, demo $, etc.). e.g. $250"
              />
              <Field
                label="Bonus / Self-Gen Fee"
                type="number"
                prefix="$"
                value={sheet.bonus_self_gen_fee}
                onChange={setNum("bonus_self_gen_fee")}
                hint="Self-generated lead bonus or spiff. e.g. $500 for self-gen"
              />
            </div>

            <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Commission Due</span>
                <span className="text-xl font-extrabold font-display text-primary">{fmt(computed.totalCommissionDue)}</span>
              </div>
            </div>
          </div>

          {/* Right column: project price + promo + rep split */}
          <div className="space-y-3">
            <Field
              label="Project Price"
              type="number"
              prefix="$"
              value={sheet.project_price}
              onChange={setNum("project_price")}
              hint="The 100% (Option A / 'good') price — your benchmark for % of Project. e.g. $42,000"
            />
            <label className="block space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Promotion or Special Approved By
              </span>
              <span className="block text-[10px] leading-snug italic text-muted-foreground/80 -mt-0.5">
                Any extra % or override and who approved it. e.g. "Extra 1% POI Bonus — approved by RSM Smith"
              </span>
              <textarea
                value={sheet.promotion_note}
                onChange={(e) => set("promotion_note", e.target.value)}
                rows={2}
                placeholder='e.g. "Extra 1% for POI Bonus"'
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground"
              />
            </label>

            <div className="rounded-xl border border-border p-3 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Commission % Taken
              </p>
              <p className="text-[10px] italic text-muted-foreground/80 leading-snug -mt-1">
                How the commission splits between reps. Must total 100. e.g. 50 / 50
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Rep 1 %" type="number" value={sheet.rep1_pct} onChange={setNum("rep1_pct")} />
                <Field label="Rep 2 %" type="number" value={sheet.rep2_pct} onChange={setNum("rep2_pct")} />
              </div>
              {sheet.rep1_pct + sheet.rep2_pct !== 100 && (
                <p className="text-[11px] text-warning">⚠ Rep 1 + Rep 2 should total 100%</p>
              )}
            </div>
          </div>
        </div>

        {/* Per-rep payouts */}
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

      {/* Contract / Project line items */}
      <div className="card-elevated-lg p-5 space-y-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Line Items</h4>
          <p className="text-[10px] italic text-muted-foreground/80 leading-snug mt-0.5">
            <strong className="not-italic font-semibold">Contract</strong> = signed price for that line. <strong className="not-italic font-semibold">Project</strong> = 100% Option A price for that line. e.g. Contract Roof $28,500 / Project Roof $32,000.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-[11px] font-bold uppercase text-muted-foreground px-1">
          <span></span>
          <span className="text-center">Contract</span>
          <span className="text-center">Project</span>
        </div>
        {(["roof", "siding", "gutters"] as const).map((row) => (
          <div key={row} className="grid grid-cols-3 gap-3 items-center">
            <span className="text-sm font-bold uppercase text-foreground">{row}</span>
            <Field
              label=""
              type="number"
              prefix="$"
              value={sheet[`contract_${row}` as const]}
              onChange={setNum(`contract_${row}` as keyof CommissionSheetInputs)}
            />
            <Field
              label=""
              type="number"
              prefix="$"
              value={sheet[`project_${row}` as const]}
              onChange={setNum(`project_${row}` as keyof CommissionSheetInputs)}
            />
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Auto-saves to this deal • Commission % is looked up from your grid below
      </p>
    </div>
  );
});
