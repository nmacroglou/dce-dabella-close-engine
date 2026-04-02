import { useState, useMemo } from "react";
import type { EngineTabProps } from "@/types/engine";
import { MessageSquare } from "lucide-react";
import { fmt } from "@/lib/format";
import { buildOptionsArray } from "@/lib/engineHelpers";
import ScriptCard from "./shared/ScriptCard";
import CustomerPresentationView from "./CustomerPresentationView";
import ActionGrid from "./presentation/ActionGrid";
import FinancialImpact from "./presentation/FinancialImpact";

export default function PresentationTab({ state, computed, update }: EngineTabProps) {
  const [showNarrow, setShowNarrow] = useState(false);
  const [showCustomerView, setShowCustomerView] = useState(false);

  const options = useMemo(() => buildOptionsArray(state, computed), [
    state.optionAName, state.optionBName, state.optionCName,
    state.priceA, state.priceB, state.priceC,
    computed.options.A.monthly, computed.options.B.monthly, computed.options.C.monthly,
  ]);

  if (showCustomerView) {
    return <CustomerPresentationView state={state} computed={computed} onClose={() => setShowCustomerView(false)} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
      {/* LEFT — 3 cols */}
      <div className="lg:col-span-3 space-y-6">
        <div className="card-elevated-lg p-6">
          <h3 className="text-lg font-display font-bold text-foreground mb-5">Quick comparison board</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => update("selectedOption", opt.key)}
                className={`card-elevated p-4 sm:p-5 transition-all active:scale-[0.98] touch-target ${
                  state.selectedOption === opt.key ? "ring-2 ring-primary border-primary" : ""
                } sm:text-center flex sm:flex-col items-center sm:items-stretch gap-3 sm:gap-0`}
              >
                <div className="flex-shrink-0 sm:mb-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Option {opt.key}</p>
                </div>
                <div className="flex items-baseline gap-2 sm:flex-col sm:items-center sm:gap-0">
                  <p className="text-xl sm:text-2xl font-extrabold text-primary">{fmt(opt.price)}</p>
                  <p className="text-xs text-muted-foreground sm:mb-2">{fmt(opt.monthly)}/mo</p>
                </div>
                <p className="text-sm font-medium text-foreground truncate ml-auto sm:ml-0">{opt.name}</p>
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
            <ScriptCard title="ROI line" text={`"Based on that percentage, you'd be increasing the value of your home by ${fmt(computed.options.A.roiValue)}."`} />
            <ScriptCard title="Energy line" text={`"At ${fmt(state.monthlyBill)}/month, that's ${fmt(computed.tenYearCost)} over 10 years. At ${state.energySavingsPct}% savings, that's ${fmt(computed.energySavings)} back in your pocket."`} />
          </div>
        </div>
      </div>
    </div>
  );
}
