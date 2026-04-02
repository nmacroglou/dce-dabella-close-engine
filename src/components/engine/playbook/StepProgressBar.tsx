import { memo } from "react";
import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { SELLING_STEPS } from "@/data/sellingSteps";

interface StepProgressBarProps {
  activeStepId: number;
  completedSteps: Set<number>;
  onSelectStep: (id: number) => void;
}

export default memo(function StepProgressBar({ activeStepId, completedSteps, onSelectStep }: StepProgressBarProps) {
  const progress = (completedSteps.size / SELLING_STEPS.length) * 100;

  return (
    <div className="card-elevated-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-foreground">10-Step Selling System</h3>
        <span className="text-sm font-semibold text-primary">
          {completedSteps.size}/{SELLING_STEPS.length} completed
        </span>
      </div>
      <Progress value={progress} className="h-2.5 rounded-full" />

      <div className="flex gap-1.5 mt-4 overflow-x-auto pb-1">
        {SELLING_STEPS.map((step) => {
          const isActive = step.id === activeStepId;
          const isComplete = completedSteps.has(step.id);
          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(step.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : isComplete
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {isComplete ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="w-4 text-center">{step.id}</span>
              )}
              <span className="hidden sm:inline">
                {step.title.split(" / ")[0].split(" — ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
