import { memo } from "react";

interface Props {
  formula: string;
  result: string;
  label: string;
}

export default memo(function FormulaBlock({ formula, result, label }: Props) {
  return (
    <div className="rounded-xl bg-muted/60 border border-border p-3 space-y-1">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xs font-mono text-foreground/80">{formula}</p>
      <p className="text-lg font-extrabold text-foreground">{result}</p>
    </div>
  );
});
