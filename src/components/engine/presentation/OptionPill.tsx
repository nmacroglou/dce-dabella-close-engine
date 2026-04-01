import { memo } from "react";

interface Props {
  label: string;
  active: boolean;
  onClick: () => void;
}

export default memo(function OptionPill({ label, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {label}
    </button>
  );
});
