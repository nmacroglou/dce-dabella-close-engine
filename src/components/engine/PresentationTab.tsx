import { useState } from "react";
import { EngineTabProps } from "@/hooks/useCloseEngine";
import { Scale, TrendingUp, Eye, EyeOff, ArrowRight, MessageSquare, Monitor, Volume2, VolumeX, Filter } from "lucide-react";
import { fmt } from "@/lib/format";
import ScriptCard from "./shared/ScriptCard";
import CustomerPresentationView from "./CustomerPresentationView";

export default function PresentationTab({ state, computed, update }: EngineTabProps) {
  const [showNarrow, setShowNarrow] = useState(false);
  const [showCustomerView, setShowCustomerView] = useState(false);

  if (showCustomerView) {
    return <CustomerPresentationView state={state} computed={computed} onClose={() => setShowCustomerView(false)} />;
  }

  const options = [
    { key: "A" as const, name: state.optionAName, price: state.priceA, monthly: computed.monthlyA },
    { key: "B" as const, name: state.optionBName, price: state.priceB, monthly: computed.monthlyB },
    { key: "C" as const, name: state.optionCName, price: state.priceC, monthly: computed.monthlyC },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
      {/* LEFT — 3 cols */}
      <div className="lg:col-span-3 space-y-6">
        <div className="card-elevated-lg p-6">
          <h3 className="text-lg font-display font-bold text-foreground mb-5">Quick comparison board</h3>
          <div className="grid grid-cols-3 gap-4">
            {options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => update("selectedOption", opt.key)}
                className={`card-elevated p-5 text-center transition-all active:scale-[0.98] touch-target ${
                  state.selectedOption === opt.key ? "ring-2 ring-primary border-primary" : ""
                }`}
              >
                <p className="text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-[0.15em]">Option {opt.key}</p>
                <p className="text-2xl font-extrabold text-primary mb-1">{fmt(opt.price)}</p>
                <p className="text-xs text-muted-foreground mb-2">{fmt(opt.monthly)}/mo</p>
                <p className="text-sm font-medium text-foreground truncate">{opt.name}</p>
              </button>
            ))}
          </div>

          {/* Action buttons — 2x2 grid */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            {/* Customer View */}
            <button
              onClick={() => setShowCustomerView(true)}
              className="flex items-center gap-3 p-4 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all active:scale-[0.98] touch-target"
            >
              <div className="rounded-lg bg-background/15 p-2">
                <Monitor className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold leading-tight">Customer View</p>
                <p className="text-[11px] opacity-70 leading-tight mt-0.5">Full-screen presentation for the homeowner</p>
              </div>
            </button>

            {/* Price Dropped */}
            <button
              onClick={() => { update("priceShown", true); update("currentStage", "presentation"); }}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all active:scale-[0.98] touch-target ${
                state.priceShown
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10 text-foreground hover:bg-primary/20 border border-primary/20"
              }`}
            >
              <div className={`rounded-lg p-2 ${state.priceShown ? "bg-primary-foreground/15" : "bg-primary/10"}`}>
                <Eye className={`h-5 w-5 ${state.priceShown ? "" : "text-primary"}`} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold leading-tight">Price Dropped</p>
                <p className={`text-[11px] leading-tight mt-0.5 ${state.priceShown ? "opacity-70" : "text-muted-foreground"}`}>
                  {state.priceShown ? "Active — stay silent, let them react" : "Tap when you reveal the price to them"}
                </p>
              </div>
            </button>

            {/* Reset Silence */}
            <button
              onClick={() => update("priceShown", false)}
              disabled={!state.priceShown}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all active:scale-[0.98] touch-target ${
                state.priceShown
                  ? "border-border bg-card hover:bg-muted"
                  : "border-border/50 bg-muted/50 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="rounded-lg bg-muted p-2">
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground leading-tight">Reset Silence</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                  Clear the price-drop state and resume coaching
                </p>
              </div>
            </button>

            {/* Narrow Options */}
            <button
              onClick={() => setShowNarrow(!showNarrow)}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all active:scale-[0.98] touch-target ${
                showNarrow
                  ? "border-accent bg-accent/10"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              <div className={`rounded-lg p-2 ${showNarrow ? "bg-accent/15" : "bg-muted"}`}>
                <Filter className={`h-5 w-5 ${showNarrow ? "text-accent" : "text-muted-foreground"}`} />
              </div>
              <div className="text-left">
                <p className={`text-sm font-bold leading-tight ${showNarrow ? "text-accent" : "text-foreground"}`}>Narrow Options</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                  Ask the homeowner to eliminate one option
                </p>
              </div>
            </button>
          </div>

          {showNarrow && (
            <div className="mt-4 rounded-xl bg-accent/5 border border-accent/20 p-5 animate-fade-in">
              <p className="text-[11px] font-bold text-accent uppercase tracking-[0.15em] mb-2">Tap-to-speak narrowing script</p>
              <div className="script-block border-l-accent">
                "Out of these 3 options, which one would you eliminate?"
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                This forces a decision without asking them to commit. Once they eliminate one, 
                repeat with the remaining two to isolate their preferred option.
              </p>
            </div>
          )}
        </div>

        {/* T-Close + 10-Year Impact */}
        <div className="grid grid-cols-2 gap-6">
          <div className="card-elevated-lg p-6">
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" /> T-close board
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-accent/10 p-4 text-center">
                <p className="text-xs font-semibold text-accent uppercase mb-1">YES</p>
                <p className="text-xl font-extrabold text-foreground">{fmt(computed.selectedPrice || state.priceA)}</p>
                <p className="text-xs text-muted-foreground mt-1">DaBella roof</p>
              </div>
              <div className="rounded-xl bg-destructive/10 p-4 text-center">
                <p className="text-xs font-semibold text-destructive uppercase mb-1">NO</p>
                <p className="text-xl font-extrabold text-foreground">$0</p>
                <p className="text-xs text-muted-foreground mt-1">Do nothing</p>
              </div>
            </div>
          </div>

          <div className="card-elevated-lg p-6">
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" /> 10-year financial impact
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground"></th>
                  <th className="text-center py-2 font-semibold text-accent text-xs">Move Forward</th>
                  <th className="text-center py-2 font-semibold text-destructive text-xs">Do Nothing</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 font-medium text-foreground">ROI</td>
                  <td className="py-2 text-center font-semibold text-accent">+{fmt(computed.roiValue)}</td>
                  <td className="py-2 text-center text-muted-foreground">$0</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 font-medium text-foreground">Energy</td>
                  <td className="py-2 text-center font-semibold text-accent">+{fmt(computed.energySavings)}</td>
                  <td className="py-2 text-center font-semibold text-destructive">-{fmt(computed.tenYearCost)}</td>
                </tr>
                <tr>
                  <td className="py-2 font-bold text-foreground">Total</td>
                  <td className="py-2 text-center font-bold text-accent">+{fmt(computed.moveForwardImpact)}</td>
                  <td className="py-2 text-center font-bold text-destructive">{fmt(computed.doNothingImpact)}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-3 p-3 rounded-xl bg-foreground text-background text-center">
              <p className="text-xs font-medium opacity-70">Net Difference</p>
              <p className="text-2xl font-extrabold">{fmt(computed.netDifference)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Scripts */}
      <div className="lg:col-span-2">
        <div className="card-elevated-lg p-6">
          <h3 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Presentation scripts
          </h3>
          <div className="space-y-4">
            <ScriptCard title="Opening control" text={`"Great, give me a second to finalize the numbers and we'll get right to it."`} />
            <ScriptCard title="Price drop" text={`"For all of this, your project comes down to only ..."`} />
            <ScriptCard title="T-close line" text={`"Most people here aren't deciding if — they're deciding whether the money makes sense. Fair?"`} />
            <ScriptCard title="ROI line" text={`"Based on that percentage, you'd be increasing the value of your home by ${fmt(computed.roiValue)}."`} />
            <ScriptCard title="Energy line" text={`"At ${fmt(state.monthlyBill)}/month, that's ${fmt(computed.tenYearCost)} over 10 years. At ${state.energySavingsPct}% savings, that's ${fmt(computed.energySavings)} back in your pocket."`} />
          </div>
        </div>
      </div>
    </div>
  );
}
