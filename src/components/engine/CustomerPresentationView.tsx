import { EngineState, ComputedValues } from "@/hooks/useCloseEngine";
import { X } from "lucide-react";
import dabellaLogo from "@/assets/dabella-logo.png";
import OptionCard from "./presentation/OptionCard";
import TrustBar from "./presentation/TrustBar";

interface Props {
  state: EngineState;
  computed: ComputedValues;
  onClose: () => void;
}

export default function CustomerPresentationView({ state, computed, onClose }: Props) {
  const options = [
    { key: "A" as const, name: state.optionAName, price: state.priceA, monthly: computed.monthlyA },
    { key: "B" as const, name: state.optionBName, price: state.priceB, monthly: computed.monthlyB },
    { key: "C" as const, name: state.optionCName, price: state.priceC, monthly: computed.monthlyC },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto animate-fade-in">
      <button
        onClick={onClose}
        className="fixed top-5 right-5 z-50 rounded-full bg-card border border-border shadow-md p-2.5 hover:bg-muted transition-colors"
        aria-label="Close"
      >
        <X className="h-5 w-5 text-muted-foreground" />
      </button>

      <header className="text-center pt-10 pb-8 px-6">
        <img src={dabellaLogo} alt="DaBella" className="h-12 w-auto mx-auto mb-5" />
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
          Your {state.product} Options
        </h1>
        <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {state.homeowner1}{state.homeowner2 ? ` & ${state.homeowner2}` : ""}, here's a
          side-by-side look at three tailored options for your home.
        </p>
      </header>

      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {options.map((opt) => (
            <OptionCard
              key={opt.key}
              optionKey={opt.key}
              name={opt.name}
              price={opt.price}
              monthly={opt.monthly}
              roiPercent={state.roiPercent}
              computed={computed}
            />
          ))}
        </div>
      </div>

      <TrustBar />
    </div>
  );
}
