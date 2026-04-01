import { useState, useMemo } from "react";
import type { EngineState, ComputedValues } from "@/types/engine";
import { X, ChevronRight, ChevronLeft, Download, Loader2 } from "lucide-react";
import { exportCustomerPdf } from "@/lib/exportPdf";
import { buildOptionsArray, getOptionMetrics } from "@/lib/engineHelpers";
import dabellaLogo from "@/assets/dabella-logo.png";
import OptionCard from "./presentation/OptionCard";
import TrustBar from "./presentation/TrustBar";
import ScopeOfWork from "./presentation/ScopeOfWork";
import WelcomeClose from "./presentation/WelcomeClose";
import FinancialImpact from "./presentation/FinancialImpact";

interface Props {
  state: EngineState;
  computed: ComputedValues;
  onClose: () => void;
}

const STAGES = ["options", "scope", "welcome"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_LABELS: Record<Stage, string> = {
  options: "Your Options",
  scope: "What to Expect",
  welcome: "Welcome",
};

export default function CustomerPresentationView({ state, computed, onClose }: Props) {
  const [stage, setStage] = useState<Stage>("options");
  const [exporting, setExporting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | "C" | null>(null);
  const stageIndex = STAGES.indexOf(stage);

  const options = useMemo(() => buildOptionsArray(state, computed), [
    state.optionAName, state.optionBName, state.optionCName,
    state.priceA, state.priceB, state.priceC,
    computed.monthlyA, computed.monthlyB, computed.monthlyC,
  ]);

  const goNext = () => stageIndex < STAGES.length - 1 && setStage(STAGES[stageIndex + 1]);
  const goPrev = () => stageIndex > 0 && setStage(STAGES[stageIndex - 1]);

  const handleExportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const name = state.homeowner1 || "Customer";
      const { exportCustomerPdf } = await import("@/lib/exportPdf");
      await exportCustomerPdf(state, computed, options, `DaBella-Proposal-${name}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  // Build computed overrides for the selected option's financial impact
  const selectedComputed = useMemo(() => {
    if (!selectedOption) return null;
    const m = getOptionMetrics(selectedOption, computed);
    return {
      ...computed,
      selectedPrice: m.price,
      roiValue: m.roi,
      inflationPenalty: m.inflationPenalty,
      lockedInSavings: m.lockedInSavings,
      moveForwardImpact: m.moveForward,
      doNothingImpact: m.doNothing,
      netDifference: m.netDiff,
    };
  }, [selectedOption, computed]);

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto animate-fade-in">
      {/* Top-right actions */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          className="flex items-center gap-2 rounded-full bg-card border border-border shadow-md px-4 py-2 hover:bg-muted transition-colors text-sm font-semibold text-foreground disabled:opacity-60"
          aria-label="Export PDF"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Download className="h-4 w-4 text-muted-foreground" />
          )}
          {exporting ? "Exporting…" : "Export PDF"}
        </button>
        <button
          onClick={onClose}
          className="rounded-full bg-card border border-border shadow-md p-2 hover:bg-muted transition-colors"
          aria-label="Close presentation"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Header */}
      <header className="text-center pt-8 pb-4 px-6">
        <img src={dabellaLogo} alt="DaBella" className="h-10 w-auto mx-auto mb-4" />

        {/* Stage pills */}
        <nav className="flex items-center justify-center gap-2 mb-5">
          {STAGES.map((s, i) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                stage === s
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  stage === s ? "bg-primary-foreground/20" : "bg-border"
                }`}
              >
                {i + 1}
              </span>
              {STAGE_LABELS[s]}
            </button>
          ))}
        </nav>

        {stage === "options" && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight mb-1">
              Your {state.product} Options
            </h1>
            <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {state.homeowner1}
              {state.homeowner2 ? ` & ${state.homeowner2}` : ""}, here's a side-by-side look at
              three tailored options for your home.
            </p>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-6 animate-slide-up" key={stage}>
        {stage === "options" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {options.map((opt) => (
                <OptionCard
                  key={opt.key}
                  optionKey={opt.key}
                  name={opt.name}
                  computed={computed}
                  selected={selectedOption === opt.key}
                  onClick={() => setSelectedOption(selectedOption === opt.key ? null : opt.key)}
                />
              ))}
            </div>

            {selectedOption && selectedComputed && (
              <div className="mt-8 animate-fade-in">
                <FinancialImpact
                  state={{ ...state, selectedOption }}
                  computed={selectedComputed}
                />
              </div>
            )}

            <div className="mt-8">
              <TrustBar />
            </div>
          </>
        )}

        {stage === "scope" && <ScopeOfWork />}

        {stage === "welcome" && (
          <WelcomeClose homeowner1={state.homeowner1} homeowner2={state.homeowner2} />
        )}
      </div>

      {/* Bottom nav */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={stageIndex === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-muted text-foreground font-semibold text-sm transition-all disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {STAGES.map((s, i) => (
              <div
                key={s}
                className={`rounded-full transition-all ${
                  i === stageIndex ? "h-2.5 w-8 bg-primary" : "h-2.5 w-2.5 bg-border"
                }`}
              />
            ))}
          </div>

          {stageIndex < STAGES.length - 1 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:shadow-lg transition-all"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="w-[120px]" />
          )}
        </div>
      </div>
    </div>
  );
}
