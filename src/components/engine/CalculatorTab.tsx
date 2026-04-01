import { EngineTabProps } from "@/hooks/useCloseEngine";
import { PRODUCT_OPTIONS } from "@/data/products";
import { DollarSign, Zap, TrendingUp, BarChart3, Sparkles } from "lucide-react";
import { fmt } from "@/lib/format";
import InputField from "./shared/InputField";
import type { OptionComputed } from "@/hooks/useCloseEngine";

function OptionOutputCard({
  label,
  name,
  opt,
  energySavings,
  accent,
}: {
  label: string;
  name: string;
  opt: OptionComputed;
  energySavings: number;
  accent: string;
}) {
  return (
    <div className="card-elevated-lg p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className={`text-sm font-extrabold uppercase tracking-wider ${accent}`}>{label}</h4>
        <span className="text-2xl font-extrabold text-foreground">{fmt(opt.price)}</span>
      </div>
      <p className="text-sm text-muted-foreground truncate">{name}</p>

      {/* Monthly */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
        <span className="text-sm font-semibold text-muted-foreground">Monthly Payment</span>
        <span className="text-base font-bold text-foreground">{fmt(opt.monthly)}/mo</span>
      </div>

      {/* Promo lanes */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <DollarSign className="h-4 w-4 text-primary" /> Promotional Financing Options
        </p>
        <PromoLine label="Efficiency Discount" price={opt.efficiencyPrice} monthly={opt.monthlyEfficiency} />
        <PromoLine label="Standby Discount" price={opt.standbyPrice} monthly={opt.monthlyStandby} />
        <PromoLine label="6 Month Deferred" price={opt.deferred6Price} monthly={opt.monthlyDeferred6} />
        <PromoLine label="12 Month Deferred" price={opt.deferred12Price} monthly={opt.monthlyDeferred12} />
      </div>

      {/* Value stack */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-accent" /> Value Stack Breakdown
        </p>
        <ValueLine icon={BarChart3} label="Home Value Increase (ROI)" value={`+${fmt(opt.roiValue)}`} color="text-primary" />
        <ValueLine icon={Zap} label="10-Year Energy Savings" value={`+${fmt(energySavings)}`} color="text-accent" />
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" /> Net Effective Cost
          </span>
          <span className="text-base font-extrabold text-primary">{fmt(opt.netCost)}</span>
        </div>
      </div>
    </div>
  );
}

function PromoLine({ label, price, monthly }: { label: string; price: number; monthly: number }) {
  return (
    <div className="flex items-center justify-between py-2 px-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="text-sm font-bold text-foreground">{fmt(price)}</span>
        <span className="text-xs text-muted-foreground ml-2">{fmt(monthly)}/mo</span>
      </div>
    </div>
  );
}

function ValueLine({ icon: Icon, label, value, color }: { icon: typeof BarChart3; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-4 rounded-lg bg-muted/40">
      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
        <Icon className={`h-4 w-4 ${color}`} /> {label}
      </span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}

const OPTION_ACCENTS = { A: "text-primary", B: "text-accent", C: "text-orange-500" } as const;

export default function CalculatorTab({ state, computed, update }: EngineTabProps) {
  const optionEntries: { key: "A" | "B" | "C"; name: string; nameKey: keyof typeof state; priceKey: keyof typeof state }[] = [
    { key: "A", name: state.optionAName, nameKey: "optionAName", priceKey: "priceA" },
    { key: "B", name: state.optionBName, nameKey: "optionBName", priceKey: "priceB" },
    { key: "C", name: state.optionCName, nameKey: "optionCName", priceKey: "priceC" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Inputs */}
      <div className="card-elevated-lg p-8">
        <h3 className="text-xl font-bold text-foreground mb-2">Live Deal Calculator</h3>
        <p className="text-sm text-muted-foreground mb-8">
          Enter the homeowner and project details below. All financing, promos, and value metrics update in real time.
        </p>

        {/* Homeowners */}
        <div className="mb-8">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            👤 Homeowner Information
          </h4>
          <div className="grid grid-cols-2 gap-5">
            <InputField
              label="Homeowner 1"
              description="Primary decision-maker on the contract"
              value={state.homeowner1}
              onChange={(v) => update("homeowner1", v as string)}
            />
            <InputField
              label="Homeowner 2"
              description="Secondary decision-maker or co-signer"
              value={state.homeowner2}
              onChange={(v) => update("homeowner2", v as string)}
            />
          </div>
        </div>

        {/* Project Details */}
        <div className="mb-8">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            🏠 Project Details
          </h4>
          <div className="grid grid-cols-3 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Product</label>
              <p className="text-[11px] text-muted-foreground leading-relaxed -mt-0.5">Type of system being installed</p>
              <select
                value={state.product}
                onChange={(e) => update("product", e.target.value)}
                className="w-full touch-target rounded-xl border border-input bg-card px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {PRODUCT_OPTIONS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <InputField
              label="Solar kW"
              description="Kilowatt capacity of the solar array"
              value={state.solarKw}
              onChange={(v) => update("solarKw", v as string)}
            />
            <InputField
              label="Gutter Feet"
              description="Linear feet of gutter protection included"
              value={state.gutterFeet}
              onChange={(v) => update("gutterFeet", v as string)}
            />
          </div>
        </div>

        {/* Options A/B/C */}
        <div className="mb-8">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
            📋 System Options & Pricing
          </h4>
          <p className="text-[11px] text-muted-foreground mb-4">
            Define up to three system options. Each gets its own financing breakdown and value analysis below.
          </p>
          <div className="space-y-4">
            {optionEntries.map((opt) => (
              <div key={opt.key} className="grid grid-cols-3 gap-5 items-end">
                <div className="col-span-2">
                  <InputField
                    label={`Option ${opt.key} — System Name`}
                    description={`Product/model name for the ${opt.key === "A" ? "premium" : opt.key === "B" ? "mid-tier" : "budget"} option`}
                    value={opt.name}
                    onChange={(v) => update(opt.nameKey as any, v as string)}
                  />
                </div>
                <InputField
                  label={`Total Price ${opt.key}`}
                  description="Full installed price before discounts"
                  value={state[opt.priceKey] as number}
                  onChange={(v) => update(opt.priceKey as any, v as number)}
                  type="number"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Financing */}
        <div className="mb-8">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
            💰 Financing Factors
          </h4>
          <p className="text-[11px] text-muted-foreground mb-4">
            Multipliers used to convert the financed amount into a monthly payment. Provided by your lender.
          </p>
          <div className="grid grid-cols-2 gap-5">
            <InputField
              label="Factor 1"
              description="Primary financing rate multiplier (e.g. 0.01074)"
              value={state.financingFactor1}
              onChange={(v) => update("financingFactor1", v as number)}
              type="number"
            />
            <InputField
              label="Factor 2"
              description="Secondary financing rate multiplier (e.g. 0.015)"
              value={state.financingFactor2}
              onChange={(v) => update("financingFactor2", v as number)}
              type="number"
            />
          </div>
        </div>

        {/* Promo Discounts */}
        <div className="mb-8">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
            🏷️ Promotional Discounts
          </h4>
          <p className="text-[11px] text-muted-foreground mb-4">
            Dollar or percentage reductions applied to the base price for different promo lanes.
          </p>
          <div className="grid grid-cols-2 gap-5 mb-5">
            <InputField
              label="Efficiency Discount ($)"
              description="Dollar amount subtracted for the efficiency promo"
              value={state.efficiencyDiscount}
              onChange={(v) => update("efficiencyDiscount", v as number)}
              type="number"
            />
            <InputField
              label="Standby Discount ($)"
              description="Dollar amount subtracted for the standby promo"
              value={state.standbyDiscount}
              onChange={(v) => update("standbyDiscount", v as number)}
              type="number"
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <InputField
              label="6 Month Deferred (%)"
              description="Percentage discount if customer defers for 6 months"
              value={state.deferred6Pct}
              onChange={(v) => update("deferred6Pct", v as number)}
              type="number"
            />
            <InputField
              label="12 Month Deferred (%)"
              description="Percentage discount if customer defers for 12 months"
              value={state.deferred12Pct}
              onChange={(v) => update("deferred12Pct", v as number)}
              type="number"
            />
          </div>
        </div>

        {/* Value & Energy */}
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
            ⚡ Value & Energy Analysis
          </h4>
          <p className="text-[11px] text-muted-foreground mb-4">
            These inputs drive the ROI and energy savings calculations shown on each option card.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <InputField
              label="ROI %"
              description="Expected home value increase as a % of project cost"
              value={state.roiPercent}
              onChange={(v) => update("roiPercent", v as number)}
              type="number"
            />
            <InputField
              label="Monthly Energy Bill"
              description="Homeowner's current average monthly utility bill"
              value={state.monthlyBill}
              onChange={(v) => update("monthlyBill", v as number)}
              type="number"
            />
            <InputField
              label="Energy Savings %"
              description="Estimated % reduction in energy costs after install"
              value={state.energySavingsPct}
              onChange={(v) => update("energySavingsPct", v as number)}
              type="number"
            />
            <InputField
              label="Down Payment ($)"
              description="Upfront cash applied before financing the balance"
              value={state.downPayment}
              onChange={(v) => update("downPayment", v as number)}
              type="number"
            />
          </div>
        </div>
      </div>

      {/* Output: 3 option cards side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {(["A", "B", "C"] as const).map((key) => (
          <OptionOutputCard
            key={key}
            label={`Option ${key}`}
            name={state[`option${key}Name` as keyof typeof state] as string}
            opt={computed.options[key]}
            energySavings={computed.energySavings}
            accent={OPTION_ACCENTS[key]}
          />
        ))}
      </div>
    </div>
  );
}
