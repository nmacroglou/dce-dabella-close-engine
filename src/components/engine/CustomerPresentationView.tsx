import { useState, useMemo } from "react";
import type { EngineState, ComputedValues } from "@/types/engine";
import { X, ChevronRight, ChevronLeft, Download, Loader2, Check, ArrowRight } from "lucide-react";
import { buildOptionsArray, getOptionMetrics, getProductLabel, hasProduct } from "@/lib/engineHelpers";
import dabellaLogo from "@/assets/dabella-logo.png";
import OptionCard from "./presentation/OptionCard";
import TrustBar from "./presentation/TrustBar";
import ScopeOfWork from "./presentation/ScopeOfWork";
import WelcomeClose from "./presentation/WelcomeClose";
import FinancialImpact from "./presentation/FinancialImpact";
import WindowInspectionView from "./presentation/WindowInspectionView";

interface Props {
  state: EngineState;
  computed: ComputedValues;
  onClose: () => void;
}

const BASE_STAGES = ["options", "impact", "scope", "welcome"] as const;
const WINDOW_STAGES = ["options", "impact", "inspection", "scope", "welcome"] as const;
type Stage = "options" | "impact" | "inspection" | "scope" | "welcome";

const STAGE_LABELS: Record<Stage, string> = {
  options: "Your Options",
  impact: "The Numbers",
  inspection: "Inspection",
  scope: "What to Expect",
  welcome: "Welcome",
};

const OPTION_KEYS: ("A" | "B" | "C")[] = ["A", "B", "C"];

export default function CustomerPresentationView({ state, computed, onClose }: Props) {
  const isWindows = hasProduct(state.products, "Windows");
  const productLabel = getProductLabel(state.products);
  const STAGES: readonly Stage[] = isWindows ? WINDOW_STAGES : BASE_STAGES;

  const [stage, setStage] = useState<Stage>("options");
  const [exporting, setExporting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | "C" | null>(null);
  const [revealIndex, setRevealIndex] = useState(0); // which option is currently being shown (0=A, 1=B, 2=C)
  const stageIndex = STAGES.indexOf(stage);

  const options = useMemo(() => buildOptionsArray(state, computed), [
    state.optionAName, state.optionBName, state.optionCName,
    state.priceA, state.priceB, state.priceC,
    computed.options.A.monthly, computed.options.B.monthly, computed.options.C.monthly,
  ]);

  const currentOptionKey = OPTION_KEYS[revealIndex];
  const currentOption = options[revealIndex];
  const isLastOption = revealIndex >= 2;

  const goNext = () => stageIndex < STAGES.length - 1 && setStage(STAGES[stageIndex + 1] as Stage);
  const goPrev = () => stageIndex > 0 && setStage(STAGES[stageIndex - 1] as Stage);

  const handleAccept = (key: "A" | "B" | "C") => {
    setSelectedOption(key);
    // Go to impact stage
    const impactIdx = STAGES.indexOf("impact");
    if (impactIdx >= 0) setStage("impact");
  };

  const handleShowNext = () => {
    if (!isLastOption) {
      setRevealIndex((prev) => prev + 1);
    }
  };

  const handleExportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const name = state.homeowner1 || "Customer";
      const { exportCustomerPdf } = await import("@/lib/exportPdf");
      await exportCustomerPdf(state, computed, options, `DaBella-Proposal-${name}.pdf`, selectedOption);
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
        {selectedOption && (
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
        )}
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
              onClick={() => {
                // Only allow navigating to options or stages after selection
                if (s === "options" || selectedOption) setStage(s);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                stage === s
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : s !== "options" && !selectedOption
                  ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
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

        {stage === "options" && !selectedOption && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight mb-1">
              Your {productLabel} Options
            </h1>
            <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {state.homeowner1}
              {state.homeowner2 ? ` & ${state.homeowner2}` : ""}, let me walk you through
              your options one at a time.
            </p>
          </div>
        )}

        {stage === "options" && selectedOption && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight mb-1">
              Great Choice!
            </h1>
            <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              You've selected Option {selectedOption}. Here's the financial breakdown.
            </p>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-6 animate-slide-up" key={`${stage}-${revealIndex}-${selectedOption}`}>
        {stage === "options" && !selectedOption && (
          <>
            {/* Single option card — centered */}
            <div className="max-w-md mx-auto" key={currentOptionKey}>
              <div className="animate-fade-in">
                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  {OPTION_KEYS.map((key, i) => (
                    <div
                      key={key}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        i === revealIndex
                          ? "bg-primary text-primary-foreground"
                          : i < revealIndex
                          ? "bg-accent/20 text-accent"
                          : "bg-muted text-muted-foreground/40"
                      }`}
                    >
                      {i < revealIndex ? (
                        <span className="text-[10px]">Reviewed</span>
                      ) : i === revealIndex ? (
                        <span>Option {key}</span>
                      ) : (
                        <span>Option {key}</span>
                      )}
                    </div>
                  ))}
                </div>

                <OptionCard
                  optionKey={currentOptionKey}
                  name={currentOption.name}
                  computed={computed}
                  selected={false}
                />

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
                  <button
                    onClick={() => handleAccept(currentOptionKey)}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                  >
                    <Check className="h-5 w-5" />
                    I Like This Option
                  </button>
                  {!isLastOption && (
                    <button
                      onClick={handleShowNext}
                      className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-muted border border-border text-foreground font-semibold text-base hover:bg-muted/80 transition-all"
                    >
                      Show Me Another Option
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  )}
                  {isLastOption && (
                    <p className="text-sm text-muted-foreground text-center">
                      This is the last option. Choose the one that's right for you, or go back to review.
                    </p>
                  )}
                </div>

                {/* Go back to previous option */}
                {revealIndex > 0 && (
                  <button
                    onClick={() => setRevealIndex((prev) => prev - 1)}
                    className="mt-3 mx-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Review previous option
                  </button>
                )}
              </div>
            </div>

            <div className="mt-8">
              <TrustBar />
            </div>
          </>
        )}

        {stage === "options" && selectedOption && selectedComputed && (
          <>
            {/* Show accepted option + financial impact */}
            <div className="max-w-md mx-auto mb-8">
              <OptionCard
                optionKey={selectedOption}
                name={options.find((o) => o.key === selectedOption)?.name || ""}
                computed={computed}
                selected={true}
              />
            </div>

            <FinancialImpact
              state={{ ...state, selectedOption }}
              computed={selectedComputed}
            />

            <div className="mt-8">
              <TrustBar />
            </div>
          </>
        )}

        {stage === "inspection" && isWindows && (
          <WindowInspectionView state={state} />
        )}

        {stage === "scope" && <ScopeOfWork products={state.products} />}

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
              disabled={stage === "options" && !selectedOption}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:pointer-events-none"
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
