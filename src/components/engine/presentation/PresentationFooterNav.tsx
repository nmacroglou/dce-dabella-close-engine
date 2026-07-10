import { memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/contexts/LanguageContext";

export interface PresentationFooterNavProps<S extends string> {
  stages: readonly S[];
  stage: S;
  onPrev: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}

function PresentationFooterNavImpl<S extends string>({
  stages,
  stage,
  onPrev,
  onNext,
  nextDisabled,
}: PresentationFooterNavProps<S>) {
  const stageIndex = stages.indexOf(stage);
  const isLast = stageIndex >= stages.length - 1;
  return (
    <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={stageIndex === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-muted text-foreground font-semibold text-sm transition-all disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          {stages.map((s, i) => (
            <div
              key={s}
              className={`rounded-pill transition-all ${
                i === stageIndex ? "h-2.5 w-8 bg-primary" : "h-2.5 w-2.5 bg-border"
              }`}
            />
          ))}
        </div>

        {!isLast ? (
          <button
            onClick={onNext}
            disabled={nextDisabled}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="w-[120px]" />
        )}
      </div>
    </div>
  );
}

export default memo(PresentationFooterNavImpl) as typeof PresentationFooterNavImpl;
