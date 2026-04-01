import { useState, useMemo } from "react";
import { EngineTabProps } from "@/hooks/useCloseEngine";
import { MessageSquare } from "lucide-react";
import { fmt } from "@/lib/format";
import ScriptCard from "./shared/ScriptCard";
import CustomerPresentationView from "./CustomerPresentationView";
import ActionGrid from "./presentation/ActionGrid";
import FinancialImpact from "./presentation/FinancialImpact";

export default function PresentationTab({ state, computed, update }: EngineTabProps) {
  const [showNarrow, setShowNarrow] = useState(false);
  const [showCustomerView, setShowCustomerView] = useState(false);

  const options = useMemo(() => [
    { key: "A" as const, name: state.optionAName, price: state.priceA, monthly: computed.monthlyA },
    { key: "B" as const, name: state.optionBName, price: state.priceB, monthly: computed.monthlyB },
    { key: "C" as const, name: state.optionCName, price: state.priceC, monthly: computed.monthlyC },
  ], [state.optionAName, state.optionBName, state.optionCName, state.priceA, state.priceB, state.priceC, computed.monthlyA, computed.monthlyB, computed.monthlyC]);

  if (showCustomerView) {
    return <CustomerPresentationView state={state} computed={computed} onClose={() => setShowCustomerView(false)} />;
  }

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

          <ActionGrid
            state={state}
            update={update}
            onShowCustomerView={() => setShowCustomerView(true)}
            showNarrow={showNarrow}
            onToggleNarrow={() => setShowNarrow(!showNarrow)}
          />
        </div>

        <FinancialImpact state={state} computed={computed} />
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
