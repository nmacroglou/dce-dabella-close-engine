import { useState, useMemo } from "react";
import type { EngineState, ComputedValues } from "@/types/engine";
import { X, ChevronRight, ChevronLeft, Share2 } from "lucide-react";
import { buildOptionsArray, getOptionMetrics, getProductLabel, hasProduct, applyDiscountToComputed } from "@/lib/engineHelpers";
import dabellaLogo from "@/assets/dabella-logo.png";
import OptionCard from "./presentation/OptionCard";
import OptionReveal from "./presentation/OptionReveal";
import TrustBar from "./presentation/TrustBar";
import ScopeOfWork from "./presentation/ScopeOfWork";
import WelcomeClose from "./presentation/WelcomeClose";
import FinancialImpact from "./presentation/FinancialImpact";
import WindowInspectionView from "./presentation/WindowInspectionView";
import PromoTrigger, { tierPct, type TierState } from "./presentation/PromoTrigger";
import SharePdfDialog from "./presentation/SharePdfDialog";

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

export default function CustomerPresentationView({ state, computed, onClose }: Props) {
  const isWindows = hasProduct(state.products, "Windows");
  const productLabel = getProductLabel(state.products);
  const STAGES: readonly Stage[] = isWindows ? WINDOW_STAGES : BASE_STAGES;

  const [stage, setStage] = useState<Stage>("options");
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | "C" | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [tier, setTier] = useState<TierState>(null);
  const stageIndex = STAGES.indexOf(stage);

  const discountPct = tierPct(tier);
  const discountedComputed = useMemo(
    () => applyDiscountToComputed(computed, discountPct),
    [computed, discountPct],
  );

  const originalOptions = useMemo(() => buildOptionsArray(state, computed), [
    state.optionAName, state.optionBName, state.optionCName,
    state.priceA, state.priceB, state.priceC,
    computed.options.A.monthly, computed.options.B.monthly, computed.options.C.monthly,
  ]);

  const options = useMemo(() => buildOptionsArray(state, discountedComputed), [
    state.optionAName, state.optionBName, state.optionCName,
    discountedComputed,
  ]);

  const goNext = () => stageIndex < STAGES.length - 1 && setStage(STAGES[stageIndex + 1] as Stage);
  const goPrev = () => stageIndex > 0 && setStage(STAGES[stageIndex - 1] as Stage);

  const handleAccept = (key: "A" | "B" | "C") => {
    setSelectedOption(key);
    setStage("impact");
  };




  const selectedComputed = useMemo(() => {
    if (!selectedOption) return null;
    const m = getOptionMetrics(selectedOption, discountedComputed);
    return {
      ...discountedComputed,
      selectedPrice: m.price,
      roiValue: m.roi,
      inflationPenalty: m.inflationPenalty,
      lockedInSavings: m.lockedInSavings,
      moveForwardImpact: m.moveForward,
      doNothingImpact: m.doNothing,
      netDifference: m.netDiff,
    };
  }, [selectedOption, discountedComputed]);

  /* ─── Header subtitle by stage ─── */
  const headerContent = (() => {
    if (stage === "options" && !selectedOption) {
      return {
        title: `Your ${productLabel} Options`,
        sub: `${state.homeowner1}${state.homeowner2 ? ` & ${state.homeowner2}` : ""}, let me walk you through your options one at a time.`,
      };
    }
    if (stage === "options" && selectedOption) {
      return { title: "Great Choice!", sub: `You've selected Option ${selectedOption}. Here's the financial breakdown.` };
    }
    if (stage === "impact") {
      return { title: "The Numbers Behind Your Decision", sub: `Here's what moving forward with Option ${selectedOption} looks like over the next 10 years.` };
    }
    return null;
  })();

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto animate-fade-in">
      {/* Top-right actions */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <PromoTrigger tier={tier} onChange={setTier} />
        {selectedOption && (
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-md px-4 py-2 hover:bg-primary/90 transition-colors text-sm font-semibold"
            aria-label="Share proposal"
          >
            <Share2 className="h-4 w-4" />
            Share Proposal
          </button>
        )}
        <button onClick={onClose} className="rounded-full bg-card border border-border shadow-md p-2 hover:bg-muted transition-colors" aria-label="Close presentation">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Header */}
      <header className="text-center pt-8 pb-4 px-6">
        <img src={dabellaLogo} alt="DaBella" className="h-10 w-auto mx-auto mb-4" />

        <nav className="flex items-center justify-center gap-2 mb-5">
          {STAGES.map((s, i) => (
            <button
              key={s}
              onClick={() => { if (s === "options" || selectedOption) setStage(s); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                stage === s
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : s !== "options" && !selectedOption
                  ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black ${stage === s ? "bg-primary-foreground/20" : "bg-border"}`}>
                {i + 1}
              </span>
              {STAGE_LABELS[s]}
            </button>
          ))}
        </nav>

        {headerContent && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight mb-1">{headerContent.title}</h1>
            <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">{headerContent.sub}</p>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-6 animate-slide-up" key={`${stage}-${revealIndex}-${selectedOption}`}>
        {stage === "options" && !selectedOption && (
          <>
            <OptionReveal
              revealIndex={revealIndex}
              options={options}
              computed={discountedComputed}
              onAccept={handleAccept}
              onShowNext={() => setRevealIndex((p) => Math.min(p + 1, 2))}
              onGoBack={() => setRevealIndex((p) => Math.max(p - 1, 0))}
              customFeatures={state.customFeatures}
              originalOptions={originalOptions.map((o) => ({ key: o.key, price: o.price }))}
              discountPct={discountPct}
            />
            <div className="mt-8"><TrustBar /></div>
          </>
        )}

        {stage === "options" && selectedOption && (
          <>
            <div className="max-w-md mx-auto mb-6">
              <OptionCard
                optionKey={selectedOption}
                name={options.find((o) => o.key === selectedOption)?.name || ""}
                computed={discountedComputed}
                selected
                customFeatures={state.customFeatures}
                originalPrice={originalOptions.find((o) => o.key === selectedOption)?.price}
                discountPct={discountPct}
              />
              <button
                onClick={() => { setSelectedOption(null); setStage("options"); }}
                className="mt-3 mx-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Change selection
              </button>
            </div>
            <TrustBar />
          </>
        )}

        {stage === "impact" && selectedOption && selectedComputed && (
          <div className="animate-fade-in space-y-6">
            <FinancialImpact state={{ ...state, selectedOption }} computed={selectedComputed} />
          </div>
        )}

        {stage === "inspection" && isWindows && <WindowInspectionView state={state} />}
        {stage === "scope" && <ScopeOfWork products={state.products} />}
        {stage === "welcome" && <WelcomeClose homeowner1={state.homeowner1} homeowner2={state.homeowner2} />}
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

          <div className="flex items-center gap-2">
            {STAGES.map((s, i) => (
              <div key={s} className={`rounded-full transition-all ${i === stageIndex ? "h-2.5 w-8 bg-primary" : "h-2.5 w-2.5 bg-border"}`} />
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
