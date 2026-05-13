import { memo } from "react";
import { Check, ArrowRight, ChevronLeft } from "lucide-react";
import { OPTION_KEYS } from "@/lib/engineHelpers";
import type { ComputedValues } from "@/types/engine";
import OptionCard from "./OptionCard";

interface OptionRevealProps {
  revealIndex: number;
  options: { key: "A" | "B" | "C"; name: string; price: number; monthly: number }[];
  computed: ComputedValues;
  onAccept: (key: "A" | "B" | "C") => void;
  onShowNext: () => void;
  onGoBack: () => void;
  customFeatures?: string[];
  perOptionFeatures?: Partial<Record<"A" | "B" | "C", string[] | undefined>>;
  originalOptions?: { key: "A" | "B" | "C"; price: number }[];
  discountPct?: number;
  monthlyOverrides?: Partial<Record<"A" | "B" | "C", number | undefined>>;
  onMonthlyChange?: (key: "A" | "B" | "C", next: number | undefined) => void;
}

export default memo(function OptionReveal({
  revealIndex, options, computed, onAccept, onShowNext, onGoBack, customFeatures, perOptionFeatures, originalOptions, discountPct, monthlyOverrides, onMonthlyChange,
}: OptionRevealProps) {
  const currentKey = OPTION_KEYS[revealIndex];
  const currentOption = options[revealIndex];
  const isLastOption = revealIndex >= 2;
  const originalPrice = originalOptions?.find((o) => o.key === currentKey)?.price;

  return (
    <div className="max-w-md mx-auto animate-fade-in">
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
            ) : (
              <span>Option {key}</span>
            )}
          </div>
        ))}
      </div>

      <OptionCard
        optionKey={currentKey}
        name={currentOption.name}
        computed={computed}
        selected={false}
        customFeatures={perOptionFeatures?.[currentKey] ?? customFeatures}
        originalPrice={originalPrice}
        discountPct={discountPct}
        monthlyOverride={monthlyOverrides?.[currentKey]}
        onMonthlyChange={onMonthlyChange ? (n) => onMonthlyChange(currentKey, n) : undefined}
      />

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
        <button
          onClick={() => onAccept(currentKey)}
          className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <Check className="h-5 w-5" />
          I Like This Option
        </button>
        {!isLastOption && (
          <button
            onClick={onShowNext}
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

      {/* Go back */}
      {revealIndex > 0 && (
        <button
          onClick={onGoBack}
          className="mt-3 mx-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Review previous option
        </button>
      )}
    </div>
  );
});
