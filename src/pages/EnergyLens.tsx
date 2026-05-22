import { useMemo, useState } from "react";
import * as Recharts from "recharts";
import {
  Zap, Sun, Battery, TrendingUp, Info, Printer, Cpu, MapPin,
  ChevronDown, ChevronUp, Sparkles, Shield, Target, Gauge,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import UtilityNewsFeed from "@/components/energy/UtilityNewsFeed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatCurrency, formatCount, formatCurrencyShort, pct } from "@/lib/format";
import {
  UTILITIES, RATE_PLANS, EXPORT_RULES, INFLATION_SCENARIOS,
  REGULATORY_LOG, SELF_CONSUMPTION_PRESETS, TIME_HORIZONS,
} from "@/data/energyLens";
import { computeLens } from "@/lib/energyLensCalc";

const REP_SCRIPT = [
  "SRP isn't a fixed price — it's a moving target.",
  "Inflation doesn't stop. The question is how much of it touches you.",
  "The Energy Roof doesn't stop inflation — it reduces exposure.",
  "Because you're open to a battery, most of what you produce gets used in the home — the expensive power.",
  "Would you rather start small (2kW), go balanced (3kW), or be more aggressive (4kW)?",
];

const OPTION_CONFIG = [
  { key: "C" as const, kw: 2, title: "Starter Hedge", tag: "Best for: testing the waters", accent: "text-warning" },
  { key: "B" as const, kw: 3, title: "Balanced Hedge", tag: "Best for: most homes", accent: "text-accent" },
  { key: "A" as const, kw: 4, title: "Stronger Shield", tag: "Best for: heavy usage / future EV", accent: "text-primary" },
];

function StatTile({ icon: Icon, label, value, sub, accent = "text-primary", large = false }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string; accent?: string; large?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-hairline bg-card shadow-[var(--shadow-xs)] ${large ? "p-5" : "p-4"}`}>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
        {label}
      </div>
      <div className={`${large ? "text-3xl sm:text-4xl" : "text-2xl"} font-extrabold mt-1 ${accent}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function SectionCard({ title, subtitle, icon: Icon, children }: {
  title: string; subtitle?: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-hairline bg-card p-5 shadow-[var(--shadow-xs)]">
      <div className="flex items-start gap-3 mb-4">
        {Icon && (
          <div className="h-9 w-9 rounded-xl gradient-brand grid place-items-center text-primary-foreground flex-shrink-0">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <h3 className="text-base font-display font-extrabold tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function EnergyLens() {
  // --- Inputs (pre-filled per spec) ---
  const [utilityId, setUtilityId] = useState("srp");
  const utility = UTILITIES.find((u) => u.id === utilityId)!;
  const [monthlyBill, setMonthlyBill] = useState(300);
  const [rate, setRate] = useState(0.15);
  const [customRate, setCustomRate] = useState("");
  const [horizon, setHorizon] = useState<number>(25);
  const [inflationPct, setInflationPct] = useState(0.07);
  const [systemKw, setSystemKw] = useState<number>(3);
  const [hasBattery, setHasBattery] = useState(true);
  const [selfConsumption, setSelfConsumption] = useState(0.85);
  const [exportRate, setExportRate] = useState(0.05);
  const [degradationOn, setDegradationOn] = useState(true);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [driverOpen, setDriverOpen] = useState(false);

  const effectiveRate = customRate ? Number(customRate) || rate : rate;

  const result = useMemo(() => computeLens({
    monthlyBill,
    rate: effectiveRate,
    systemKw,
    productionFactor: utility.productionFactor,
    selfConsumptionPct: selfConsumption,
    exportRate,
    inflationPct,
    horizonYears: horizon,
    degradationPct: degradationOn ? 0.005 : 0,
    hasBattery,
  }), [monthlyBill, effectiveRate, systemKw, utility.productionFactor, selfConsumption, exportRate, inflationPct, horizon, degradationOn, hasBattery]);

  const options = OPTION_CONFIG.map((cfg) => {
    const r = computeLens({
      monthlyBill,
      rate: effectiveRate,
      systemKw: cfg.kw,
      productionFactor: utility.productionFactor,
      selfConsumptionPct: selfConsumption,
      exportRate,
      inflationPct,
      horizonYears: Math.max(horizon, 25),
      degradationPct: degradationOn ? 0.005 : 0,
      hasBattery,
    });
    const y10 = r.series[9]?.energyValueCumulative ?? r.cumulativeEnergyValue;
    const y25 = r.series[24]?.energyValueCumulative ?? r.cumulativeEnergyValue;
    return { ...cfg, y1: r.valueYear1, y10, y25 };
  });

  const handlePrint = () => window.print();

  const inflationMarks = [0.04, 0.07, 0.10, 0.15];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
              Energy Roof <span className="gradient-text">Inflation Lens</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              A homeowner-friendly view of utility inflation and how a GAF Energy Roof gives you a lever to reduce exposure.
            </p>
          </div>
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" /> Print / Export Summary
          </Button>
        </div>

        {/* Guided steps strip */}
        <div className="rounded-2xl border border-hairline bg-muted/40 p-3 flex items-center gap-4 text-xs font-semibold text-muted-foreground overflow-x-auto">
          <span className="flex items-center gap-1.5"><span className="h-5 w-5 rounded-full bg-primary text-primary-foreground grid place-items-center text-[10px]">1</span> Utility</span>
          <span className="text-hairline-strong">→</span>
          <span className="flex items-center gap-1.5"><span className="h-5 w-5 rounded-full bg-primary text-primary-foreground grid place-items-center text-[10px]">2</span> Inflation</span>
          <span className="text-hairline-strong">→</span>
          <span className="flex items-center gap-1.5"><span className="h-5 w-5 rounded-full bg-primary text-primary-foreground grid place-items-center text-[10px]">3</span> System Size</span>
          <span className="text-hairline-strong">→</span>
          <span className="flex items-center gap-1.5"><span className="h-5 w-5 rounded-full bg-accent text-accent-foreground grid place-items-center text-[10px]">4</span> Choose Option</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1) Your Utility Reality */}
          <SectionCard title="Your Utility Reality" subtitle="Step 1 — where you are today" icon={Zap}>
            <div className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wider font-semibold">Utility provider</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {UTILITIES.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { setUtilityId(u.id); setExportRate(u.exportCredit); }}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all pressable ${
                        utilityId === u.id ? "gradient-brand text-primary-foreground border-transparent" : "bg-muted/50 text-muted-foreground border-hairline hover:bg-muted"
                      }`}
                    >{u.name}</button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">{utility.region}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider font-semibold">Monthly bill</Label>
                  <Input type="number" value={monthlyBill} onChange={(e) => setMonthlyBill(Number(e.target.value) || 0)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider font-semibold">Effective rate ($/kWh)</Label>
                  <div className="flex gap-1.5 mt-1">
                    <button onClick={() => { setRate(utility.defaultRateLow); setCustomRate(""); }}
                      className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold border ${rate === utility.defaultRateLow && !customRate ? "gradient-brand text-primary-foreground border-transparent" : "bg-muted/50 border-hairline"}`}>
                      ${utility.defaultRateLow.toFixed(2)}
                    </button>
                    <button onClick={() => { setRate(utility.defaultRateHigh); setCustomRate(""); }}
                      className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold border ${rate === utility.defaultRateHigh && !customRate ? "gradient-brand text-primary-foreground border-transparent" : "bg-muted/50 border-hairline"}`}>
                      ${utility.defaultRateHigh.toFixed(2)}
                    </button>
                    <Input type="number" step="0.01" placeholder="Custom" value={customRate}
                      onChange={(e) => setCustomRate(e.target.value)} className="w-20 text-xs" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <StatTile icon={Gauge} label="Est. kWh / month" value={formatCount(result.annualKwhUsage / 12)} accent="text-foreground" />
                <StatTile icon={Gauge} label="Est. kWh / year" value={formatCount(result.annualKwhUsage)} accent="text-foreground" />
              </div>
            </div>
          </SectionCard>

          {/* 2) Inflation Timeline */}
          <SectionCard title="Inflation Timeline" subtitle="Step 2 — what happens if nothing changes" icon={TrendingUp}>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-baseline">
                  <Label className="text-xs uppercase tracking-wider font-semibold">Time horizon</Label>
                  <span className="text-lg font-extrabold text-primary">{horizon}y</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {TIME_HORIZONS.map((y) => (
                    <button key={y} onClick={() => setHorizon(y)}
                      className={`flex-1 min-w-[52px] px-2 py-2 rounded-lg text-xs font-bold border ${horizon === y ? "gradient-brand text-primary-foreground border-transparent" : "bg-muted/50 border-hairline"}`}>
                      {y}y
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                    <span>Custom range (1–50y)</span><span className="font-bold text-foreground">{horizon} years</span>
                  </div>
                  <Slider min={1} max={50} step={1} value={[horizon]} onValueChange={(v) => setHorizon(v[0])} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-baseline">
                  <Label className="text-xs uppercase tracking-wider font-semibold">Utility inflation scenario</Label>
                  <span className="text-lg font-extrabold text-primary">{pct(inflationPct)}</span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {INFLATION_SCENARIOS.map((s) => (
                    <button key={s.id} onClick={() => setInflationPct(s.rate)}
                      className={`flex-1 px-2 py-2 rounded-lg text-[11px] font-semibold border ${inflationPct === s.rate ? "gradient-brand text-primary-foreground border-transparent" : "bg-muted/50 border-hairline"}`}>
                      {pct(s.rate)}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  {INFLATION_SCENARIOS.find((s) => s.rate === inflationPct)?.description ?? "Custom scenario."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatTile icon={TrendingUp} label={`Spend if you do nothing (${horizon}y)`} value={formatCurrencyShort(result.cumulativeDoNothing)} accent="text-destructive" />
                <StatTile icon={Shield} label="Inflation exposure reduced" value={pct(result.inflationExposureReducedPct)} sub="with current system + battery choice" accent="text-accent" />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* 3) Energy Roof Impact Simulator */}
        <SectionCard title="Energy Roof Impact Simulator" subtitle="Step 3 — size your lever" icon={Sun}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="space-y-4 lg:col-span-1">
              <div>
                <Label className="text-xs uppercase tracking-wider font-semibold">System size</Label>
                {(() => {
                  const maxFitKw = utility.productionFactor > 0
                    ? Math.round((result.annualKwhUsage / utility.productionFactor) * 2) / 2
                    : 0;
                  const isMaxFit = maxFitKw > 0 && Math.abs(systemKw - maxFitKw) < 0.05;
                  return (
                    <>
                      <div className="flex gap-1.5 mt-2">
                        {[2, 3, 4].map((kw) => (
                          <button key={kw} onClick={() => setSystemKw(kw)}
                            className={`flex-1 px-2 py-3 rounded-xl text-sm font-bold border ${systemKw === kw ? "gradient-brand text-primary-foreground border-transparent shadow-[var(--shadow-glow)]" : "bg-muted/50 border-hairline"}`}>
                            {kw}kW
                          </button>
                        ))}
                        <button
                          onClick={() => maxFitKw > 0 && setSystemKw(maxFitKw)}
                          disabled={maxFitKw <= 0}
                          title="Sizes the system to roughly match your annual usage"
                          className={`flex-1 px-2 py-3 rounded-xl text-sm font-bold border ${isMaxFit ? "gradient-brand text-primary-foreground border-transparent shadow-[var(--shadow-glow)]" : "bg-muted/50 border-hairline"} disabled:opacity-40`}>
                          Max Fit
                          {maxFitKw > 0 && <div className="text-[10px] font-semibold opacity-80">{maxFitKw}kW</div>}
                        </button>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                          <span>Variable size (1–20 kW)</span><span className="font-bold text-foreground">{systemKw.toFixed(1)} kW</span>
                        </div>
                        <Slider min={1} max={20} step={0.5} value={[systemKw]} onValueChange={(v) => setSystemKw(v[0])} />
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Label className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground whitespace-nowrap">Exact kW</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min={0.5}
                          max={30}
                          value={systemKw}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (!Number.isNaN(v) && v > 0) setSystemKw(v);
                          }}
                          className="h-8 text-sm"
                        />
                      </div>
                    </>
                  );
                })()}
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider font-semibold">Battery</Label>
                <div className="flex gap-1.5 mt-2">
                  <button onClick={() => { setHasBattery(true); setSelfConsumption(0.85); }}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border ${hasBattery ? "gradient-brand text-primary-foreground border-transparent" : "bg-muted/50 border-hairline"}`}>
                    <Battery className="h-3.5 w-3.5 inline mr-1" /> Yes
                  </button>
                  <button onClick={() => { setHasBattery(false); setSelfConsumption(0.35); }}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border ${!hasBattery ? "gradient-brand text-primary-foreground border-transparent" : "bg-muted/50 border-hairline"}`}>
                    No
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider font-semibold">Self-consumption</Label>
                <div className="flex gap-1.5 mt-2">
                  {SELF_CONSUMPTION_PRESETS.map((p) => (
                    <button key={p.id} onClick={() => setSelfConsumption(p.pct)}
                      className={`flex-1 px-2 py-2 rounded-lg text-[11px] font-semibold border ${Math.abs(selfConsumption - p.pct) < 0.01 ? "gradient-brand text-primary-foreground border-transparent" : "bg-muted/50 border-hairline"}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                    <span>Used in home</span><span className="font-bold text-foreground">{pct(selfConsumption)}</span>
                  </div>
                  <Slider min={0.1} max={1} step={0.05} value={[selfConsumption]} onValueChange={(v) => setSelfConsumption(v[0])} />
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider font-semibold">Export credit ($/kWh)</Label>
                <Input type="number" step="0.01" value={exportRate} onChange={(e) => setExportRate(Number(e.target.value) || 0)} className="mt-1" />
              </div>
            </div>

            <div className="lg:col-span-2 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile large icon={Sun} label="Year 1 production" value={`${formatCount(result.prodYear1)} kWh`} accent="text-warning" />
                <StatTile large icon={Zap} label="Year 1 value" value={formatCurrency(result.valueYear1)} sub={`${formatCurrency(result.valueYear1Monthly)} / mo`} accent="text-accent" />
                <StatTile large icon={Target} label="% of bill offset" value={pct(result.offsetPct)} sub="year 1" accent="text-primary" />
                <StatTile large icon={Shield} label={`Lifetime value (${horizon}y)`} value={formatCurrencyShort(result.cumulativeEnergyValue)} accent="text-primary" />
              </div>

              {/* Year-by-year savings breakdown */}
              {(() => {
                const milestones = [1, 5, 10, 15, 20, 25, 30, 35, 40].filter((y) => y <= horizon);
                if (!milestones.includes(horizon)) milestones.push(horizon);
                const rows = milestones
                  .map((y) => result.series[y - 1])
                  .filter(Boolean);
                return (
                  <div className="rounded-2xl border border-hairline bg-gradient-to-br from-accent/5 to-primary/5 p-5">
                    <div className="flex items-baseline justify-between mb-3">
                      <h4 className="text-sm font-display font-extrabold tracking-tight">Yearly power savings</h4>
                      <span className="text-[11px] text-muted-foreground">each row shows the math</span>
                    </div>

                    <div className="rounded-xl bg-background/60 border border-hairline px-4 py-3 mb-3 text-[11px] leading-relaxed">
                      <div className="font-bold text-foreground uppercase tracking-wider text-[10px] mb-1.5">How each row adds up</div>
                      <div className="font-mono text-foreground/80 space-y-0.5">
                        <div><span className="text-accent font-bold">Solar value</span> = energy your roof produced × that year's rate</div>
                        <div><span className="text-muted-foreground font-bold">Bill after solar</span> = max( $0 , Bill − Solar value )</div>
                        <div><span className="text-primary font-bold">Saved that yr</span> = Bill − Bill after solar</div>
                        <div className="text-muted-foreground">Cumulative = running total of "Saved that yr"</div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-hairline">
                            <th className="text-left py-2 px-2">Year</th>
                            <th className="text-right py-2 px-2">Bill</th>
                            <th className="text-right py-2 px-2">Solar value</th>
                            <th className="text-right py-2 px-2">Bill after solar</th>
                            <th className="text-right py-2 px-2">Saved that yr</th>
                            <th className="text-right py-2 px-2">Cumulative</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r) => {
                            const savedThisYr = r.doNothingAnnual - r.withRoofAnnual;
                            const cumSaved = r.doNothingCumulative - r.withRoofCumulative;
                            return (
                              <tr key={r.year} className="border-b border-hairline/60 last:border-0">
                                <td className="py-2.5 px-2 font-bold text-foreground">Y{r.year}</td>
                                <td className="py-2.5 px-2 text-right font-mono text-destructive">{formatCurrency(r.doNothingAnnual)}</td>
                                <td className="py-2.5 px-2 text-right font-mono text-accent">{formatCurrency(r.energyValueAnnual)}</td>
                                <td className="py-2.5 px-2 text-right font-mono text-muted-foreground">{formatCurrency(r.withRoofAnnual)}</td>
                                <td className="py-2.5 px-2 text-right font-extrabold text-primary">{formatCurrency(savedThisYr)}</td>
                                <td className="py-2.5 px-2 text-right font-extrabold text-primary">{formatCurrencyShort(cumSaved)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                      <span className="font-semibold text-foreground">Why "Saved" can be less than "Solar value":</span> if the roof produces more power than the bill in a year, the extra is exported at a lower credit rate — the bill can only drop to $0, not below. Add up "Saved that yr" and you get the Cumulative total exactly.
                    </p>
                  </div>
                );
              })()}

              {/* Chart: Utility spend over time */}
              <div className="rounded-2xl border border-hairline bg-muted/30 p-5">
                <h4 className="text-sm font-display font-extrabold tracking-tight mb-3">Utility spend over time</h4>
                <div className="h-80">
                  <Recharts.ResponsiveContainer width="100%" height="100%">
                    <Recharts.AreaChart data={result.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="doNothingFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="withRoofFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Recharts.CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <Recharts.XAxis dataKey="year" tickFormatter={(y) => `Y${y}`} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                      <Recharts.YAxis tickFormatter={(v) => formatCurrencyShort(v)} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                      <Recharts.Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                        formatter={(v: number) => formatCurrency(v)}
                        labelFormatter={(l) => `Year ${l}`}
                      />
                      <Recharts.Legend wrapperStyle={{ fontSize: 11 }} />
                      <Recharts.Area type="monotone" dataKey="doNothingAnnual" name="Do nothing" stroke="hsl(var(--destructive))" fill="url(#doNothingFill)" strokeWidth={2} />
                      <Recharts.Area type="monotone" dataKey="withRoofAnnual" name="With Energy Roof" stroke="hsl(var(--accent))" fill="url(#withRoofFill)" strokeWidth={2} />
                    </Recharts.AreaChart>
                  </Recharts.ResponsiveContainer>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                  <span className="font-semibold text-foreground">What you are seeing:</span> The red area shows how much your annual utility bill grows if you do nothing — bills rise every year as rates go up. The green area shows your remaining utility spend after the Energy Roof offsets part of your usage. The gap between the two is money you keep in your pocket.
                </p>
              </div>

              {/* Chart: Cumulative savings */}
              <div className="rounded-2xl border border-hairline bg-muted/30 p-5">
                <h4 className="text-sm font-display font-extrabold tracking-tight mb-3">Cumulative savings vs. doing nothing</h4>
                <div className="h-64">
                  <Recharts.ResponsiveContainer width="100%" height="100%">
                    <Recharts.LineChart data={result.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <Recharts.CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <Recharts.XAxis dataKey="year" tickFormatter={(y) => `Y${y}`} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                      <Recharts.YAxis tickFormatter={(v) => formatCurrencyShort(v)} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                      <Recharts.Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                        formatter={(v: number) => formatCurrency(v)}
                        labelFormatter={(l) => `Year ${l}`}
                      />
                      <Recharts.Line type="monotone" dataKey="energyValueCumulative" name="Cumulative value created" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                    </Recharts.LineChart>
                  </Recharts.ResponsiveContainer>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                  <span className="font-semibold text-foreground">What you are seeing:</span> This line shows the total value the Energy Roof has created since day one — every year it adds the savings from self-used power plus any export credits. As utility rates rise, each kilowatt-hour you produce becomes more valuable, so the curve steepens over time. That upward bend is your hedge against inflation working.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Options panel */}
        <SectionCard title="Choose Your Lever" subtitle="Step 4 — pick the option that fits the home" icon={Sparkles}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {options.map((opt) => {
              const active = systemKw === opt.kw;
              return (
                <button key={opt.key} onClick={() => setSystemKw(opt.kw)}
                  className={`text-left rounded-2xl border p-5 transition-all pressable ${active ? "border-primary bg-primary/5 shadow-[var(--shadow-glow)]" : "border-hairline bg-card hover:border-hairline-strong"}`}>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className={`text-[11px] font-bold uppercase tracking-wider ${opt.accent}`}>Option {opt.key} — {opt.kw}kW</p>
                      <h4 className="text-lg font-display font-extrabold mt-0.5">{opt.title}</h4>
                    </div>
                    {active && <span className="text-[10px] font-bold text-primary uppercase">Selected</span>}
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Year 1 value</span><span className="font-bold">{formatCurrency(opt.y1)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">10-year value</span><span className="font-bold">{formatCurrencyShort(opt.y10)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">25-year value</span><span className={`font-extrabold ${opt.accent}`}>{formatCurrencyShort(opt.y25)}</span></div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3 italic">{opt.tag}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl bg-muted/40 border border-hairline p-3 text-sm">
            <p className="font-semibold mb-0.5">Financing language</p>
            <p className="text-muted-foreground">"Most homeowners decide based on monthly comfort, not total price. Which feels best — conservative, middle, or aggressive monthly range?"</p>
          </div>
        </SectionCard>

        {/* Live utility watch — auto-refreshed daily from SRP/APS/TEP/AZCC */}
        <UtilityNewsFeed activeUtility={(utility.id.toUpperCase() as "SRP" | "APS" | "TEP")} />

        {/* Rules & Reality + Driver + Script */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <SectionCard title="Rules & Reality Overlay" subtitle="Local utility constraints" icon={MapPin}>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Rate plans</p>
                {RATE_PLANS.filter((r) => r.utilityId === utility.id).map((r) => (
                  <div key={r.id} className="text-xs py-1.5 border-b border-hairline last:border-0">
                    <span className="font-semibold">{r.name}</span> <span className="text-muted-foreground">· {r.type}</span>
                    <p className="text-muted-foreground">{r.summary}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Export compensation</p>
                {EXPORT_RULES.filter((r) => r.utilityId === utility.id).map((r) => (
                  <p key={r.id} className="text-xs text-muted-foreground py-1">
                    <span className="font-semibold text-foreground">{r.hasBattery ? "With battery: " : "No battery: "}</span>{r.rule}
                  </p>
                ))}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Recent regulatory changes</p>
                {REGULATORY_LOG.filter((r) => r.utilityId === utility.id).map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs py-1">
                    <span className="font-mono text-muted-foreground">{r.date}</span>
                    <span>{r.title}</span>
                    <span className={r.impact === "up" ? "text-destructive" : "text-accent"}>
                      {r.impact === "up" ? "↑" : "↓"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Why Demand is Rising" subtitle="Calm context, not politics" icon={Cpu}>
            <Collapsible open={driverOpen} onOpenChange={setDriverOpen}>
              <p className="text-sm text-muted-foreground">
                More digital services + AI = more electricity demand. Data centers are growing fast, and Arizona is a major hub.
              </p>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-2 -ml-2 text-xs">
                  {driverOpen ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                  {driverOpen ? "Hide" : "Show"} timeline
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-2 text-xs">
                <div className="flex gap-3"><span className="font-bold w-20">2000s</span><span className="text-muted-foreground">Dot-com — first big wave of online services.</span></div>
                <div className="flex gap-3"><span className="font-bold w-20">2010–2020</span><span className="text-muted-foreground">Cloud + data center boom.</span></div>
                <div className="flex gap-3"><span className="font-bold w-20">2024+</span><span className="text-muted-foreground">AI workloads accelerating; AZ a key hotspot for new data centers.</span></div>
              </CollapsibleContent>
            </Collapsible>
          </SectionCard>

          <SectionCard title="Rep Script" subtitle="Calm, trust-based lines" icon={Info}>
            <div className="space-y-2">
              {REP_SCRIPT.map((line, i) => (
                <div key={i} className="rounded-xl border border-hairline bg-muted/30 p-3 text-sm leading-snug">
                  "{line}"
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Assumptions drawer */}
        <Collapsible open={assumptionsOpen} onOpenChange={setAssumptionsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2"><Info className="h-4 w-4" /> Assumptions & formulas</span>
              {assumptionsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="rounded-2xl border border-hairline bg-card p-5 text-xs space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-muted-foreground">
                <div><span className="text-foreground font-bold">annual_kWh</span> = (bill / rate) × 12 = {formatCount(result.annualKwhUsage)}</div>
                <div><span className="text-foreground font-bold">prod_annual</span> = kW × {utility.productionFactor} = {formatCount(result.prodYear1)} kWh</div>
                <div><span className="text-foreground font-bold">self_used</span> = prod × {pct(selfConsumption)} = {formatCount(result.selfUsedYear1)} kWh</div>
                <div><span className="text-foreground font-bold">exported</span> = prod − self_used = {formatCount(result.exportedYear1)} kWh</div>
                <div><span className="text-foreground font-bold">value_Y1</span> = self_used × ${effectiveRate.toFixed(2)} + exported × ${exportRate.toFixed(2)} = {formatCurrency(result.valueYear1)}</div>
                <div><span className="text-foreground font-bold">inflation</span> = compounding at {pct(inflationPct)}/yr over {horizon}y</div>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-hairline">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={degradationOn} onChange={(e) => setDegradationOn(e.target.checked)} />
                  <span>Apply 0.5%/yr panel degradation</span>
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground italic">
                Estimates only — not a quote. Actual savings depend on utility plan, roof conditions, and usage patterns.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </main>
    </div>
  );
}
