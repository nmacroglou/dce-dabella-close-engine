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
  const [utilityWatchOpen, setUtilityWatchOpen] = useState(false);

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
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-7 print:hidden">

        {/* === TIGHT THESIS HERO === */}
        <section className="relative overflow-hidden rounded-3xl border border-hairline bg-gradient-to-br from-card via-card to-primary/8 px-6 sm:px-10 py-7 sm:py-9 shadow-[var(--shadow-md)]">
          <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-primary/20 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-accent/15 blur-[120px]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          <div className="relative space-y-5">
            {/* Top row: badge + tight headline + print */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-2.5 max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 backdrop-blur-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <Sparkles className="h-3 w-3" />
                  Energy Roof Inflation Lens
                </div>
                <h1 className="text-2xl sm:text-[2rem] font-display font-extrabold tracking-[-0.03em] leading-[1.05]">
                  From your roof to your pocket — <span className="gradient-text">take back</span> the energy your largest asset is capable of producing.
                </h1>
                <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  A smart, data-driven decision — see exactly who keeps the value your home is already producing.
                </p>
              </div>
              <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2 backdrop-blur-xl bg-card/70 border-hairline-strong hover:border-primary/50 hover:bg-primary/5 shrink-0">
                <Printer className="h-3.5 w-3.5" /> Print summary
              </Button>
            </div>

            {/* KPI trio — the decision at a glance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Do-nothing exposure */}
              <div className="relative rounded-2xl border border-destructive/30 bg-destructive/10 p-4 overflow-hidden">
                <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-destructive/20 blur-2xl" />
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-destructive">Do nothing · {horizon}y</p>
                <p className="font-display font-extrabold text-destructive tabular-nums tracking-tight leading-none text-3xl sm:text-4xl mt-2">{formatCurrencyShort(result.cumulativeDoNothing)}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5">paid to the utility · zero ownership</p>
              </div>

              {/* Energy ownership value */}
              <div className="relative rounded-2xl border border-primary/30 bg-primary/10 p-4 overflow-hidden">
                <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Energy you'd own · {horizon}y</p>
                <p className="font-display font-extrabold text-primary tabular-nums tracking-tight leading-none text-3xl sm:text-4xl mt-2">{formatCurrencyShort(result.cumulativeEnergyValue)}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5">value produced by your roof</p>
              </div>

              {/* Year 1 savings + inflation neutralized */}
              <div className="relative rounded-2xl border border-accent/30 bg-accent/10 p-4 overflow-hidden">
                <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-accent/20 blur-2xl" />
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">Year-1 savings</p>
                <p className="font-display font-extrabold text-accent tabular-nums tracking-tight leading-none text-3xl sm:text-4xl mt-2">{formatCurrency(result.valueYear1)}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5">{pct(result.inflationExposureReducedPct)} of utility inflation neutralized</p>
              </div>
            </div>
          </div>
        </section>

        {/* === COMPACT INPUT STRIP — the essentials Steps 1 & 2 used to gate behind === */}
        <section className="relative rounded-2xl border border-hairline bg-card/60 backdrop-blur-xl p-4 sm:p-5 shadow-[var(--shadow-sm)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 border border-hairline px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              <Gauge className="h-3 w-3" /> Your numbers
            </span>
            <span className="text-[11px] text-muted-foreground">Set these once — the simulator below reacts to every change</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Utility */}
            <div>
              <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Utility</Label>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {UTILITIES.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setUtilityId(u.id); setExportRate(u.exportCredit); }}
                    className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-bold border transition-all ${
                      utilityId === u.id ? "gradient-brand text-primary-foreground border-transparent shadow-[var(--shadow-glow)]" : "bg-muted/40 text-muted-foreground border-hairline hover:bg-muted"
                    }`}
                  >{u.name}</button>
                ))}
              </div>
            </div>

            {/* Monthly bill */}
            <div>
              <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Monthly bill</Label>
              <Input type="number" value={monthlyBill} onChange={(e) => setMonthlyBill(Number(e.target.value) || 0)} className="mt-1.5 h-9 text-sm font-display font-extrabold tabular-nums" />
            </div>

            {/* Effective rate */}
            <div>
              <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Rate $/kWh</Label>
              <div className="flex gap-1 mt-1.5">
                <button onClick={() => { setRate(utility.defaultRateLow); setCustomRate(""); }}
                  className={`flex-1 px-1.5 py-1.5 rounded-md text-[11px] font-bold border ${rate === utility.defaultRateLow && !customRate ? "gradient-brand text-primary-foreground border-transparent" : "bg-muted/40 border-hairline"}`}>
                  ${utility.defaultRateLow.toFixed(2)}
                </button>
                <button onClick={() => { setRate(utility.defaultRateHigh); setCustomRate(""); }}
                  className={`flex-1 px-1.5 py-1.5 rounded-md text-[11px] font-bold border ${rate === utility.defaultRateHigh && !customRate ? "gradient-brand text-primary-foreground border-transparent" : "bg-muted/40 border-hairline"}`}>
                  ${utility.defaultRateHigh.toFixed(2)}
                </button>
                <Input type="number" step="0.01" placeholder="Custom" value={customRate} onChange={(e) => setCustomRate(e.target.value)} className="w-16 h-8 text-[11px] px-1.5" />
              </div>
            </div>

            {/* Inflation */}
            <div>
              <div className="flex justify-between items-baseline">
                <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Utility inflation</Label>
                <span className="text-xs font-display font-extrabold text-primary tabular-nums">{pct(inflationPct)}</span>
              </div>
              <div className="flex gap-1 mt-1.5">
                {INFLATION_SCENARIOS.map((s) => (
                  <button key={s.id} onClick={() => setInflationPct(s.rate)}
                    className={`flex-1 px-1 py-1.5 rounded-md text-[10px] font-bold border ${inflationPct === s.rate ? "gradient-brand text-primary-foreground border-transparent" : "bg-muted/40 border-hairline"}`}>
                    {pct(s.rate)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* === CENTERPIECE: Impact Simulator — this is the page === */}
        <SectionCard
          eyebrow="The math · here's where the dollars go"
          title="Energy Roof Impact Simulator"
          subtitle="Self-used power vs. exports · what battery storage actually changes · the perfect scenario for this home"
          icon={Sun}
        >
          {/* Sticky control deck: every input the dashboard reacts to */}
          <div className="sticky top-2 z-30 -mx-5 sm:-mx-6 px-5 sm:px-6 py-3 mb-5 rounded-2xl glass-strong shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                <Sparkles className="h-3 w-3" /> Live controls
              </span>
              <span className="text-[11px] text-muted-foreground">Move any slider — every graph below responds</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-3">
              {/* Time horizon */}
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

          <div className="mt-5">
            <YearlySavingsBreakdown series={result.series} horizon={horizon} />
          </div>
        </SectionCard>

        {/* === "PAYS FOR ITSELF" BAND — the bridge from math to options === */}
        <section className="relative overflow-hidden rounded-3xl border-2 border-accent/40 bg-gradient-to-r from-accent/10 via-card to-primary/10 px-6 sm:px-10 py-6 shadow-[var(--shadow-md)]">
          <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-accent/20 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-primary/20 blur-[100px]" />
          <div className="relative grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 border border-accent/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-accent mb-3">
                <Shield className="h-3 w-3" /> The math above proves it
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight leading-tight">
                Every option below <span className="text-accent">earns more than it costs</span>. Pick the one that fits the home.
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Three sizing levels — same Golden Pledge, same Factory-Trained installers, same Master Elite warranty. The only question is how much exposure you want neutralized.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Year-1 value</p>
                <p className="font-display font-extrabold text-accent tabular-nums text-2xl sm:text-3xl mt-1 leading-none">{formatCurrency(result.valueYear1)}</p>
                <p className="text-[10px] text-muted-foreground mt-1.5">≈ {formatCurrency(result.valueYear1Monthly)}/mo</p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">{horizon}-yr value</p>
                <p className="font-display font-extrabold text-primary tabular-nums text-2xl sm:text-3xl mt-1 leading-none">{formatCurrencyShort(result.cumulativeEnergyValue)}</p>
                <p className="text-[10px] text-muted-foreground mt-1.5">{pct(result.inflationExposureReducedPct)} exposure neutralized</p>
              </div>
            </div>
          </div>
        </section>


        {/* Options panel */}
        <SectionCard eyebrow="The close · pick your hedge" title="Choose Your Lever" subtitle="Same Golden Pledge, same Factory-Trained installers, same Master Elite warranty — only the kW changes" icon={Sparkles}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {options.map((opt, idx) => {
              const active = systemKw === opt.kw;
              const OptIcon = idx === 0 ? Shield : idx === 1 ? Target : Zap;
              return (
                <button
                  key={opt.key}
                  onClick={() => setSystemKw(opt.kw)}
                  className={`group relative overflow-hidden text-left rounded-2xl border p-6 transition-all duration-300 active:scale-[0.99] ${
                    active
                      ? "border-primary bg-gradient-to-br from-primary/15 via-card to-card shadow-[var(--shadow-glow)] -translate-y-1"
                      : "border-hairline bg-card hover:border-primary/40 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
                  }`}
                >
                  {/* Top accent line */}
                  <div className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                       style={{ background: idx === 1 ? "linear-gradient(90deg, transparent, hsl(var(--accent)), transparent)" : "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)" }} />
                  {/* Corner glow */}
                  <div className={`pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-60"} ${idx === 1 ? "bg-accent/25" : "bg-primary/25"}`} />

                  {/* Header */}
                  <div className="relative flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 transition-all ${active ? `${idx === 1 ? "bg-accent/15 text-accent ring-accent/40" : "bg-primary/15 text-primary ring-primary/40"}` : "bg-muted/60 text-muted-foreground ring-hairline group-hover:text-foreground"}`}>
                        <OptIcon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${opt.accent}`}>Option {opt.key} · {opt.kw}kW</p>
                        <h4 className="text-xl font-display font-extrabold mt-0.5 leading-tight tracking-tight">{opt.title}</h4>
                      </div>
                    </div>
                    {active && (
                      <span className="flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] shrink-0 shadow-[var(--shadow-glow)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground animate-pulse" />
                        Selected
                      </span>
                    )}
                  </div>

                  {/* Hero number — 25y */}
                  <div className="relative rounded-xl bg-gradient-to-br from-muted/60 to-muted/20 border border-hairline p-4 mb-3 overflow-hidden">
                    <div className={`pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full blur-2xl ${idx === 1 ? "bg-accent/15" : "bg-primary/15"}`} />
                    <p className="relative text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">25-year energy value</p>
                    <p className={`relative mt-1 font-display font-extrabold text-4xl sm:text-[2.75rem] tabular-nums tracking-tight leading-none ${opt.accent}`}>{formatCurrencyShort(opt.y25)}</p>
                    <p className="relative mt-2 text-[11px] text-muted-foreground">
                      ≈ <span className="font-bold text-foreground tabular-nums">{formatCurrency(opt.y1 / 12)}</span>/mo equivalent (year 1)
                    </p>
                  </div>

                  {/* Year-1 / 10-year row */}
                  <div className="relative grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-muted/30 border border-hairline px-3 py-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Year 1</p>
                      <p className="font-display font-extrabold tabular-nums text-base mt-0.5">{formatCurrency(opt.y1)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 border border-hairline px-3 py-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">10-year</p>
                      <p className="font-display font-extrabold tabular-nums text-base mt-0.5">{formatCurrencyShort(opt.y10)}</p>
                    </div>
                  </div>

                  {/* Exposure reduction bar */}
                  {(() => {
                    const exposure = result.cumulativeDoNothing > 0 ? Math.min(1, opt.y25 / result.cumulativeDoNothing) : 0;
                    return (
                      <div className="relative mt-4">
                        <div className="flex items-baseline justify-between mb-1.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Exposure neutralized</p>
                          <p className={`text-xs font-display font-extrabold tabular-nums ${opt.accent}`}>{pct(exposure)}</p>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${idx === 1 ? "bg-accent" : "bg-primary"}`} style={{ width: `${exposure * 100}%` }} />
                        </div>
                      </div>
                    );
                  })()}

                  <p className="relative text-[11px] text-muted-foreground mt-4 italic leading-snug">{opt.tag}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-6 rounded-2xl bg-gradient-to-r from-primary/10 via-muted/40 to-accent/10 border border-hairline p-5 text-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary/90 mb-1.5 flex items-center gap-1.5"><Info className="h-3 w-3" /> Financing language</p>
            <p className="text-foreground/85 leading-relaxed">"Most homeowners decide based on monthly comfort, not total price. Which feels best — conservative, middle, or aggressive monthly range?"</p>
          </div>
        </SectionCard>

        {/* Live utility watch — auto-refreshed daily from SRP/APS/TEP/AZCC */}
        <Collapsible open={utilityWatchOpen} onOpenChange={setUtilityWatchOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2"><Info className="h-4 w-4" /> Live utility watch — {utility.name} headlines & rate filings</span>
              {utilityWatchOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <UtilityNewsFeed activeUtility={(utility.id.toUpperCase() as "SRP" | "APS" | "TEP")} />
          </CollapsibleContent>
        </Collapsible>


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
            <div className="space-y-2.5">
              {REP_SCRIPT.map((line, i) => (
                <div key={i} className="group relative rounded-xl border border-hairline bg-gradient-to-br from-muted/40 to-muted/10 p-3.5 text-sm leading-snug transition-all hover:border-primary/30 hover:-translate-y-0.5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg gradient-brand text-primary-foreground text-[11px] font-display font-extrabold shadow-[var(--shadow-glow)]">{i + 1}</span>
                    <p className="text-foreground/90 italic">"{line}"</p>
                  </div>
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

