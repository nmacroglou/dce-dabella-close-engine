import { memo, useState } from "react";
import type { ComputedValues, EngineState } from "@/types/engine";
import { Scale, TrendingUp, ToggleLeft, ToggleRight } from "lucide-react";
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
      {mode === "single" ? "Compare all options" : "Single view"}
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

export default memo(function FinancialImpact({ state, computed }: FinancialImpactProps) {
  const [tCloseMode, setTCloseMode] = useState<CompareMode>("single");
  const [impactMode, setImpactMode] = useState<CompareMode>("single");
  const [selectedKey, setSelectedKey] = useState<"A" | "B" | "C">(state.selectedOption || "A");

  const sel = getOptionMetrics(selectedKey, computed);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* T-Close Board */}
      <div className="card-elevated-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" /> T-Close Board
          </h3>
          <CompareToggle mode={tCloseMode} onToggle={() => setTCloseMode(m => m === "single" ? "compare" : "single")} />
        </div>

        {tCloseMode === "single" ? (
          <>
            <div className="flex gap-2 mb-4">
              {OPTION_KEYS.map(k => (
                <OptionPill key={k} label={`Option ${k}`} active={selectedKey === k} onClick={() => setSelectedKey(k)} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-accent/10 p-4 text-center">
                <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">✅ Say Yes Today</p>
                <p className="text-xl font-extrabold text-foreground">{fmt(sel.price)}</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">Lock in today's price.<br/>Adds {fmt(sel.roi)} in home value.</p>
              </div>
              <div className="rounded-xl bg-destructive/10 p-4 text-center">
                <p className="text-[10px] font-bold text-destructive uppercase tracking-wider mb-1">❌ Wait & Pay More</p>
                <p className="text-xl font-extrabold text-foreground">{fmt(sel.price + sel.inflationPenalty)}</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">Same roof in 10 yrs at 8%/yr.<br/>You lose {fmt(sel.inflationPenalty)} to inflation.</p>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <div></div>
              {OPTION_KEYS.map(k => <div key={k} className="text-center">Option {k}</div>)}
            </div>
            <div className="grid grid-cols-4 gap-2 items-center">
              <p className="text-xs font-semibold text-accent">✅ Today</p>
              {OPTION_KEYS.map(k => {
                const m = getOptionMetrics(k, computed);
                return <p key={k} className="text-center text-sm font-extrabold text-foreground">{fmt(m.price)}</p>;
              })}
            </div>
            <div className="grid grid-cols-4 gap-2 items-center">
              <p className="text-xs font-semibold text-destructive">❌ In 10 yrs</p>
              {OPTION_KEYS.map(k => {
                const m = getOptionMetrics(k, computed);
                return <p key={k} className="text-center text-sm font-extrabold text-destructive">{fmt(m.price + m.inflationPenalty)}</p>;
              })}
            </div>
            <div className="grid grid-cols-4 gap-2 items-center border-t border-border pt-2">
              <p className="text-xs font-semibold text-foreground">You save</p>
              {OPTION_KEYS.map(k => {
                const m = getOptionMetrics(k, computed);
                return <p key={k} className="text-center text-sm font-bold text-accent">{fmt(m.inflationPenalty)}</p>;
              })}
            </div>
          </div>
        )}
      </div>

      {/* 10-Year Financial Impact */}
      <div className="card-elevated-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" /> 10-Year Financial Impact
          </h3>
          <CompareToggle mode={impactMode} onToggle={() => setImpactMode(m => m === "single" ? "compare" : "single")} />
        </div>

        {impactMode === "single" ? (
          <>
            <div className="flex gap-2 mb-4">
              {OPTION_KEYS.map(k => (
                <OptionPill key={k} label={`Option ${k}`} active={selectedKey === k} onClick={() => setSelectedKey(k)} />
              ))}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground text-xs">What happens over 10 years</th>
                  <th className="text-center py-2 font-semibold text-accent text-xs">✅ Move Forward</th>
                  <th className="text-center py-2 font-semibold text-destructive text-xs">❌ Do Nothing</th>
                </tr>
              </thead>
              <tbody>
                <ImpactRow
                  label="Home value increase"
                  hint="Your roof adds equity"
                  moveForward={`+${fmt(sel.roi)}`}
                  doNothing="$0"
                  moveClass="text-accent"
                  nothingClass="text-muted-foreground"
                />
                <ImpactRow
                  label="Energy savings"
                  hint={`${state.energySavingsPct}% of ${fmt(state.monthlyBill)}/mo bills`}
                  moveForward={`+${fmt(computed.energySavings)}`}
                  doNothing={`-${fmt(computed.energySavings)}`}
                  moveClass="text-accent"
                  nothingClass="text-destructive"
                />
                <ImpactRow
                  label="Price lock savings"
                  hint="Roofing costs rise ~8%/yr"
                  moveForward={`+${fmt(sel.lockedInSavings)}`}
                  doNothing={`-${fmt(sel.inflationPenalty)}`}
                  moveClass="text-accent"
                  nothingClass="text-destructive"
                />
                <tr>
                  <td className="py-2 font-bold text-foreground">Total benefit</td>
                  <td className="py-2 text-center font-bold text-accent">+{fmt(sel.moveForward)}</td>
                  <td className="py-2 text-center font-bold text-destructive">{fmt(sel.doNothing)}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-3 p-3 rounded-xl bg-foreground text-background text-center">
              <p className="text-[11px] font-medium opacity-70">You're {fmt(sel.netDiff)} better off moving forward</p>
              <p className="text-2xl font-extrabold">{fmt(sel.netDiff)}</p>
            </div>
          </>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs font-medium text-muted-foreground">Benefit</th>
                  {OPTION_KEYS.map(k => (
                    <th key={k} className="text-center py-2 text-xs font-bold text-foreground">Opt {k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 text-xs font-medium text-foreground">Home value ↑</td>
                  {OPTION_KEYS.map(k => {
                    const m = getOptionMetrics(k, computed);
                    return <td key={k} className="py-2 text-center text-sm font-semibold text-accent">+{fmt(m.roi)}</td>;
                  })}
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 text-xs font-medium text-foreground">Energy savings</td>
                  {OPTION_KEYS.map(() => (
                    <td key={Math.random()} className="py-2 text-center text-sm font-semibold text-accent">+{fmt(computed.energySavings)}</td>
                  ))}
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 text-xs font-medium text-foreground">Price lock</td>
                  {OPTION_KEYS.map(k => {
                    const m = getOptionMetrics(k, computed);
                    return <td key={k} className="py-2 text-center text-sm font-semibold text-accent">+{fmt(m.lockedInSavings)}</td>;
                  })}
                </tr>
                <tr className="border-t border-border">
                  <td className="py-2 text-xs font-bold text-foreground">Total if you move forward</td>
                  {OPTION_KEYS.map(k => {
                    const m = getOptionMetrics(k, computed);
                    return <td key={k} className="py-2 text-center text-sm font-extrabold text-accent">+{fmt(m.moveForward)}</td>;
                  })}
                </tr>
                <tr>
                  <td className="py-2 text-xs font-bold text-foreground">Net advantage</td>
                  {OPTION_KEYS.map(k => {
                    const m = getOptionMetrics(k, computed);
                    return (
                      <td key={k} className="py-2 text-center">
                        <span className="inline-block px-2 py-1 rounded-lg bg-foreground text-background text-xs font-extrabold">
                          {fmt(m.netDiff)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
});

function ImpactRow({ label, hint, moveForward, doNothing, moveClass, nothingClass }: {
  label: string; hint: string; moveForward: string; doNothing: string; moveClass: string; nothingClass: string;
}) {
  return (
    <tr className="border-b border-border/50">
      <td className="py-2">
        <p className="font-medium text-foreground text-sm">{label}</p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </td>
      <td className={`py-2 text-center font-semibold ${moveClass}`}>{moveForward}</td>
      <td className={`py-2 text-center font-semibold ${nothingClass}`}>{doNothing}</td>
    </tr>
  );
}