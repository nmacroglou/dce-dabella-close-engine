import { useState } from "react";
import { EngineTabProps } from "@/hooks/useCloseEngine";
import { Scale, TrendingUp, Eye, EyeOff, ArrowRight, MessageSquare, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
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
          <h3 className="text-lg font-bold text-foreground mb-5">Quick comparison board</h3>
          <div className="grid grid-cols-3 gap-4">
            {options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => update("selectedOption", opt.key)}
                className={`card-elevated p-5 text-center transition-all active:scale-[0.98] touch-target ${
                  state.selectedOption === opt.key ? "ring-2 ring-primary border-primary" : ""
                }`}
              >
                <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Option {opt.key}</p>
                <p className="text-2xl font-extrabold text-primary mb-1">{fmt(opt.price)}</p>
                <p className="text-xs text-muted-foreground mb-2">{fmt(opt.monthly)}/mo</p>
                <p className="text-sm font-medium text-foreground truncate">{opt.name}</p>
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-5">
            <Button
              onClick={() => setShowCustomerView(true)}
              className="flex-1 touch-target rounded-xl bg-foreground text-background hover:bg-foreground/90"
              size="lg"
            >
              <Monitor className="h-4 w-4 mr-2" /> Customer View
            </Button>
            <Button
              onClick={() => { update("priceShown", true); update("currentStage", "presentation"); }}
              className="flex-1 touch-target rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              <Eye className="h-4 w-4 mr-2" /> Price Dropped
            </Button>
            <Button
              onClick={() => update("priceShown", false)}
              variant="outline"
              className="flex-1 touch-target rounded-xl"
              size="lg"
            >
              <EyeOff className="h-4 w-4 mr-2" /> Reset Silence
            </Button>
            <Button
              onClick={() => setShowNarrow(!showNarrow)}
              variant="outline"
              className="flex-1 touch-target rounded-xl"
              size="lg"
            >
              <ArrowRight className="h-4 w-4 mr-2" /> Narrow Options
            </Button>
          </div>

          {showNarrow && (
            <div className="mt-4 card-elevated p-5">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Tap-to-speak narrowing question</h4>
              <div className="script-block">
                "Out of these 3 options, which one would you eliminate?"
              </div>
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
