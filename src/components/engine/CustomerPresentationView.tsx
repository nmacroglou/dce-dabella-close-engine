import { useState, useMemo, useEffect, useRef } from "react";
import type { EngineState, ComputedValues } from "@/types/engine";
import { X, ChevronLeft, Share2, Languages, Loader2 } from "lucide-react";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslateBatch } from "@/hooks/useTranslator";
import { toast } from "sonner";

interface Props {
  state: EngineState;
  computed: ComputedValues;
  onClose: () => void;
  update?: <K extends keyof EngineState>(key: K, value: EngineState[K]) => void;
}

const BASE_STAGES = ["options", "impact", "scope", "welcome"] as const;
const WINDOW_STAGES = ["options", "impact", "inspection", "scope", "welcome"] as const;
type Stage = "options" | "impact" | "inspection" | "scope" | "welcome";

const STAGE_LABELS_EN: Record<Stage, string> = {
  options: "Your Options",
  impact: "The Numbers",
  inspection: "Inspection",
  scope: "What to Expect",
  welcome: "Welcome",
};
const STAGE_LABELS_ES: Record<Stage, string> = {
  options: "Sus Opciones",
  impact: "Los Números",
  inspection: "Inspección",
  scope: "Qué Esperar",
  welcome: "Bienvenida",
};

export default function CustomerPresentationView({ state, computed, onClose, update }: Props) {
  const { t, lang } = useLanguage();
  const STAGE_LABELS = lang === "es" ? STAGE_LABELS_ES : STAGE_LABELS_EN;
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

  // ─── Language auto-translate ────────────────────────────────────────────
  // When the language toggles, translate the rep-authored, customer-facing
  // strings (option names + custom feature bullet lists) in-place so the
  // homeowner sees the presentation in their language. Homeowner names,
  // computed numbers, and hard-coded UI labels are untouched.
  const translateBatch = useTranslateBatch();
  const [translatePending, setTranslatePending] = useState(false);
  const lastLangRef = useRef(lang);
  const runTranslate = async (target: "en" | "es") => {
    if (!update) return;
    // Collect the strings to translate in a stable order so we can zip results back.
    type Slot =
      | { kind: "name"; opt: "A" | "B" | "C" }
      | { kind: "feat"; opt: "shared" | "A" | "B" | "C"; index: number };
    const slots: Slot[] = [];
    const texts: string[] = [];

    (["A", "B", "C"] as const).forEach((opt) => {
      const name = opt === "A" ? state.optionAName : opt === "B" ? state.optionBName : state.optionCName;
      if (name && name.trim().length > 0) {
        slots.push({ kind: "name", opt });
        texts.push(name);
      }
    });
    const featureBuckets: { key: "shared" | "A" | "B" | "C"; list: string[] | undefined }[] = [
      { key: "shared", list: state.customFeatures },
      { key: "A", list: state.customFeaturesA },
      { key: "B", list: state.customFeaturesB },
      { key: "C", list: state.customFeaturesC },
    ];
    featureBuckets.forEach(({ key, list }) => {
      (list ?? []).forEach((f, i) => {
        if (f && f.trim().length > 0) {
          slots.push({ kind: "feat", opt: key, index: i });
          texts.push(f);
        }
      });
    });

    if (texts.length === 0) return;
    setTranslatePending(true);
    const toastId = toast.loading(target === "es" ? "Traduciendo presentación…" : "Translating presentation…");
    try {
      const translated = await translateBatch(
        texts,
        target,
        "Home-improvement sales presentation: package/option names and short benefit bullets shown to a homeowner. Keep concise, natural, and marketing-quality.",
      );

      // Apply option name updates.
      const newNames: Record<"A" | "B" | "C", string | null> = { A: null, B: null, C: null };
      const newFeatures: Record<"shared" | "A" | "B" | "C", string[] | null> = {
        shared: null, A: null, B: null, C: null,
      };
      // Clone existing arrays so partial updates preserve order.
      featureBuckets.forEach(({ key, list }) => {
        if (list) newFeatures[key] = [...list];
      });

      slots.forEach((slot, i) => {
        const val = translated[i];
        if (typeof val !== "string" || val.length === 0) return;
        if (slot.kind === "name") newNames[slot.opt] = val;
        else if (newFeatures[slot.opt]) newFeatures[slot.opt]![slot.index] = val;
      });

      if (newNames.A !== null) update("optionAName", newNames.A as never);
      if (newNames.B !== null) update("optionBName", newNames.B as never);
      if (newNames.C !== null) update("optionCName", newNames.C as never);
      if (newFeatures.shared) update("customFeatures", newFeatures.shared as never);
      if (newFeatures.A) update("customFeaturesA", newFeatures.A as never);
      if (newFeatures.B) update("customFeaturesB", newFeatures.B as never);
      if (newFeatures.C) update("customFeaturesC", newFeatures.C as never);

      toast.success(
        target === "es" ? "Presentación traducida al español" : "Presentation translated to English",
        { id: toastId },
      );
    } catch (e) {
      console.error("translate presentation failed", e);
      toast.error(target === "es" ? "Traducción falló" : "Translation failed", { id: toastId });
    } finally {
      setTranslatePending(false);
    }
  };

  useEffect(() => {
    if (lastLangRef.current === lang) return;
    lastLangRef.current = lang;
    void runTranslate(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

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
        title: t(`Your ${productLabel} Options`, `Sus Opciones de ${productLabel}`),
        sub: `${state.homeowner1}${state.homeowner2 ? ` & ${state.homeowner2}` : ""}, ${t("let me walk you through your options one at a time.", "permítame guiarle a través de sus opciones una a la vez.")}`,
      };
    }
    if (stage === "options" && selectedOption) {
      return {
        title: t("Great Choice!", "¡Excelente elección!"),
        sub: t(`You've selected Option ${selectedOption}. Here's the financial breakdown.`, `Ha elegido la Opción ${selectedOption}. Aquí tiene el desglose financiero.`),
      };
    }
    if (stage === "impact") {
      return {
        title: t("The Numbers Behind Your Decision", "Los Números Detrás de Su Decisión"),
        sub: t(`Here's what moving forward with Option ${selectedOption} looks like over the next 10 years.`, `Así se ve avanzar con la Opción ${selectedOption} durante los próximos 10 años.`),
      };
    }
    return null;
  })();

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto animate-fade-in">
      {/* Top-right actions */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <PromoTrigger tier={tier} onChange={setTier} />
        {update && (
          <button
            onClick={() => runTranslate(lang === "es" ? "en" : "es")}
            disabled={translatePending}
            className="flex items-center gap-2 rounded-full bg-card border border-border shadow-md px-3 py-2 hover:bg-muted transition-colors text-sm font-semibold disabled:opacity-60"
            aria-label={t("Translate presentation", "Traducir presentación")}
            title={t("Translate option names + features to the other language.", "Traducir nombres de opciones y características al otro idioma.")}
          >
            {translatePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
            {lang === "es" ? "EN" : "ES"}
          </button>
        )}
        <button
          onClick={() => setShareOpen(true)}
          className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-md px-4 py-2 hover:bg-primary/90 transition-colors text-sm font-semibold"
          aria-label={t("Share proposal", "Compartir propuesta")}
        >
          <Share2 className="h-4 w-4" />
          {selectedOption ? t("Share Proposal", "Compartir Propuesta") : t("Share All 3 Options", "Compartir las 3 Opciones")}
        </button>
        <button onClick={onClose} className="rounded-full bg-card border border-border shadow-md p-2 hover:bg-muted transition-colors" aria-label={t("Close presentation", "Cerrar presentación")}>
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
              products={state.products}
              roofMaterial={state.roofMaterial}
              originalOptions={originalOptions.map((o) => ({ key: o.key, price: o.price }))}
              discountPct={discountPct}
              monthlyOverrides={{
                A: state.monthlyOverrideA,
                B: state.monthlyOverrideB,
                C: state.monthlyOverrideC,
              }}
              onMonthlyChange={update ? (key, n) => {
                if (key === "A") update("monthlyOverrideA", n as never);
                else if (key === "B") update("monthlyOverrideB", n as never);
                else update("monthlyOverrideC", n as never);
              } : undefined}
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
                products={state.products}
                roofMaterial={state.roofMaterial}
                originalPrice={originalOptions.find((o) => o.key === selectedOption)?.price}
                discountPct={discountPct}
                monthlyOverride={
                  selectedOption === "A" ? state.monthlyOverrideA :
                  selectedOption === "B" ? state.monthlyOverrideB :
                  state.monthlyOverrideC
                }
                onMonthlyChange={update ? (n) => {
                  if (selectedOption === "A") update("monthlyOverrideA", n as never);
                  else if (selectedOption === "B") update("monthlyOverrideB", n as never);
                  else update("monthlyOverrideC", n as never);
                } : undefined}
              />
              <button
                onClick={() => { setSelectedOption(null); setStage("options"); }}
                className="mt-3 mx-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> {t("Change selection", "Cambiar selección")}
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
        {stage === "scope" && <ScopeOfWork products={state.products} roofMaterial={state.roofMaterial} />}
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
        originalComputed={computed}
      />
    </div>
  );
}
