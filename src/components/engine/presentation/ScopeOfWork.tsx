import { useState } from "react";
import { Check, ClipboardCheck } from "lucide-react";
import {
  SCOPE_ITEMS,
  TILE_ROOF_SCOPE_ITEMS,
  TPO_ROOF_SCOPE_ITEMS,
  STUCCO_SCOPE_ITEMS,
  PAINT_SCOPE_ITEMS,
  SIDING_SCOPE_ITEMS,
  BATH_SCOPE_ITEMS,
  SOLAR_SCOPE_ITEMS,
  GUTTER_SCOPE_ITEMS,
} from "@/data/scopeItems";
import { WINDOW_SCOPE_ITEMS } from "@/data/windowData";

import { hasProduct } from "@/lib/engineHelpers";
import { useT } from "@/contexts/LanguageContext";
import { useTranslatedList } from "@/hooks/useTranslator";
import type { RoofMaterial } from "./constants";

interface Props {
  products?: string[];
  roofMaterial?: RoofMaterial;
}

export default function ScopeOfWork({ products = [], roofMaterial = "shingle" }: Props) {
  const t = useT();
  const isWindows = hasProduct(products, "Windows");
  const isRoofing = hasProduct(products, "Roofing System");
  const isStucco = hasProduct(products, "Stucco");
  const isPaint = hasProduct(products, "Paint");
  const isSiding = hasProduct(products, "Siding");
  const isBath = hasProduct(products, "Bath");
  const isSolar = hasProduct(products, "Solar");
  const isGutters = hasProduct(products, "Gutters");
  const isTile = isRoofing && roofMaterial === "tile";
  const isTpo = isRoofing && roofMaterial === "tpo";

  // Combine scope items from all selected products (de-duped, order preserved)
  const items: string[] = [];
  const pushUnique = (arr: readonly string[]) => {
    for (const it of arr) if (!items.includes(it)) items.push(it);
  };
  if (isRoofing) {
    if (isTile) pushUnique(TILE_ROOF_SCOPE_ITEMS);
    else if (isTpo) pushUnique(TPO_ROOF_SCOPE_ITEMS);
    else pushUnique(SCOPE_ITEMS);
  }
  if (isWindows) pushUnique(WINDOW_SCOPE_ITEMS);
  if (isStucco) pushUnique(STUCCO_SCOPE_ITEMS);
  if (isPaint) pushUnique(PAINT_SCOPE_ITEMS);
  if (isSiding) pushUnique(SIDING_SCOPE_ITEMS);
  if (isBath) pushUnique(BATH_SCOPE_ITEMS);
  if (isSolar) pushUnique(SOLAR_SCOPE_ITEMS);
  if (isGutters) pushUnique(GUTTER_SCOPE_ITEMS);
  // Fallback only if nothing matched
  if (items.length === 0) pushUnique(SCOPE_ITEMS);

  // Translate the scope checklist (per-language cache) so the homeowner sees
  // it in the active language without touching the source data.
  const localizedItems = useTranslatedList(
    items,
    "Home-improvement project scope-of-work checklist items shown to a homeowner. Keep concise, professional, and product-accurate.",
  );

  const [checked, setChecked] = useState<boolean[]>(new Array(items.length).fill(false));
  const [animating, setAnimating] = useState(false);
  const allChecked = checked.every(Boolean);
  const checkedCount = checked.filter(Boolean).length;
  const progress = (checkedCount / items.length) * 100;

  const toggle = (i: number) =>
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  const reviewAll = () => {
    if (allChecked) {
      setChecked(new Array(items.length).fill(false));
      return;
    }
    setAnimating(true);
    items.forEach((_, i) => {
      setTimeout(() => {
        setChecked((prev) => prev.map((v, idx) => (idx <= i ? true : v)));
        if (i === items.length - 1) setAnimating(false);
      }, i * 100);
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-3xl border-2 border-primary/20 bg-card overflow-hidden shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/70 px-8 py-7 text-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <ClipboardCheck className="h-7 w-7 text-primary-foreground" />
            <h2 className="text-2xl font-display font-extrabold text-primary-foreground tracking-tight">
              {t("What to Expect", "Qué Esperar")}
            </h2>
          </div>
          <p className="text-primary-foreground/70 text-sm font-medium">
            {isTile
              ? t("Your complete Westlake Royal Roofing Cool Roof tile installation — from tear-off to final sweep", "Su instalación completa de teja Cool Roof de Westlake Royal Roofing — desde la remoción hasta la limpieza final")
              : isTpo
              ? t("Your complete TPO low-slope roof system — from tear-off to warranty registration", "Su sistema completo de techo TPO de baja pendiente — desde la remoción hasta el registro de la garantía")
              : isRoofing
              ? t("Your complete scope of work — everything included in your project", "Su alcance de trabajo completo — todo lo incluido en su proyecto")
              : isWindows
              ? t("Your complete window project scope — from measure to final walkthrough", "Su alcance completo del proyecto de ventanas — desde la medición hasta el recorrido final")
              : isStucco
              ? t("Your complete stucco restoration — from prep to final coat", "Su restauración de estuco completa — desde la preparación hasta la capa final")
              : isPaint
              ? t("Your complete exterior paint project — from prep to final coat", "Su proyecto de pintura exterior completo — desde la preparación hasta la capa final")
              : isSiding
              ? t("Your complete siding replacement — from tear-off to trim-out", "Su reemplazo de revestimiento completo — desde la remoción hasta los acabados")
              : isBath
              ? t("Your complete bath remodel — from demo to final walkthrough", "Su remodelación de baño completa — desde la demolición hasta el recorrido final")
              : isSolar
              ? t("Your complete solar installation — from permit to PTO", "Su instalación solar completa — desde el permiso hasta la activación (PTO)")
              : isGutters
              ? t("Your complete gutter project — from tear-off to clean-up", "Su proyecto de canaletas completo — desde la remoción hasta la limpieza")
              : t("Your complete scope of work — everything included in your project", "Su alcance de trabajo completo — todo lo incluido en su proyecto")}
          </p>

        </div>

        {/* Progress */}
        <div className="px-8 pt-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
              {t("Scope reviewed", "Alcance revisado")}
            </span>
            <span className="text-xs font-bold text-primary tabular-nums">
              {checkedCount} / {items.length}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="px-6 py-4 space-y-0.5">
          {items.map((item, i) => {
            const done = checked[i];
            const label = localizedItems[i] ?? item;
            return (
              <button
                key={i}
                onClick={() => toggle(i)}
                className={`w-full flex items-start gap-4 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  done ? "bg-accent/8" : "hover:bg-muted/50"
                }`}
              >
                <div
                  className={`flex-shrink-0 mt-0.5 h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                    done ? "bg-accent border-accent" : "border-border"
                  } ${done ? "animate-check-pop" : ""}`}
                >
                  {done && <Check className="h-3.5 w-3.5 text-accent-foreground" strokeWidth={3} />}
                </div>
                <span
                  className={`text-sm font-medium leading-snug transition-colors duration-200 ${
                    done ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action */}
        <div className="px-8 pb-8 pt-2">
          <button
            onClick={reviewAll}
            disabled={animating}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-base tracking-wide hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-60"
          >
            {allChecked ? t("Reset Checklist", "Reiniciar lista") : t("✓  Review All Items", "✓  Revisar todos los puntos")}
          </button>
        </div>
      </div>

      {/* Script prompt */}
      <div className="script-block text-center max-w-2xl mx-auto text-base">
        {t('"Does that sound like everything we have spoken about today?"', '"¿Le parece que esto cubre todo lo que hemos hablado hoy?"')}
      </div>
    </div>
  );
}
