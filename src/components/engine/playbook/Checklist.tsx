import { memo } from "react";
import { Check } from "lucide-react";

interface ChecklistProps {
  items: string[];
  checkedIndices: Set<number>;
  onToggle: (idx: number) => void;
}

export default memo(function Checklist({ items, checkedIndices, onToggle }: ChecklistProps) {
  return (
    <div className="card-elevated-lg p-6">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Checklist
      </h4>
      <div className="space-y-2">
        {items.map((item, idx) => {
          const checked = checkedIndices.has(idx);
          return (
            <button
              key={idx}
              onClick={() => onToggle(idx)}
              className={`w-full text-left flex items-center gap-3 rounded-xl px-4 py-3 transition-all touch-target ${
                checked ? "bg-accent/10 text-foreground" : "bg-muted/50 text-foreground hover:bg-muted"
              }`}
            >
              <span
                className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  checked ? "bg-accent border-accent text-white" : "border-border"
                }`}
              >
                {checked && <Check className="h-3 w-3" />}
              </span>
              <span className={`text-sm font-medium ${checked ? "line-through opacity-60" : ""}`}>
                {item}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
