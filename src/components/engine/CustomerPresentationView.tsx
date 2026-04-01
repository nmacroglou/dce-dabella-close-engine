import { useState } from "react";
import { EngineState, ComputedValues } from "@/hooks/useCloseEngine";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import dabellaLogo from "@/assets/dabella-logo.png";
import OptionCard from "./presentation/OptionCard";
import TrustBar from "./presentation/TrustBar";
import ScopeOfWork from "./presentation/ScopeOfWork";
import WelcomeClose from "./presentation/WelcomeClose";

interface Props {
  state: EngineState;
  computed: ComputedValues;
  onClose: () => void;
}

const STAGES = ["options", "scope", "welcome"] as const;
type Stage = typeof STAGES[number];

const STAGE_LABELS: Record<Stage, string> = {
  options: "Your Options",
  scope: "What to Expect",
  welcome: "Welcome",
};

export default function CustomerPresentationView({ state, computed, onClose }: Props) {
  const [stage, setStage] = useState<Stage>("options");
  const stageIndex = STAGES.indexOf(stage);

  const options = [
    { key: "A" as const, name: state.optionAName, price: state.priceA, monthly: computed.monthlyA },
    { key: "B" as const, name: state.optionBName, price: state.priceB, monthly: computed.monthlyB },
    { key: "C" as const, name: state.optionCName, price: state.priceC, monthly: computed.monthlyC },
  ];

  const goNext = () => {
    if (stageIndex < STAGES.length - 1) setStage(STAGES[stageIndex + 1]);
  };
  const goPrev = () => {
    if (stageIndex > 0) setStage(STAGES[stageIndex - 1]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto animate-fade-in">
      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed top-5 right-5 z-50 rounded-full bg-card border border-border shadow-md p-2.5 hover:bg-muted transition-colors"
        aria-label="Close"
      >
        <X className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* Header */}
      <header className="text-center pt-10 pb-6 px-6">
        <img src={dabellaLogo} alt="DaBella" className="h-12 w-auto mx-auto mb-5" />

        {/* Stage navigation dots */}
        <div className="flex items-center justify-center gap-3 mb-5">
          {STAGES.map((s, i) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                stage === s
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                stage === s ? "bg-primary-foreground/20" : "bg-border"
              }`}>
                {i + 1}
              </span>
              {STAGE_LABELS[s]}
            </button>
          ))}
        </div>

        {stage === "options" && (
          <>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
              Your {state.product} Options
            </h1>
            <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {state.homeowner1}{state.homeowner2 ? ` & ${state.homeowner2}` : ""}, here's a
              side-by-side look at three tailored options for your home.
            </p>
          </>
        )}
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-6 animate-fade-in" key={stage}>
        {stage === "options" && (
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
        )}

        {stage === "scope" && <ScopeOfWork />}

        {stage === "welcome" && (
          <WelcomeClose homeowner1={state.homeowner1} homeowner2={state.homeowner2} />
        )}
      </div>

      {/* Bottom nav */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={stageIndex === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {stageIndex < STAGES.length - 1 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>

      {stage === "options" && <TrustBar />}
    </div>
  );
}
