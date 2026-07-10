import { useState } from "react";
import { Check, ClipboardCheck } from "lucide-react";
import {
  SCOPE_ITEMS,
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

interface Props {
  products?: string[];
}

export default function ScopeOfWork({ products = [] }: Props) {
  const isWindows = hasProduct(products, "Windows");
  const isRoofing = hasProduct(products, "Roofing System");
  const isStucco = hasProduct(products, "Stucco");
  const isPaint = hasProduct(products, "Paint");
  const isSiding = hasProduct(products, "Siding");
  const isBath = hasProduct(products, "Bath");
  const isSolar = hasProduct(products, "Solar");
  const isGutters = hasProduct(products, "Gutters");

  // Combine scope items from all selected products (de-duped, order preserved)
  const items: string[] = [];
  const pushUnique = (arr: readonly string[]) => {
    for (const it of arr) if (!items.includes(it)) items.push(it);
  };
  if (isRoofing) pushUnique(SCOPE_ITEMS);
  if (isWindows) pushUnique(WINDOW_SCOPE_ITEMS);
  if (isStucco) pushUnique(STUCCO_SCOPE_ITEMS);
  if (isPaint) pushUnique(PAINT_SCOPE_ITEMS);
  if (isSiding) pushUnique(SIDING_SCOPE_ITEMS);
  if (isBath) pushUnique(BATH_SCOPE_ITEMS);
  if (isSolar) pushUnique(SOLAR_SCOPE_ITEMS);
  if (isGutters) pushUnique(GUTTER_SCOPE_ITEMS);
  // Fallback only if nothing matched
  if (items.length === 0) pushUnique(SCOPE_ITEMS);


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
              What to Expect
            </h2>
          </div>
          <p className="text-primary-foreground/70 text-sm font-medium">
            {isRoofing
              ? "Your complete scope of work — everything included in your project"
              : isWindows
              ? "Your complete window project scope — from measure to final walkthrough"
              : isStucco
              ? "Your complete stucco restoration — from prep to final coat"
              : isPaint
              ? "Your complete exterior paint project — from prep to final coat"
              : isSiding
              ? "Your complete siding replacement — from tear-off to trim-out"
              : isBath
              ? "Your complete bath remodel — from demo to final walkthrough"
              : isSolar
              ? "Your complete solar installation — from permit to PTO"
              : isGutters
              ? "Your complete gutter project — from tear-off to clean-up"
              : "Your complete scope of work — everything included in your project"}
          </p>

        </div>

        {/* Progress */}
        <div className="px-8 pt-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
              Scope reviewed
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
                  {item}
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
            {allChecked ? "Reset Checklist" : "✓  Review All Items"}
          </button>
        </div>
      </div>

      {/* Script prompt */}
      <div className="script-block text-center max-w-2xl mx-auto text-base">
        "Does that sound like everything we have spoken about today?"
      </div>
    </div>
  );
}
