import { useState } from "react";
import { EngineState } from "@/hooks/useCloseEngine";
import { ArrowRight, Scale, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  state: EngineState;
  computed: any;
  update: <K extends keyof EngineState>(key: K, value: EngineState[K]) => void;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function PresentationTab({ state, computed, update }: Props) {
  const [showNarrow, setShowNarrow] = useState(false);
  const [showTClose, setShowTClose] = useState(false);

  const handleShowPrice = () => {
    update("priceShown", true);
    update("currentStage", "presentation");
  };

  const options = [
    { key: "A" as const, name: state.optionAName, price: state.priceA, monthly: computed.monthlyA },
    { key: "B" as const, name: state.optionBName, price: state.priceB, monthly: computed.monthlyB },
    { key: "C" as const, name: state.optionCName, price: state.priceC, monthly: computed.monthlyC },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Option Comparison */}
      <div className="card-elevated-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-5">Option Comparison</h3>
        <div className="grid grid-cols-3 gap-4">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { update("selectedOption", opt.key); handleShowPrice(); }}
              className={`card-elevated p-5 text-center transition-all active:scale-[0.98] ${
                state.selectedOption === opt.key ? "ring-2 ring-primary border-primary" : ""
              }`}
            >
              <p className="text-sm font-medium text-muted-foreground mb-1">Option {opt.key}</p>
              <p className="font-semibold text-foreground text-base mb-2">{opt.name}</p>
              <p className="text-2xl font-bold text-primary">{fmt(opt.price)}</p>
              <p className="text-sm text-muted-foreground mt-1">{fmt(opt.monthly)}/mo</p>
            </button>
          ))}
        </div>

        <Button
          onClick={() => setShowNarrow(true)}
          className="mt-5 w-full touch-target text-base rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          size="lg"
        >
          <ArrowRight className="h-5 w-5 mr-2" /> NARROW OPTIONS
        </Button>

        {showNarrow && (
          <div className="script-block mt-4 animate-fade-in">
            "Out of these 3 options, which one would you eliminate?"
          </div>
        )}
      </div>

      {/* T-Close */}
      <div className="card-elevated-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" /> T-Close
        </h3>
        <Button
          onClick={() => setShowTClose(true)}
          variant="outline"
          className="w-full touch-target text-base rounded-xl"
          size="lg"
        >
          <Scale className="h-5 w-5 mr-2" /> RUN T-CLOSE
        </Button>

        {showTClose && (
          <div className="mt-5 space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div className="card-elevated p-5 text-center border-success/30 bg-success/5">
                <p className="text-sm font-semibold text-success mb-1">YES ✓</p>
                <p className="text-2xl font-bold text-foreground">{fmt(computed.selectedPrice || state.priceC)}</p>
              </div>
              <div className="card-elevated p-5 text-center border-destructive/30 bg-destructive/5">
                <p className="text-sm font-semibold text-destructive mb-1">NO ✗</p>
                <p className="text-2xl font-bold text-foreground">$0</p>
              </div>
            </div>
            <div className="script-block">
              "Most people here aren't deciding IF… just whether the money makes sense… fair?"
            </div>
            <div className="script-block">
              "It's just that {fmt(computed.selectedPrice || state.priceC)} is a lot… you feeling that too?"
            </div>
          </div>
        )}
      </div>

      {/* 10-Year Impact */}
      <div className="card-elevated-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-success" /> 10-Year Financial Impact
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Category</th>
                <th className="text-center py-3 px-4 font-semibold text-success">Move Forward</th>
                <th className="text-center py-3 px-4 font-semibold text-destructive">Do Nothing</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-3 px-4 font-medium">ROI</td>
                <td className="py-3 px-4 text-center font-semibold text-success">+{fmt(computed.roiValue)}</td>
                <td className="py-3 px-4 text-center text-muted-foreground">$0</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 px-4 font-medium">Energy Savings</td>
                <td className="py-3 px-4 text-center font-semibold text-success">+{fmt(computed.savings75)}</td>
                <td className="py-3 px-4 text-center font-semibold text-destructive">-{fmt(computed.tenYearCost)}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold">Total Impact</td>
                <td className="py-3 px-4 text-center font-bold text-success">+{fmt(computed.roiValue + computed.savings75)}</td>
                <td className="py-3 px-4 text-center font-bold text-destructive">-{fmt(computed.tenYearCost)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-5 text-center p-5 rounded-xl bg-success/10 border border-success/20">
          <p className="text-sm font-medium text-success">Net Difference</p>
          <p className="text-4xl font-extrabold text-success">{fmt(computed.netDifference)}</p>
        </div>
      </div>
    </div>
  );
}
