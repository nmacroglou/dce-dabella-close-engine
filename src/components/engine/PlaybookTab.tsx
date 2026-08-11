import { useState, useCallback } from "react";
import type { EngineTabProps } from "@/types/engine";
import { SELLING_STEPS } from "@/data/sellingSteps";
import { Check, ChevronRight, ExternalLink, Swords, Thermometer, Star, Lightbulb, Home } from "lucide-react";
import { useSetToggle } from "@/hooks/useSetToggle";
import { useT } from "@/contexts/LanguageContext";
import StepProgressBar from "./playbook/StepProgressBar";
import Checklist from "./playbook/Checklist";
import ReferencePanel from "./playbook/ReferencePanel";
import PaymentFactorsPanel from "./playbook/PaymentFactorsPanel";
import CollapsibleCard from "./shared/CollapsibleCard";
import BattleCardPanel from "./playbook/BattleCardPanel";
import PillarsBattleCardPanel from "./playbook/PillarsBattleCardPanel";
import CvvBattleCardsPanel from "./playbook/CvvBattleCardsPanel";
import CoolLifeBattleCardPanel from "./playbook/CoolLifeBattleCardPanel";
import CoolLifeResourcesPanel from "./playbook/CoolLifeResourcesPanel";
import ReviewsPanel from "./playbook/ReviewsPanel";
import RoofResourcesPanel from "./playbook/RoofResourcesPanel";

type SidebarSection = "battle" | "coollife" | "roof" | "reviews" | "coach";

export default function PlaybookTab({ state, update }: EngineTabProps) {
  const t = useT();
  const TAB_LABELS: Record<string, string> = {
    calculator: t("Calculator", "Calculadora"),
    presentation: t("Presentation", "Presentación"),
    closing: t("Closing Stack", "Cierre"),
  };
  const SIDEBAR_SECTIONS: { id: SidebarSection; label: string; icon: typeof Swords }[] = [
    { id: "battle", label: t("Battle", "Batalla"), icon: Swords },
    { id: "coollife", label: "Cool Life", icon: Thermometer },
    { id: "roof", label: t("Roof", "Techo"), icon: Home },
    { id: "reviews", label: t("Reviews", "Reseñas"), icon: Star },
    { id: "coach", label: t("Coach", "Coach"), icon: Lightbulb },
  ];
  const [activeStepId, setActiveStepId] = useState(1);
  const [sidebarSection, setSidebarSection] = useState<SidebarSection>("battle");
  const completed = useSetToggle<number>();
  const scripts = useSetToggle<number>();
  const refs = useSetToggle<string>();
  const [showPaymentFactors, setShowPaymentFactors] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, Set<number>>>({});


  const activeStep = SELLING_STEPS.find((s) => s.id === activeStepId)!;

  const toggleCheck = useCallback((idx: number) => {
    setCheckedItems((prev) => {
      const stepSet = new Set(prev[activeStepId] || []);
      if (stepSet.has(idx)) stepSet.delete(idx);
      else stepSet.add(idx);
      return { ...prev, [activeStepId]: stepSet };
    });
  }, [activeStepId]);

  return (
    <div className="animate-fade-in space-y-6">
      <StepProgressBar
        activeStepId={activeStepId}
        completedSteps={completed.set}
        onSelectStep={setActiveStepId}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main content */}
        <div className="lg:col-span-3 space-y-5">
          {/* Step header */}
          <div className="card-elevated-lg p-6">
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-12 h-12 rounded-2xl gradient-brand text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)]">
                <activeStep.icon className="h-6 w-6" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold text-foreground">
                    {t("Step", "Paso")} {activeStep.id}: {activeStep.title}
                  </h3>
                  {completed.has(activeStepId) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                      <Check className="h-3 w-3" /> {t("Done", "Hecho")}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{activeStep.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Script */}
          <div className="card-elevated-lg p-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {t("Suggested Script", "Guion sugerido")}
            </h4>
            <div className="script-block text-base leading-relaxed whitespace-pre-line">
              {activeStep.script}
            </div>
          </div>

          {/* Detailed scenario scripts */}
          {activeStep.detailedScripts?.map((ds, idx) => (
            <CollapsibleCard
              key={idx}
              title={ds.label}
              badge={t("Scenario", "Escenario")}
              isOpen={scripts.has(idx)}
              onToggle={() => scripts.toggle(idx)}
            >
              <div className="script-block text-sm leading-relaxed whitespace-pre-line">
                {ds.text}
              </div>
            </CollapsibleCard>
          ))}

          {/* Checklist */}
          <Checklist
            items={activeStep.checklist}
            checkedIndices={checkedItems[activeStepId] || new Set()}
            onToggle={toggleCheck}
          />

          {/* Reference sections */}
          {activeStep.references?.map((ref, rIdx) => (
            <ReferencePanel
              key={rIdx}
              reference={ref}
              isOpen={refs.has(`${activeStepId}-${rIdx}`)}
              onToggle={() => refs.toggle(`${activeStepId}-${rIdx}`)}
            />
          ))}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-5">
          {/* Sidebar section switcher */}
          <div className="grid grid-cols-4 gap-1 rounded-2xl border border-hairline bg-muted/30 p-1">
            {SIDEBAR_SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSidebarSection(s.id)}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-semibold transition-all ${
                  sidebarSection === s.id
                    ? "bg-card text-primary shadow-sm border border-hairline"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </button>
            ))}
          </div>

          {sidebarSection === "battle" && (
            <div className="space-y-5 animate-fade-in">
              <PillarsBattleCardPanel />
              <BattleCardPanel />
              <CvvBattleCardsPanel />
            </div>
          )}

          {sidebarSection === "coollife" && (
            <div className="space-y-5 animate-fade-in">
              <CoolLifeBattleCardPanel />
              <CoolLifeResourcesPanel />
            </div>
          )}

          {sidebarSection === "reviews" && (
            <div className="animate-fade-in">
              <ReviewsPanel />
            </div>
          )}

          {sidebarSection === "coach" && (
            <div className="space-y-5 animate-fade-in">
              {/* Tips */}
              <div className="card-elevated-lg p-6">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  {t("Pro Tips", "Consejos pro")}
                </h4>
                <div className="space-y-3">
                  {activeStep.tips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-primary" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Factors */}
              <PaymentFactorsPanel
                isOpen={showPaymentFactors}
                onToggle={() => setShowPaymentFactors(!showPaymentFactors)}
              />
            </div>
          )}


          {/* Deep link */}
          {activeStep.linkTab && (
            <button
              onClick={() => update("activeTab", activeStep.linkTab!)}
              className="w-full card-elevated-lg p-5 flex items-center gap-3 text-left hover:border-primary/50 transition-all group"
            >
              <ExternalLink className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {t("Open", "Abrir")} {TAB_LABELS[activeStep.linkTab] || activeStep.linkTab}
                </p>
                <p className="text-xs text-muted-foreground">{t("Jump to the relevant tool", "Ir a la herramienta relevante")}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          )}

          {/* Mark complete */}
          <button
            onClick={() => completed.toggle(activeStepId)}
            className={`w-full rounded-2xl px-5 py-4 text-sm font-bold transition-all pressable ${
              completed.has(activeStepId)
                ? "bg-accent/15 text-accent border border-accent/30 hover:bg-accent/20"
                : "gradient-brand text-primary-foreground hover:opacity-95 shadow-[var(--shadow-glow)]"
            }`}
          >
            {completed.has(activeStepId) ? t("✓ Completed — Tap to Undo", "✓ Completado — Toca para deshacer") : t("Mark Step Complete", "Marcar paso como completo")}
          </button>

          {/* Next step */}
          {activeStepId < 10 && (
            <button
              onClick={() => setActiveStepId(activeStepId + 1)}
              className="w-full rounded-2xl border border-hairline bg-card px-5 py-4 text-sm font-semibold text-foreground hover:bg-muted/50 hover:border-primary/40 transition-all flex items-center justify-center gap-2 pressable"
            >
              {t("Next: Step", "Siguiente: Paso")} {activeStepId + 1} <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
