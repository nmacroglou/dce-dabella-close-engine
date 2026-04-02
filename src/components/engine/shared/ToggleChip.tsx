import { memo } from "react";

interface ToggleChipProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

/** Pill-style toggle button */
export default memo(function ToggleChip({ label, checked, onChange }: ToggleChipProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
        checked
          ? "bg-primary/10 border-primary/30 text-primary"
          : "bg-card border-border text-muted-foreground hover:border-primary/20"
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${checked ? "bg-primary" : "bg-muted-foreground/30"}`} />
      {label}
    </button>
  );
});
