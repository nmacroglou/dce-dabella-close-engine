import { memo, useState, useEffect } from "react";
import type { ComputedValues, EngineState } from "@/types/engine";
import { TrendingUp, ToggleLeft, ToggleRight, Info } from "lucide-react";
import { fmt } from "@/lib/format";
import { getOptionMetrics, OPTION_KEYS } from "@/lib/engineHelpers";
import OptionPill from "./OptionPill";
import { useT } from "@/contexts/LanguageContext";

interface Props {
  state: EngineState;
  computed: ComputedValues;
}

function ImpactRow({ label, hint, formula, moveForward, doNothing, moveClass, nothingClass }: {
  label: string; hint: string; formula: string; moveForward: string; doNothing: string; moveClass: string; nothingClass: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3 border-b border-border/40 last:border-b-0 hover:bg-muted/30 transition-colors">
      <div className="space-y-0.5">
        <p className="font-bold text-foreground text-sm">{label}</p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
        <p className="text-[10px] font-mono text-foreground/50">{formula}</p>
      </div>
      <div className={`text-center min-w-[80px] font-bold text-sm ${moveClass}`}>{moveForward}</div>
      <div className={`text-center min-w-[80px] font-bold text-sm ${nothingClass}`}>{doNothing}</div>
    </div>
  );
}

export default memo(function FinancialImpactPanel({ state, computed }: Props) {
  const t = useT();
  const [mode, setMode] = useState<"single" | "compare">("single");
  const [selectedKey, setSelectedKey] = useState<"A" | "B" | "C">(state.selectedOption || "A");

  useEffect(() => {
    if (state.selectedOption) setSelectedKey(state.selectedOption);
  }, [state.selectedOption]);

  const sel = getOptionMetrics(selectedKey, computed);

  return (
    <div className="card-elevated-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" /> {t("10-Year Financial Impact", "Impacto Financiero a 10 Años")}
        </h3>
        <button
          onClick={() => setMode(m => m === "single" ? "compare" : "single")}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          {mode === "single" ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
          {mode === "single" ? t("Compare all", "Comparar todas") : t("Single view", "Vista única")}
        </button>
      </div>

      {/* Coach script */}
      <div className="rounded-xl bg-accent/5 border border-accent/20 p-3">
        <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1 flex items-center gap-1">
          <Info className="h-3 w-3" /> {t("What to say", "Qué decir")}
        </p>
        <p className="text-sm text-foreground/90 italic leading-relaxed">
          {t(
            `"Let's look at the total picture — what you gain by moving forward vs. what it costs to wait."`,
            `"Veamos el panorama completo — lo que gana al avanzar vs. lo que cuesta esperar."`,
          )}
        </p>
      </div>

      {mode === "single" ? (
        <>
          <div className="flex gap-2">
            {OPTION_KEYS.map(k => (
              <OptionPill key={k} label={`Option ${k}`} active={selectedKey === k} onClick={() => setSelectedKey(k)} />
            ))}
          </div>

          <div className="space-y-0 rounded-xl border border-border overflow-hidden">
            <ImpactRow
              label={t("Home value increase", "Aumento del valor de la casa")}
              hint={`${fmt(sel.price)} × ${state.roiPercent}% ROI`}
              formula={`${fmt(sel.price)} × 0.${state.roiPercent} = ${fmt(sel.roi)}`}
              moveForward={`+${fmt(sel.roi)}`}
              doNothing="$0"
              moveClass="text-accent"
              nothingClass="text-muted-foreground"
            />
            <ImpactRow
              label={t("Energy savings", "Ahorro de energía")}
              hint={`${fmt(state.monthlyBill)}/mo × ${state.energySavingsPct}% × 10 ${t("yrs", "años")}`}
              formula={`${fmt(state.monthlyBill)} × 12 × 10 × ${state.energySavingsPct}% = ${fmt(computed.energySavings)}`}
              moveForward={`+${fmt(computed.energySavings)}`}
              doNothing={`-${fmt(computed.energySavings)}`}
              moveClass="text-accent"
              nothingClass="text-destructive"
            />
            <ImpactRow
              label={t("Price lock savings", "Ahorro por precio fijo")}
              hint={t("Avoid 8% annual material inflation", "Evite el 8% de inflación anual de materiales")}
              formula={`${fmt(sel.price)} × (1.08¹⁰ − 1) = ${fmt(sel.lockedInSavings)}`}
              moveForward={`+${fmt(sel.lockedInSavings)}`}
              doNothing={`-${fmt(sel.inflationPenalty)}`}
              moveClass="text-accent"
              nothingClass="text-destructive"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-accent/10 border border-accent/30 p-4 text-center">
              <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">✅ Move Forward</p>
              <p className="text-xs font-mono text-foreground/70 mb-1">
                {fmt(sel.roi)} + {fmt(computed.energySavings)} + {fmt(sel.lockedInSavings)}
              </p>
              <p className="text-2xl font-black text-accent">+{fmt(sel.moveForward)}</p>
            </div>
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-center">
              <p className="text-[10px] font-bold text-destructive uppercase tracking-wider mb-1">❌ Do Nothing</p>
              <p className="text-xs font-mono text-foreground/70 mb-1">
                −{fmt(computed.energySavings)} − {fmt(sel.inflationPenalty)}
              </p>
              <p className="text-2xl font-black text-destructive">{fmt(sel.doNothing)}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-foreground text-background text-center space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Net advantage of moving forward</p>
            <p className="text-xs font-mono opacity-70">
              {fmt(sel.moveForward)} − ({fmt(sel.doNothing)}) = {fmt(sel.netDiff)}
            </p>
            <p className="text-3xl font-black">{fmt(sel.netDiff)}</p>
            <p className="text-xs opacity-60">You're this much better off saying yes today</p>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Benefit</th>
                  {OPTION_KEYS.map(k => (
                    <th key={k} className="text-center py-2.5 px-2 text-xs font-bold text-foreground">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary">Opt {k}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Home value ↑", getValue: (m: ReturnType<typeof getOptionMetrics>) => `+${fmt(m.roi)}` },
                  { label: "Energy savings", getValue: () => `+${fmt(computed.energySavings)}` },
                  { label: "Price lock", getValue: (m: ReturnType<typeof getOptionMetrics>) => `+${fmt(m.lockedInSavings)}` },
                ].map(row => (
                  <tr key={row.label} className="border-b border-border/30">
                    <td className="py-2.5 px-3 text-xs font-semibold text-foreground">{row.label}</td>
                    {OPTION_KEYS.map(k => {
                      const m = getOptionMetrics(k, computed);
                      return <td key={k} className="py-2.5 px-2 text-center text-sm font-bold text-accent">{row.getValue(m)}</td>;
                    })}
                  </tr>
                ))}
                <tr className="bg-muted/30 border-t border-border">
                  <td className="py-2.5 px-3 text-xs font-black text-foreground uppercase">Total benefit</td>
                  {OPTION_KEYS.map(k => {
                    const m = getOptionMetrics(k, computed);
                    return <td key={k} className="py-2.5 px-2 text-center text-base font-black text-accent">+{fmt(m.moveForward)}</td>;
                  })}
                </tr>
                <tr>
                  <td className="py-3 px-3 text-xs font-black text-foreground uppercase">Net advantage</td>
                  {OPTION_KEYS.map(k => {
                    const m = getOptionMetrics(k, computed);
                    return (
                      <td key={k} className="py-3 px-2 text-center">
                        <span className="inline-block px-3 py-1.5 rounded-lg bg-foreground text-background text-sm font-black">
                          {fmt(m.netDiff)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">How we calculate</p>
            <p className="text-xs font-mono text-foreground/80">ROI = Price × {state.roiPercent}%</p>
            <p className="text-xs font-mono text-foreground/80">Energy = {fmt(state.monthlyBill)}/mo × {state.energySavingsPct}% × 120 months</p>
            <p className="text-xs font-mono text-foreground/80">Price Lock = Price × (1.08¹⁰ − 1)</p>
            <p className="text-xs font-mono text-foreground/80 font-bold">Net Advantage = Total Benefit − Do-Nothing Cost</p>
          </div>
        </>
      )}
    </div>
  );
});
