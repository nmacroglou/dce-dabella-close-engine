import { useState, useMemo, lazy, Suspense } from "react";
import type { EngineTabProps } from "@/types/engine";
import { MessageSquare, Loader2 } from "lucide-react";
import { fmt } from "@/lib/format";
import { buildOptionsArray } from "@/lib/engineHelpers";
import { useT } from "@/contexts/LanguageContext";
import ScriptCard from "./shared/ScriptCard";
import ActionGrid from "./presentation/ActionGrid";
import FinancialImpact from "./presentation/FinancialImpact";
import IncludedFeaturesEditor from "./presentation/IncludedFeaturesEditor";
import { OPTION_NAME_DEFAULTS, ALL_DEFAULT_OPTION_NAMES, type RoofMaterial } from "./presentation/constants";

const CustomerPresentationView = lazy(() => import("./CustomerPresentationView"));

export default function PresentationTab({ state, computed, update }: EngineTabProps) {
  const t = useT();
  const [showNarrow, setShowNarrow] = useState(false);
  const [showCustomerView, setShowCustomerView] = useState(false);

  const options = useMemo(() => buildOptionsArray(state, computed), [
    state.optionAName, state.optionBName, state.optionCName,
    state.priceA, state.priceB, state.priceC,
    computed.options.A.monthly, computed.options.B.monthly, computed.options.C.monthly,
  ]);

  if (showCustomerView) {
    return (
      <Suspense fallback={
        <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }>
        <CustomerPresentationView state={state} computed={computed} update={update} onClose={() => setShowCustomerView(false)} />
      </Suspense>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
      {/* LEFT — 3 cols */}
      <div className="lg:col-span-3 space-y-6">
        <div className="card-elevated-lg p-6">
          <h3 className="text-lg font-display font-bold text-foreground mb-5">{t("Quick comparison board", "Comparación rápida")}</h3>
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
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">{t("Option", "Opción")} {opt.key}</p>
                </div>
                <div className="flex items-baseline gap-2 sm:flex-col sm:items-center sm:gap-0">
                  <p className="text-xl sm:text-2xl font-extrabold text-primary">{fmt(opt.price)}</p>
                  <p className="text-xs text-muted-foreground sm:mb-2">{fmt(opt.monthly)}/{t("mo", "mes")}</p>
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

        <IncludedFeaturesEditor
          value={state.customFeatures}
          onChange={(next) => update("customFeatures", next)}
          perOption={{
            A: state.customFeaturesA,
            B: state.customFeaturesB,
            C: state.customFeaturesC,
          }}
          onChangePerOption={(key, next) => {
            if (key === "A") update("customFeaturesA", next);
            else if (key === "B") update("customFeaturesB", next);
            else update("customFeaturesC", next);
          }}
          products={state.products}
          roofMaterial={state.roofMaterial ?? "shingle"}
          onChangeRoofMaterial={(m: RoofMaterial) => {
            update("roofMaterial", m);
            const defaults = OPTION_NAME_DEFAULTS[m];
            // Only swap names that were untouched (still match a known default)
            if (!state.optionAName || ALL_DEFAULT_OPTION_NAMES.has(state.optionAName)) update("optionAName", defaults.A);
            if (!state.optionBName || ALL_DEFAULT_OPTION_NAMES.has(state.optionBName)) update("optionBName", defaults.B);
            if (!state.optionCName || ALL_DEFAULT_OPTION_NAMES.has(state.optionCName)) update("optionCName", defaults.C);
          }}
        />

        <FinancialImpact state={state} computed={computed} />
      </div>

      {/* RIGHT — Scripts */}
      <div className="lg:col-span-2">
        <div className="card-elevated-lg p-6">
          <h3 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> {t("Presentation scripts", "Guiones de presentación")}
          </h3>
          <div className="space-y-4">
            <ScriptCard title={t("Opening control", "Control de apertura")} text={t(`"Great, give me a second to finalize the numbers and we'll get right to it."`, `"Perfecto, denme un segundo para finalizar los números y comenzamos."`)} />
            <ScriptCard title={t("Price drop", "Presentación del precio")} text={t(`"For all of this, your project comes down to only ..."`, `"Por todo esto, su proyecto queda en solo ..."`)} />
            <ScriptCard title={t("T-close line", "Frase de cierre-T")} text={t(`"Most people here aren't deciding if — they're deciding whether the money makes sense. Fair?"`, `"La mayoría aquí no está decidiendo si — está decidiendo si el dinero les hace sentido. ¿Justo?"`)} />
            <ScriptCard title={t("ROI line", "Frase de ROI")} text={t(`"Based on that percentage, you'd be increasing the value of your home by ${fmt(computed.options.A.roiValue)}."`, `"Basado en ese porcentaje, estarían aumentando el valor de su casa en ${fmt(computed.options.A.roiValue)}."`)} />
            <ScriptCard title={t("Energy line", "Frase de energía")} text={t(`"At ${fmt(state.monthlyBill)}/month, that's ${fmt(computed.tenYearCost)} over 10 years. At ${state.energySavingsPct}% savings, that's ${fmt(computed.energySavings)} back in your pocket."`, `"A ${fmt(state.monthlyBill)}/mes, son ${fmt(computed.tenYearCost)} en 10 años. Con ${state.energySavingsPct}% de ahorro, son ${fmt(computed.energySavings)} de regreso a su bolsillo."`)} />
          </div>
        </div>
      </div>
    </div>
  );
}
