import { EngineTabProps } from "@/hooks/useCloseEngine";
import { DollarSign, Zap, TrendingUp, BarChart3 } from "lucide-react";
import { fmt } from "@/lib/format";
import InputField from "./shared/InputField";
import PromoRow from "./shared/PromoRow";
import ValueRow from "./shared/ValueRow";

export default function CalculatorTab({ state, computed, update }: EngineTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
      {/* LEFT: Inputs — 3 cols */}
      <div className="lg:col-span-3 space-y-6">
        <div className="card-elevated-lg p-6">
          <h3 className="text-lg font-bold text-foreground mb-5">Live deal calculator</h3>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <InputField label="Homeowner 1" value={state.homeowner1} onChange={(v) => update("homeowner1", v)} />
            <InputField label="Homeowner 2" value={state.homeowner2} onChange={(v) => update("homeowner2", v)} />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</label>
              <select
                value={state.product}
                onChange={(e) => update("product", e.target.value)}
                className="w-full touch-target rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option>Roofing System</option>
                <option>Windows</option>
                <option>Siding</option>
                <option>Solar</option>
                <option>Gutters</option>
                <option>Bath</option>
              </select>
            </div>
            <InputField label="Solar kW" value={state.solarKw} onChange={(v) => update("solarKw", v)} />
            <InputField label="Gutter Feet" value={state.gutterFeet} onChange={(v) => update("gutterFeet", v)} />
          </div>

          <div className="space-y-3 mb-5">
            {([
              { lbl: "Option A", name: state.optionAName, nameKey: "optionAName" as const, price: state.priceA, priceKey: "priceA" as const },
              { lbl: "Option B", name: state.optionBName, nameKey: "optionBName" as const, price: state.priceB, priceKey: "priceB" as const },
              { lbl: "Option C", name: state.optionCName, nameKey: "optionCName" as const, price: state.priceC, priceKey: "priceC" as const },
            ]).map((opt) => (
              <div key={opt.lbl} className="grid grid-cols-3 gap-4 items-end">
                <div className="col-span-2">
                  <InputField label={`${opt.lbl} System`} value={opt.name} onChange={(v) => update(opt.nameKey, v)} />
                </div>
                <InputField label={`Price ${opt.lbl.slice(-1)}`} value={opt.price} onChange={(v) => update(opt.priceKey, v)} type="number" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <InputField label="Factor 1" value={state.financingFactor1} onChange={(v) => update("financingFactor1", v)} type="number" />
            <InputField label="Factor 2" value={state.financingFactor2} onChange={(v) => update("financingFactor2", v)} type="number" />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <InputField label="Efficiency Discount" value={state.efficiencyDiscount} onChange={(v) => update("efficiencyDiscount", v)} type="number" />
            <InputField label="Standby Discount" value={state.standbyDiscount} onChange={(v) => update("standbyDiscount", v)} type="number" />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <InputField label="6 Mo Deferred %" value={state.deferred6Pct} onChange={(v) => update("deferred6Pct", v)} type="number" />
            <InputField label="12 Mo Deferred %" value={state.deferred12Pct} onChange={(v) => update("deferred12Pct", v)} type="number" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <InputField label="ROI %" value={state.roiPercent} onChange={(v) => update("roiPercent", v)} type="number" />
            <InputField label="Monthly Energy Bill" value={state.monthlyBill} onChange={(v) => update("monthlyBill", v)} type="number" />
            <InputField label="Energy Savings %" value={state.energySavingsPct} onChange={(v) => update("energySavingsPct", v)} type="number" />
          </div>
        </div>
      </div>

      {/* RIGHT: Outputs — 2 cols */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card-elevated-lg p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Promo lanes
          </h3>
          <div className="space-y-3">
            <PromoRow label="Efficiency C" price={computed.efficiencyPrice} monthly={computed.monthlyEfficiency} />
            <PromoRow label="Standby C" price={computed.standbyPrice} monthly={computed.monthlyStandby} />
            <PromoRow label="6 Mo Deferred" price={computed.deferred6Price} monthly={computed.monthlyDeferred6} />
            <PromoRow label="12 Mo Deferred" price={computed.deferred12Price} monthly={computed.monthlyDeferred12} />
          </div>
        </div>

        <div className="card-elevated-lg p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" /> Value stack
          </h3>
          <div className="space-y-3">
            <ValueRow icon={BarChart3} label="ROI Return" value={fmt(computed.roiValue)} color="text-primary" />
            <ValueRow icon={Zap} label="10-Year Energy Spend" value={fmt(computed.tenYearCost)} color="text-destructive" />
            <ValueRow icon={Zap} label="Projected Energy Savings" value={fmt(computed.energySavings)} color="text-accent" />
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Net Cost After ROI + Savings</span>
                <span className="text-lg font-extrabold text-primary">{fmt(computed.yesNetCost)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
