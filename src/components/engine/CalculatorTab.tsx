import { EngineState } from "@/hooks/useCloseEngine";
import { DollarSign, Zap, TrendingUp, BarChart3 } from "lucide-react";

interface Props {
  state: EngineState;
  computed: any;
  update: <K extends keyof EngineState>(key: K, value: EngineState[K]) => void;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function InputField({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string | number; onChange: (v: any) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
        placeholder={placeholder}
        className="w-full touch-target rounded-xl border border-input bg-card px-4 py-3 text-base outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
    </div>
  );
}

function OutputCard({ icon: Icon, label, value, color = "primary" }: {
  icon: any; label: string; value: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
  };
  return (
    <div className="metric-card flex items-center gap-3">
      <div className={`rounded-lg p-2.5 ${colorMap[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function CalculatorTab({ state, computed, update }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* LEFT: Inputs */}
      <div className="space-y-6">
        <div className="card-elevated-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Customer Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Homeowner 1" value={state.homeowner1} onChange={(v) => update("homeowner1", v)} placeholder="First name" />
            <InputField label="Homeowner 2" value={state.homeowner2} onChange={(v) => update("homeowner2", v)} placeholder="First name" />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Product</label>
              <select
                value={state.product}
                onChange={(e) => update("product", e.target.value)}
                className="w-full touch-target rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option>Windows</option>
                <option>Siding</option>
                <option>Roofing</option>
                <option>Solar</option>
                <option>Gutters</option>
                <option>Bath</option>
              </select>
            </div>
            <InputField label="Solar kW (optional)" value={state.solarKw} onChange={(v) => update("solarKw", v)} placeholder="e.g. 8.5" />
          </div>
        </div>

        <div className="card-elevated-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Options & Pricing</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Option A Name" value={state.optionAName} onChange={(v) => update("optionAName", v)} />
              <InputField label="Price A" value={state.priceA} onChange={(v) => update("priceA", v)} type="number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Option B Name" value={state.optionBName} onChange={(v) => update("optionBName", v)} />
              <InputField label="Price B" value={state.priceB} onChange={(v) => update("priceB", v)} type="number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Option C Name" value={state.optionCName} onChange={(v) => update("optionCName", v)} />
              <InputField label="Price C" value={state.priceC} onChange={(v) => update("priceC", v)} type="number" />
            </div>
            <InputField label="Gutter Feet" value={state.gutterFeet} onChange={(v) => update("gutterFeet", v)} type="number" placeholder="Linear feet" />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Financing Factor 1" value={state.financingFactor1} onChange={(v) => update("financingFactor1", v)} type="number" />
              <InputField label="Financing Factor 2" value={state.financingFactor2} onChange={(v) => update("financingFactor2", v)} type="number" />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Outputs */}
      <div className="space-y-6">
        <div className="card-elevated-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Promo Lanes
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <OutputCard icon={DollarSign} label="Efficiency Price" value={fmt(computed.efficiencyPrice)} color="success" />
            <OutputCard icon={DollarSign} label="Standby Price" value={fmt(computed.standbyPrice)} color="warning" />
            <OutputCard icon={DollarSign} label="6-Month Deferred" value={fmt(computed.deferred6)} color="info" />
            <OutputCard icon={DollarSign} label="12-Month Deferred" value={fmt(computed.deferred12)} color="primary" />
          </div>
        </div>

        <div className="card-elevated-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" /> ROI Calculation
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <InputField label="ROI %" value={state.roiPercent} onChange={(v) => update("roiPercent", v)} type="number" />
          </div>
          <OutputCard icon={TrendingUp} label="ROI Return Value" value={fmt(computed.roiValue)} color="success" />
        </div>

        <div className="card-elevated-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-warning" /> Energy Savings
          </h3>
          <div className="mb-4">
            <InputField label="Monthly Energy Bill" value={state.monthlyBill} onChange={(v) => update("monthlyBill", v)} type="number" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <OutputCard icon={BarChart3} label="Annual Energy Cost" value={fmt(computed.annualCost)} color="info" />
            <OutputCard icon={BarChart3} label="10-Year Energy Cost" value={fmt(computed.tenYearCost)} color="warning" />
            <OutputCard icon={Zap} label="75% Savings (10 yr)" value={fmt(computed.savings75)} color="success" />
          </div>
        </div>
      </div>
    </div>
  );
}
