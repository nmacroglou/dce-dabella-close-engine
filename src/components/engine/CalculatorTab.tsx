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
    <div className="card-elevated-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className={`text-sm font-extrabold uppercase tracking-wider ${accent}`}>{label}</h4>
        <span className="text-xl font-extrabold text-foreground">{fmt(opt.price)}</span>
      </div>
      <p className="text-xs text-muted-foreground truncate">{name}</p>

      {/* Monthly */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
        <span className="text-xs font-semibold text-muted-foreground">Monthly</span>
        <span className="text-sm font-bold text-foreground">{fmt(opt.monthly)}/mo</span>
      </div>

      {/* Promo lanes */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-primary" /> Promo lanes
        </p>
        <PromoLine label="Efficiency" price={opt.efficiencyPrice} monthly={opt.monthlyEfficiency} />
        <PromoLine label="Standby" price={opt.standbyPrice} monthly={opt.monthlyStandby} />
        <PromoLine label="6 Mo Deferred" price={opt.deferred6Price} monthly={opt.monthlyDeferred6} />
        <PromoLine label="12 Mo Deferred" price={opt.deferred12Price} monthly={opt.monthlyDeferred12} />
      </div>

      {/* Value stack */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-accent" /> Value stack
        </p>
        <ValueLine icon={BarChart3} label="ROI Return" value={`+${fmt(opt.roiValue)}`} color="text-primary" />
        <ValueLine icon={Zap} label="Energy Savings" value={`+${fmt(energySavings)}`} color="text-accent" />
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Net Cost
          </span>
          <span className="text-sm font-extrabold text-primary">{fmt(opt.netCost)}</span>
        </div>
      </div>
    </div>
  );
}

function PromoLine({ label, price, monthly }: { label: string; price: number; monthly: number }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="text-xs font-bold text-foreground">{fmt(price)}</span>
        <span className="text-[10px] text-muted-foreground ml-1.5">{fmt(monthly)}/mo</span>
      </div>
    </div>
  );
}

function ValueLine({ icon: Icon, label, value, color }: { icon: typeof BarChart3; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/40">
      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${color}`} /> {label}
      </span>
      <span className={`text-xs font-bold ${color}`}>{value}</span>
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
    <div className="space-y-6 animate-fade-in">
      {/* Inputs */}
      <div className="card-elevated-lg p-6">
        <h3 className="text-lg font-bold text-foreground mb-5">Live deal calculator</h3>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <InputField label="Homeowner 1" value={state.homeowner1} onChange={(v) => update("homeowner1", v as string)} />
          <InputField label="Homeowner 2" value={state.homeowner2} onChange={(v) => update("homeowner2", v as string)} />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Product</label>
            <select
              value={state.product}
              onChange={(e) => update("product", e.target.value)}
              className="w-full touch-target rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {PRODUCT_OPTIONS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <InputField label="Solar kW" value={state.solarKw} onChange={(v) => update("solarKw", v as string)} />
          <InputField label="Gutter Feet" value={state.gutterFeet} onChange={(v) => update("gutterFeet", v as string)} />
        </div>

        <div className="space-y-3 mb-5">
          {optionEntries.map((opt) => (
            <div key={opt.key} className="grid grid-cols-3 gap-4 items-end">
              <div className="col-span-2">
                <InputField label={`Option ${opt.key} System`} value={opt.name} onChange={(v) => update(opt.nameKey as any, v as string)} />
              </div>
              <InputField label={`Price ${opt.key}`} value={state[opt.priceKey] as number} onChange={(v) => update(opt.priceKey as any, v as number)} type="number" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <InputField label="Factor 1" value={state.financingFactor1} onChange={(v) => update("financingFactor1", v as number)} type="number" />
          <InputField label="Factor 2" value={state.financingFactor2} onChange={(v) => update("financingFactor2", v as number)} type="number" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <InputField label="Efficiency Discount" value={state.efficiencyDiscount} onChange={(v) => update("efficiencyDiscount", v as number)} type="number" />
          <InputField label="Standby Discount" value={state.standbyDiscount} onChange={(v) => update("standbyDiscount", v as number)} type="number" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <InputField label="6 Mo Deferred %" value={state.deferred6Pct} onChange={(v) => update("deferred6Pct", v as number)} type="number" />
          <InputField label="12 Mo Deferred %" value={state.deferred12Pct} onChange={(v) => update("deferred12Pct", v as number)} type="number" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <InputField label="ROI %" value={state.roiPercent} onChange={(v) => update("roiPercent", v as number)} type="number" />
          <InputField label="Monthly Energy Bill" value={state.monthlyBill} onChange={(v) => update("monthlyBill", v as number)} type="number" />
          <InputField label="Energy Savings %" value={state.energySavingsPct} onChange={(v) => update("energySavingsPct", v as number)} type="number" />
        </div>
      </div>

      {/* Output: 3 option cards side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
