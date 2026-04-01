import { memo, useState } from "react";
import type { ComputedValues, EngineState } from "@/types/engine";
import { Scale, TrendingUp, ToggleLeft, ToggleRight, Info } from "lucide-react";
import { fmt } from "@/lib/format";

interface FinancialImpactProps {
  state: EngineState;
  computed: ComputedValues;
}

type CompareMode = "single" | "compare";

function getOptionLabel(key: "A" | "B" | "C", state: EngineState) {
  if (key === "A") return state.optionAName;
  if (key === "B") return state.optionBName;
  return state.optionCName;
}

function getOptionMetrics(key: "A" | "B" | "C", computed: ComputedValues) {
  const opt = computed.options[key];
  const inflationMultiplier = Math.pow(1.08, 10);
  const inflationPenalty = Math.round(opt.price * (inflationMultiplier - 1));
  const lockedInSavings = inflationPenalty;
  const moveForward = opt.roiValue + computed.energySavings + lockedInSavings;
  const doNothing = -(computed.energySavings + inflationPenalty);
  const netDiff = moveForward - doNothing;
  return { price: opt.price, roi: opt.roiValue, inflationPenalty, lockedInSavings, moveForward, doNothing, netDiff };
}

const OPTION_KEYS: ("A" | "B" | "C")[] = ["A", "B", "C"];

function CompareToggle({ mode, onToggle }: { mode: CompareMode; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
    >
      {mode === "single" ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
      {mode === "single" ? "Compare all" : "Single view"}
    </button>
  );
}

function OptionPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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
}

function FormulaBlock({ formula, result, label }: { formula: string; result: string; label: string }) {
  return (
    <div className="rounded-xl bg-muted/60 border border-border p-3 space-y-1">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xs font-mono text-foreground/80">{formula}</p>
      <p className="text-lg font-extrabold text-foreground">{result}</p>
    </div>
  );
}

export default memo(function FinancialImpact({ state, computed }: FinancialImpactProps) {
  const [tCloseMode, setTCloseMode] = useState<CompareMode>("single");
  const [impactMode, setImpactMode] = useState<CompareMode>("single");
  const [selectedKey, setSelectedKey] = useState<"A" | "B" | "C">(state.selectedOption || "A");

  const sel = getOptionMetrics(selectedKey, computed);
  const selLabel = getOptionLabel(selectedKey, state);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* ─── T-CLOSE BOARD ─── */}
      <div className="card-elevated-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" /> T-Close Board
          </h3>
          <CompareToggle mode={tCloseMode} onToggle={() => setTCloseMode(m => m === "single" ? "compare" : "single")} />
        </div>

        {/* Coach script */}
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1">
            <Info className="h-3 w-3" /> What to say
          </p>
          <p className="text-sm text-foreground/90 italic leading-relaxed">
            "Most people at this point aren't deciding <span className="font-bold not-italic">if</span> they're doing the project — they're deciding whether the <span className="font-bold not-italic">money feels right</span>. Let me show you what the numbers actually look like…"
          </p>
        </div>

        {tCloseMode === "single" ? (
          <>
            <div className="flex gap-2">
              {OPTION_KEYS.map(k => (
                <OptionPill key={k} label={`Option ${k}`} active={selectedKey === k} onClick={() => setSelectedKey(k)} />
              ))}
            </div>

            {/* Formula explanation */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">The Math — {selLabel}</p>
              <div className="grid grid-cols-2 gap-3">
                <FormulaBlock
                  label="Today's price"
                  formula={`Locked in = ${fmt(sel.price)}`}
                  result={fmt(sel.price)}
                />
                <FormulaBlock
                  label="Same roof in 10 years"
                  formula={`${fmt(sel.price)} × 1.08¹⁰ = ${fmt(sel.price + sel.inflationPenalty)}`}
                  result={fmt(sel.price + sel.inflationPenalty)}
                />
              </div>
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-center">
                <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">Cost of waiting</p>
                <p className="text-xs font-mono text-foreground/70 mt-0.5">
                  {fmt(sel.price + sel.inflationPenalty)} − {fmt(sel.price)} = <span className="font-bold text-destructive">{fmt(sel.inflationPenalty)}</span>
                </p>
                <p className="text-2xl font-black text-destructive mt-1">{fmt(sel.inflationPenalty)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">lost to 8% annual material inflation</p>
              </div>
            </div>

            {/* Side-by-side verdict */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-accent/10 border border-accent/30 p-4 text-center space-y-1">
                <p className="text-[10px] font-bold text-accent uppercase tracking-wider">✅ Say Yes Today</p>
                <p className="text-2xl font-black text-foreground">{fmt(sel.price)}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">Lock in this price & add<br/><span className="font-bold text-accent">{fmt(sel.roi)}</span> in home value</p>
              </div>
              <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-center space-y-1">
                <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">❌ Wait & Pay More</p>
                <p className="text-2xl font-black text-foreground">{fmt(sel.price + sel.inflationPenalty)}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">Same roof costs more &<br/>you lose <span className="font-bold text-destructive">{fmt(sel.inflationPenalty)}</span></p>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              <div></div>
              {OPTION_KEYS.map(k => <div key={k} className="text-center">Option {k}</div>)}
            </div>
            {[
              { label: "Today's price", cls: "text-foreground", getValue: (m: ReturnType<typeof getOptionMetrics>) => fmt(m.price) },
              { label: "In 10 yrs @ 8%/yr", cls: "text-destructive", getValue: (m: ReturnType<typeof getOptionMetrics>) => fmt(m.price + m.inflationPenalty) },
              { label: "Cost of waiting", cls: "text-destructive font-bold", getValue: (m: ReturnType<typeof getOptionMetrics>) => fmt(m.inflationPenalty) },
              { label: "Home value added", cls: "text-accent", getValue: (m: ReturnType<typeof getOptionMetrics>) => `+${fmt(m.roi)}` },
            ].map(row => (
              <div key={row.label} className="grid grid-cols-4 gap-2 items-center py-1.5 border-b border-border/30">
                <p className="text-xs font-semibold text-muted-foreground">{row.label}</p>
                {OPTION_KEYS.map(k => {
                  const m = getOptionMetrics(k, computed);
                  return <p key={k} className={`text-center text-sm font-extrabold ${row.cls}`}>{row.getValue(m)}</p>;
                })}
              </div>
            ))}
            {/* Formula row */}
            <div className="mt-2 p-3 rounded-xl bg-muted/60 border border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Formula</p>
              <p className="text-xs font-mono text-foreground/80">Future Cost = Today's Price × 1.08¹⁰</p>
              <p className="text-xs font-mono text-foreground/80">Cost of Waiting = Future Cost − Today's Price</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── 10-YEAR FINANCIAL IMPACT ─── */}
      <div className="card-elevated-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" /> 10-Year Financial Impact
          </h3>
          <CompareToggle mode={impactMode} onToggle={() => setImpactMode(m => m === "single" ? "compare" : "single")} />
        </div>

        {/* Coach script */}
        <div className="rounded-xl bg-accent/5 border border-accent/20 p-3">
          <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1 flex items-center gap-1">
            <Info className="h-3 w-3" /> What to say
          </p>
          <p className="text-sm text-foreground/90 italic leading-relaxed">
            "Let's look at the <span className="font-bold not-italic">total picture</span> — what you gain by moving forward vs. what it costs to wait."
          </p>
        </div>

        {impactMode === "single" ? (
          <>
            <div className="flex gap-2">
              {OPTION_KEYS.map(k => (
                <OptionPill key={k} label={`Option ${k}`} active={selectedKey === k} onClick={() => setSelectedKey(k)} />
              ))}
            </div>

            {/* Breakdown with formulas */}
            <div className="space-y-0 rounded-xl border border-border overflow-hidden">
              <ImpactRowLarge
                label="Home value increase"
                hint={`${fmt(sel.price)} × ${state.roiPercent}% ROI`}
                formula={`${fmt(sel.price)} × 0.${state.roiPercent} = ${fmt(sel.roi)}`}
                moveForward={`+${fmt(sel.roi)}`}
                doNothing="$0"
                moveClass="text-accent"
                nothingClass="text-muted-foreground"
              />
              <ImpactRowLarge
                label="Energy savings"
                hint={`${fmt(state.monthlyBill)}/mo × ${state.energySavingsPct}% × 10 yrs`}
                formula={`${fmt(state.monthlyBill)} × 12 × 10 × ${state.energySavingsPct}% = ${fmt(computed.energySavings)}`}
                moveForward={`+${fmt(computed.energySavings)}`}
                doNothing={`-${fmt(computed.energySavings)}`}
                moveClass="text-accent"
                nothingClass="text-destructive"
              />
              <ImpactRowLarge
                label="Price lock savings"
                hint="Avoid 8% annual material inflation"
                formula={`${fmt(sel.price)} × (1.08¹⁰ − 1) = ${fmt(sel.lockedInSavings)}`}
                moveForward={`+${fmt(sel.lockedInSavings)}`}
                doNothing={`-${fmt(sel.inflationPenalty)}`}
                moveClass="text-accent"
                nothingClass="text-destructive"
              />
            </div>

            {/* Totals */}
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

            {/* Net difference */}
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

            {/* Shared formula reference */}
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
    </div>
  );
});

function ImpactRowLarge({ label, hint, formula, moveForward, doNothing, moveClass, nothingClass }: {
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
