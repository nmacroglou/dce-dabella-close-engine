import { useState, useMemo, useEffect } from "react";
import type { EngineState, ComputedValues } from "@/types/engine";
import { X, ChevronLeft, Share2 } from "lucide-react";
import { buildOptionsArray, getOptionMetrics, getProductLabel, hasProduct, applyDiscountToComputed } from "@/lib/engineHelpers";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import { useUpdateDeal } from "@/hooks/useDeals";
import OptionCard from "./presentation/OptionCard";
import OptionReveal from "./presentation/OptionReveal";
import TrustBar from "./presentation/TrustBar";
import ScopeOfWork from "./presentation/ScopeOfWork";
import WelcomeClose from "./presentation/WelcomeClose";
import FinancialImpact from "./presentation/FinancialImpact";
import WindowInspectionView from "./presentation/WindowInspectionView";
import PromoTrigger, { tierPct, type TierState } from "./presentation/PromoTrigger";
import SharePdfDialog from "./presentation/SharePdfDialog";
import PresentationHeader from "./presentation/PresentationHeader";
import PresentationFooterNav from "./presentation/PresentationFooterNav";

interface Props {
  state: EngineState;
  computed: ComputedValues;
  onClose: () => void;
  update?: <K extends keyof EngineState>(key: K, value: EngineState[K]) => void;
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

  const { activeDealId } = useActiveDeal();
  const updateDeal = useUpdateDeal();

  const handleAccept = (key: "A" | "B" | "C") => {
    setSelectedOption(key);
    setStage("impact");
  };

  // Persist selection + discounted price ("sold for") to the active deal so the
  // Commission Sheet auto-mirrors it as roof worth (original selected option)
  // and roof sold-for (post-discount).
  useEffect(() => {
    if (!activeDealId || !selectedOption) return;
    // Use the discounted computed price, not state.priceX (which is the raw entry).
    const soldFor = Math.round(discountedComputed.options[selectedOption].price);
    updateDeal.mutate({
      id: activeDealId,
      updates: { selected_option: selectedOption, closed_amount: soldFor } as never,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDealId, selectedOption, discountPct]);




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

      <PresentationHeader
        stages={STAGES}
        stageLabels={STAGE_LABELS}
        stage={stage}
        canNavigate={(s) => s === "options" || !!selectedOption}
        onStageClick={setStage}
        title={headerContent?.title}
        subtitle={headerContent?.sub}
      />

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
              perOptionFeatures={{
                A: state.customFeaturesA,
                B: state.customFeaturesB,
                C: state.customFeaturesC,
              }}
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
                customFeatures={
                  (selectedOption === "A" ? state.customFeaturesA :
                   selectedOption === "B" ? state.customFeaturesB :
                   state.customFeaturesC) ?? state.customFeatures
                }
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

      <PresentationFooterNav
        stages={STAGES}
        stage={stage}
        onPrev={goPrev}
        onNext={goNext}
        nextDisabled={stage === "options" && !selectedOption}
      />

      <SharePdfDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        state={state}
        computed={discountedComputed}
        selectedOption={selectedOption}
      />
    </div>
  );
}
