import { memo, useState, useEffect } from "react";
import type { ComputedValues, EngineState } from "@/types/engine";
import { Scale, ToggleLeft, ToggleRight, Info } from "lucide-react";
import { fmt } from "@/lib/format";
import { getOptionLabel, getOptionMetrics, OPTION_KEYS } from "@/lib/engineHelpers";
import FormulaBlock from "./FormulaBlock";
import OptionPill from "./OptionPill";
import T from "@/components/i18n/T";

interface Props {
  state: EngineState;
  computed: ComputedValues;
}

export default memo(function TCloseBoard({ state, computed }: Props) {
  const [mode, setMode] = useState<"single" | "compare">("single");
  const [selectedKey, setSelectedKey] = useState<"A" | "B" | "C">(state.selectedOption || "A");

  useEffect(() => {
    if (state.selectedOption) setSelectedKey(state.selectedOption);
  }, [state.selectedOption]);

  const sel = getOptionMetrics(selectedKey, computed);
  const selLabel = getOptionLabel(selectedKey, state);

  return (
    <div className="card-elevated-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" /> <T>T-Close Board</T>
        </h3>
        <button
          onClick={() => setMode(m => m === "single" ? "compare" : "single")}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          {mode === "single" ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
          {mode === "single" ? <T>Compare all</T> : <T>Single view</T>}
        </button>
      </div>

      {/* Coach script */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1">
          <Info className="h-3 w-3" /> <T>What to say</T>
        </p>
        <p className="text-sm text-foreground/90 italic leading-relaxed">
          <T context="Sales coaching script line spoken to homeowner">
            "Most people at this point aren't deciding if they're doing the project — they're deciding whether the money feels right. Let me show you what the numbers actually look like…"
          </T>
        </p>
      </div>

      {mode === "single" ? (
        <>
          <div className="flex gap-2">
            {OPTION_KEYS.map(k => (
              <OptionPill key={k} label={`Option ${k}`} active={selectedKey === k} onClick={() => setSelectedKey(k)} />
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide"><T>The Math</T> — {selLabel}</p>
            <div className="grid grid-cols-2 gap-3">
              <FormulaBlock label="Today's price" formula={`Locked in = ${fmt(sel.price)}`} result={fmt(sel.price)} />
              <FormulaBlock label="Same roof in 10 years" formula={`${fmt(sel.price)} × 1.08¹⁰ = ${fmt(sel.price + sel.inflationPenalty)}`} result={fmt(sel.price + sel.inflationPenalty)} />
            </div>
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-center">
              <p className="text-[10px] font-bold text-destructive uppercase tracking-wider"><T>Cost of waiting</T></p>
              <p className="text-xs font-mono text-foreground/70 mt-0.5">
                {fmt(sel.price + sel.inflationPenalty)} − {fmt(sel.price)} = <span className="font-bold text-destructive">{fmt(sel.inflationPenalty)}</span>
              </p>
              <p className="text-2xl font-black text-destructive mt-1">{fmt(sel.inflationPenalty)}</p>
              <p className="text-[11px] text-muted-foreground mt-1"><T>lost to 8% annual material inflation</T></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-accent/10 border border-accent/30 p-4 text-center space-y-1">
              <p className="text-[10px] font-bold text-accent uppercase tracking-wider">✅ <T>Say Yes Today</T></p>
              <p className="text-2xl font-black text-foreground">{fmt(sel.price)}</p>
              <p className="text-[11px] text-muted-foreground leading-snug"><T>Lock in this price & add</T><br /><span className="font-bold text-accent">{fmt(sel.roi)}</span> <T>in home value</T></p>
            </div>
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-center space-y-1">
              <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">❌ <T>Wait & Pay More</T></p>
              <p className="text-2xl font-black text-foreground">{fmt(sel.price + sel.inflationPenalty)}</p>
              <p className="text-[11px] text-muted-foreground leading-snug"><T>Same roof costs more &</T><br /><T>you lose</T> <span className="font-bold text-destructive">{fmt(sel.inflationPenalty)}</span></p>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            <div></div>
            {OPTION_KEYS.map(k => <div key={k} className="text-center"><T>Option</T> {k}</div>)}
          </div>
          {[
            { label: "Today's price", cls: "text-foreground", getValue: (m: ReturnType<typeof getOptionMetrics>) => fmt(m.price) },
            { label: "In 10 yrs @ 8%/yr", cls: "text-destructive", getValue: (m: ReturnType<typeof getOptionMetrics>) => fmt(m.price + m.inflationPenalty) },
            { label: "Cost of waiting", cls: "text-destructive font-bold", getValue: (m: ReturnType<typeof getOptionMetrics>) => fmt(m.inflationPenalty) },
            { label: "Home value added", cls: "text-accent", getValue: (m: ReturnType<typeof getOptionMetrics>) => `+${fmt(m.roi)}` },
          ].map(row => (
            <div key={row.label} className="grid grid-cols-4 gap-2 items-center py-1.5 border-b border-border/30">
              <p className="text-xs font-semibold text-muted-foreground"><T>{row.label}</T></p>
              {OPTION_KEYS.map(k => {
                const m = getOptionMetrics(k, computed);
                return <p key={k} className={`text-center text-sm font-extrabold ${row.cls}`}>{row.getValue(m)}</p>;
              })}
            </div>
          ))}
          <div className="mt-2 p-3 rounded-xl bg-muted/60 border border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1"><T>Formula</T></p>
            <p className="text-xs font-mono text-foreground/80"><T>Future Cost = Today's Price × 1.08¹⁰</T></p>
            <p className="text-xs font-mono text-foreground/80"><T>Cost of Waiting = Future Cost − Today's Price</T></p>
          </div>
        </div>
      )}
    </div>
  );
});
