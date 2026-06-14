import { useMemo, useState, lazy, Suspense } from "react";

import {
  Zap, Sun, Battery, TrendingUp, Info, Printer, Cpu, MapPin,
  ChevronDown, ChevronUp, Sparkles, Shield, Target, Gauge, Loader2,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import UtilityNewsFeed from "@/components/energy/UtilityNewsFeed";
import YearlySavingsBreakdown from "@/components/energy/YearlySavingsBreakdown";
// Chart-heavy + print components pull recharts/large markup — defer until needed.
const LiveImpactDashboard = lazy(() => import("@/components/energy/LiveImpactDashboard"));
const EnergySummaryPrintView = lazy(() => import("@/components/energy/EnergySummaryPrintView"));
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
    <div className={`group relative overflow-hidden rounded-2xl border border-hairline bg-card shadow-[var(--shadow-xs)] transition-all hover:border-primary/40 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 ${large ? "p-6 sm:p-7" : "p-5 sm:p-6"}`}>
      <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-hairline ${accent}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="truncate">{label}</span>
      </div>
      <div className={`relative ${large ? "text-4xl sm:text-5xl" : "text-3xl sm:text-[2.25rem]"} font-display font-extrabold tracking-tight mt-3 ${accent} num-display leading-none`}>{value}</div>
      {sub && <div className="relative text-xs text-muted-foreground mt-2 leading-snug">{sub}</div>}
    </div>
  );
}

function SectionCard({ title, subtitle, icon: Icon, eyebrow, children }: {
  title: string; subtitle?: string; icon?: React.ComponentType<{ className?: string }>; eyebrow?: string; children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-hairline bg-card p-7 sm:p-9 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)] hover:border-hairline-strong">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="flex items-start gap-4 mb-7">
        {Icon && (
          <div className="h-14 w-14 rounded-2xl gradient-brand grid place-items-center text-primary-foreground flex-shrink-0 shadow-[var(--shadow-glow)]">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/90 mb-1.5">{eyebrow}</p>
          )}
          <h3 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight leading-tight">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground mt-1.5 leading-snug">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

/** Unified pill button used for option chips throughout the page */
function Pill({ active, onClick, children, className = "", disabled = false, title }: {
  active: boolean; onClick?: () => void; children: React.ReactNode; className?: string; disabled?: boolean; title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`relative rounded-xl border font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none ${
        active
          ? "gradient-brand text-primary-foreground border-transparent shadow-[var(--shadow-glow)]"
          : "bg-muted/50 text-foreground border-hairline hover:bg-muted hover:border-hairline-strong"
      } ${className}`}
    >
      {children}
    </button>
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
      <div className="print:hidden">
        <AppHeader />
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-7 print:hidden">

        {/* Hero header */}
        <section className="relative overflow-hidden rounded-3xl border border-hairline bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-7 shadow-[var(--shadow-sm)]">
          <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                <Sparkles className="h-3 w-3" />
                Homeowner inflation lens
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight leading-[1.05]">
                Energy Roof <span className="gradient-text">Inflation Lens</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                A homeowner-friendly view of utility inflation and how a GAF Energy Roof gives you a lever to reduce exposure.
              </p>
            </div>
            <Button onClick={handlePrint} variant="outline" className="gap-2 shrink-0">
              <Printer className="h-4 w-4" /> Print summary
            </Button>
          </div>
        </section>

        {/* Guided steps strip */}
        <nav aria-label="Guided steps" className="rounded-2xl border border-hairline bg-card/60 backdrop-blur p-2.5 sm:p-3 flex items-center gap-1.5 sm:gap-2 text-xs font-semibold overflow-x-auto">
          {[
            { n: 1, label: "Utility", tone: "primary" as const },
            { n: 2, label: "Inflation", tone: "primary" as const },
            { n: 3, label: "System size", tone: "primary" as const },
            { n: 4, label: "Choose option", tone: "accent" as const },
          ].map((s, i, arr) => (
            <div key={s.n} className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="flex items-center gap-1.5 rounded-xl bg-muted/50 border border-hairline px-2.5 py-1.5">
                <span className={`h-5 w-5 rounded-full grid place-items-center text-[10px] font-bold ${s.tone === "accent" ? "bg-accent text-accent-foreground" : "gradient-brand text-primary-foreground"}`}>{s.n}</span>
                <span className="text-foreground whitespace-nowrap">{s.label}</span>
              </span>
              {i < arr.length - 1 && <span className="text-hairline-strong">→</span>}
            </div>
          ))}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1) Your Utility Reality */}
          <SectionCard eyebrow="Step 1" title="Your Utility Reality" subtitle="Where you are today" icon={Zap}>
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
          <SectionCard eyebrow="Step 2" title="Inflation Timeline" subtitle="What happens if nothing changes" icon={TrendingUp}>
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

        {/* 3) Energy Roof Impact Simulator — sticky controls + flowing dashboard */}
        <SectionCard eyebrow="Step 3" title="Energy Roof Impact Simulator" subtitle="Adjust any lever — the dashboard updates live" icon={Sun}>
          {/* Sticky control deck: every input the dashboard reacts to, in one row */}
          <div className="sticky top-2 z-30 -mx-5 sm:-mx-6 px-5 sm:px-6 py-3 mb-5 rounded-2xl glass-strong shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                <Sparkles className="h-3 w-3" /> Live controls
              </span>
              <span className="text-[11px] text-muted-foreground">Move any slider — every graph below responds</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-3">
              {/* Time horizon — moved here so it visibly drives the graphs */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Time horizon</Label>
                  <span className="text-sm font-display font-extrabold text-primary tabular-nums">{horizon}y</span>
                </div>
                <Slider min={1} max={50} step={1} value={[horizon]} onValueChange={(v) => setHorizon(v[0])} />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[10, 15, 20, 25, 30].map((y) => (
                    <button key={y} onClick={() => setHorizon(y)}
                      className={`flex-1 px-1.5 py-1 rounded-md text-[10px] font-bold border transition-all ${horizon === y ? "gradient-brand text-primary-foreground border-transparent" : "bg-muted/40 border-hairline hover:bg-muted"}`}>
                      {y}y
                    </button>
                  ))}
                </div>
              </div>

              {/* System size */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">System size</Label>
                  <span className="text-sm font-display font-extrabold text-primary tabular-nums">{systemKw.toFixed(1)}kW</span>
                </div>
                <Slider min={1} max={20} step={0.5} value={[systemKw]} onValueChange={(v) => setSystemKw(v[0])} />
                <div className="flex gap-1 mt-1.5">
                  {[2, 3, 4].map((kw) => (
                    <button key={kw} onClick={() => setSystemKw(kw)}
                      className={`flex-1 px-1.5 py-1 rounded-md text-[10px] font-bold border transition-all ${systemKw === kw ? "gradient-brand text-primary-foreground border-transparent" : "bg-muted/40 border-hairline hover:bg-muted"}`}>
                      {kw}kW
                    </button>
                  ))}
                </div>
              </div>

              {/* Self-consumption */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Used in home</Label>
                  <span className="text-sm font-display font-extrabold text-accent tabular-nums">{pct(selfConsumption)}</span>
                </div>
                <Slider min={0.1} max={1} step={0.05} value={[selfConsumption]} onValueChange={(v) => setSelfConsumption(v[0])} />
                <div className="flex gap-1 mt-1.5">
                  {SELF_CONSUMPTION_PRESETS.map((p) => (
                    <button key={p.id} onClick={() => setSelfConsumption(p.pct)}
                      className={`flex-1 px-1.5 py-1 rounded-md text-[10px] font-semibold border transition-all ${Math.abs(selfConsumption - p.pct) < 0.01 ? "gradient-brand text-primary-foreground border-transparent" : "bg-muted/40 border-hairline hover:bg-muted"}`}>
                      {p.label.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Battery */}
              <div>
                <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1 block">Battery</Label>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => { setHasBattery(true); setSelfConsumption(0.85); }}
                    className={`flex-1 px-2 py-2 rounded-md text-xs font-bold border transition-all ${hasBattery ? "gradient-brand text-primary-foreground border-transparent shadow-[var(--shadow-glow)]" : "bg-muted/40 border-hairline hover:bg-muted"}`}>
                    <Battery className="h-3 w-3 inline mr-1" /> Yes
                  </button>
                  <button onClick={() => { setHasBattery(false); setSelfConsumption(0.35); }}
                    className={`flex-1 px-2 py-2 rounded-md text-xs font-bold border transition-all ${!hasBattery ? "gradient-brand text-primary-foreground border-transparent" : "bg-muted/40 border-hairline hover:bg-muted"}`}>
                    No
                  </button>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Label className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground whitespace-nowrap">Export $</Label>
                  <Input type="number" step="0.01" value={exportRate} onChange={(e) => setExportRate(Number(e.target.value) || 0)} className="h-6 text-[11px] px-1.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard flows full-width below — every graph driven by the deck above */}
          <Suspense fallback={<div className="h-96 grid place-items-center rounded-2xl border border-border bg-card"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
            <LiveImpactDashboard
              baseInputs={{
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
              }}
              result={result}
              horizon={horizon}
              systemKw={systemKw}
              hasBattery={hasBattery}
              onSetSystemKw={setSystemKw}
              onSetHasBattery={setHasBattery}
              onSetSelfConsumption={setSelfConsumption}
            />
          </Suspense>

          {/* Year-by-year savings breakdown */}
          <div className="mt-5">
            <YearlySavingsBreakdown series={result.series} horizon={horizon} />
          </div>
        </SectionCard>


        {/* Options panel */}
        <SectionCard eyebrow="Step 4" title="Choose Your Lever" subtitle="Pick the option that fits the home" icon={Sparkles}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {options.map((opt) => {
              const active = systemKw === opt.kw;
              return (
                <button
                  key={opt.key}
                  onClick={() => setSystemKw(opt.kw)}
                  className={`group relative overflow-hidden text-left rounded-2xl border p-5 transition-all active:scale-[0.99] ${
                    active
                      ? "border-primary bg-gradient-to-br from-primary/10 via-card to-card shadow-[var(--shadow-glow)]"
                      : "border-hairline bg-card hover:border-hairline-strong hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
                  }`}
                >
                  {active && (
                    <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
                  )}
                  <div className="relative flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${opt.accent}`}>Option {opt.key} · {opt.kw}kW</p>
                      <h4 className="text-lg font-display font-extrabold mt-1 leading-tight">{opt.title}</h4>
                    </div>
                    {active && (
                      <span className="flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="relative mt-4 space-y-2 text-sm">
                    <div className="flex justify-between items-baseline">
                      <span className="text-muted-foreground text-xs">Year 1</span>
                      <span className="font-bold tabular-nums">{formatCurrency(opt.y1)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-muted-foreground text-xs">10-year</span>
                      <span className="font-bold tabular-nums">{formatCurrencyShort(opt.y10)}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-hairline">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider">25-year</span>
                      <span className={`font-display font-extrabold text-xl tabular-nums ${opt.accent}`}>{formatCurrencyShort(opt.y25)}</span>
                    </div>
                  </div>
                  <p className="relative text-[11px] text-muted-foreground mt-4 italic leading-snug">{opt.tag}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-5 rounded-2xl bg-gradient-to-r from-muted/60 to-muted/30 border border-hairline p-4 text-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary/80 mb-1">Financing language</p>
            <p className="text-muted-foreground leading-relaxed">"Most homeowners decide based on monthly comfort, not total price. Which feels best — conservative, middle, or aggressive monthly range?"</p>
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

      {/* Print-only proposal-style summary */}
      <div className="hidden print:block">
        <Suspense fallback={null}>
          <EnergySummaryPrintView
            utility={utility}
            monthlyBill={monthlyBill}
            rate={effectiveRate}
            exportRate={exportRate}
            inflationPct={inflationPct}
            horizon={horizon}
            systemKw={systemKw}
            hasBattery={hasBattery}
            selfConsumption={selfConsumption}
            result={result}
            options={options}
          />
        </Suspense>
      </div>
    </div>
  );
}

