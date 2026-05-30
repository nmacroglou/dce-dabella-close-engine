import { useEffect, useMemo, useRef, useState } from "react";
import * as Recharts from "recharts";
import {
  Sun, Zap, Shield, Target, Battery, TrendingUp, TrendingDown,
  Sparkles, ArrowRight, Wallet, Flame, Wand2, Check,
} from "lucide-react";
import { computeLens, type LensInputs, type LensResult } from "@/lib/energyLensCalc";
import { formatCurrency, formatCurrencyShort, formatCount, pct } from "@/lib/format";

interface Props {
  baseInputs: LensInputs;
  result: LensResult;
  horizon: number;
  systemKw: number;
  hasBattery: boolean;
  onSetSystemKw: (kw: number) => void;
  onSetHasBattery: (b: boolean) => void;
  onSetSelfConsumption: (s: number) => void;
}

/** Animated number — eases to new value when inputs change */
function useAnimatedNumber(value: number, duration = 450) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const step = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;
      const k = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(fromRef.current + (value - fromRef.current) * eased);
      if (k < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return display;
}

function ImpactTile({
  icon: Icon, label, value, sub, accent, formatter, pulseKey,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub?: string;
  accent: string;
  formatter: (n: number) => string;
  pulseKey?: string | number;
}) {
  const animated = useAnimatedNumber(value);
  return (
    <div
      key={pulseKey}
      className="group relative overflow-hidden rounded-2xl border border-hairline bg-card p-4 shadow-[var(--shadow-xs)] transition-all hover:border-hairline-strong hover:shadow-[var(--shadow-sm)] animate-in fade-in zoom-in-95 duration-300"
    >
      <div className={`absolute -top-10 -right-10 h-24 w-24 rounded-full ${accent.replace("text-", "bg-")}/10 blur-2xl`} />
      <div className="relative flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        <span className={`flex h-6 w-6 items-center justify-center rounded-lg bg-muted/60 ${accent}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="truncate">{label}</span>
      </div>
      <div className={`relative text-3xl sm:text-4xl font-display font-extrabold tracking-tight mt-2 ${accent} tabular-nums leading-none`}>
        {formatter(animated)}
      </div>
      {sub && <div className="relative text-[11px] text-muted-foreground mt-1.5">{sub}</div>}
    </div>
  );
}

export default function LiveImpactDashboard({
  baseInputs, result, horizon, systemKw, hasBattery, onSetSystemKw, onSetHasBattery, onSetSelfConsumption,
}: Props) {
  // --- Counterfactual scenarios for comparisons ---
  const noBatteryResult = useMemo(
    () => computeLens({ ...baseInputs, hasBattery: false, selfConsumptionPct: 0.35 }),
    [baseInputs]
  );
  const withBatteryResult = useMemo(
    () => computeLens({ ...baseInputs, hasBattery: true, selfConsumptionPct: 0.85 }),
    [baseInputs]
  );

  const batteryLiftAnnual = withBatteryResult.valueYear1 - noBatteryResult.valueYear1;
  const batteryLiftLifetime = withBatteryResult.cumulativeEnergyValue - noBatteryResult.cumulativeEnergyValue;

  const sizeScenarios = useMemo(() => {
    return [2, 3, 4, 5, 6].map((kw) => {
      const r = computeLens({ ...baseInputs, systemKw: kw });
      return {
        kw,
        valueYear1: r.valueYear1,
        cumulative: r.cumulativeEnergyValue,
        offsetPct: r.offsetPct,
        series: r.series,
      };
    });
  }, [baseInputs]);

  // Stacked composition data — self-used vs exported $ per year
  const stackedData = useMemo(() => {
    return result.series.map((row, i) => {
      const inflationMult = Math.pow(1 + baseInputs.inflationPct, i);
      const degradationMult = Math.pow(1 - (baseInputs.degradationPct ?? 0.005), i);
      const prodThisYear = result.prodYear1 * degradationMult;
      const selfUsed = prodThisYear * baseInputs.selfConsumptionPct;
      const exported = prodThisYear - selfUsed;
      return {
        year: row.year,
        selfUsedValue: selfUsed * baseInputs.rate * inflationMult,
        exportValue: exported * baseInputs.exportRate * inflationMult,
        annualBill: row.doNothingAnnual,
      };
    });
  }, [result, baseInputs]);

  // Live monthly comparison
  const currentMonthlyBill = baseInputs.monthlyBill;
  const offsetMonthly = result.valueYear1Monthly;
  const remainingMonthly = Math.max(0, currentMonthlyBill - offsetMonthly);

  const horizonStr = `${horizon}y`;

  return (
    <div className="space-y-5">
      {/* === HERO: Now vs After live comparison === */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-5 sm:p-6 shadow-[var(--shadow-sm)]">
        <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Live result
            </span>
            <span className="text-[11px] text-muted-foreground">{systemKw}kW · {hasBattery ? "with battery" : "no battery"} · {horizonStr} horizon</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Updates as you change inputs
          </div>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 sm:gap-5 items-center">
          {/* Now */}
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-destructive/80">Doing nothing · monthly</p>
            <div className="text-4xl sm:text-5xl font-display font-extrabold text-destructive tabular-nums leading-none mt-2">
              {formatCurrency(currentMonthlyBill)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">+ rises every year with inflation</p>
          </div>

          {/* Arrow */}
          <div className="hidden sm:flex flex-col items-center gap-1">
            <ArrowRight className="h-6 w-6 text-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">after roof</span>
          </div>

          {/* After */}
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">After Energy Roof · monthly</p>
            <div className="text-4xl sm:text-5xl font-display font-extrabold text-accent tabular-nums leading-none mt-2">
              {formatCurrency(remainingMonthly)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              You keep <span className="font-bold text-accent">{formatCurrency(offsetMonthly)}/mo</span> ({pct(result.offsetPct)} offset)
            </p>
          </div>
        </div>

        {/* % offset progress bar */}
        <div className="relative mt-5">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
            <span>Bill offset</span>
            <span className="font-bold text-foreground">{pct(result.offsetPct)} of annual bill covered</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full gradient-brand transition-all duration-700 ease-out"
              style={{ width: `${Math.min(100, result.offsetPct * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* === Live KPI grid (4 tiles, animated) === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ImpactTile
          icon={Sun}
          label="Year 1 production"
          value={result.prodYear1}
          formatter={(n) => `${formatCount(n)} kWh`}
          accent="text-warning"
          pulseKey={`${systemKw}-${hasBattery}-prod`}
        />
        <ImpactTile
          icon={Zap}
          label="Year 1 value"
          value={result.valueYear1}
          sub={`${formatCurrency(result.valueYear1Monthly)} / mo`}
          formatter={(n) => formatCurrency(n)}
          accent="text-accent"
          pulseKey={`${systemKw}-${hasBattery}-val`}
        />
        <ImpactTile
          icon={Target}
          label="% bill offset"
          value={result.offsetPct * 100}
          sub="year 1"
          formatter={(n) => `${Math.round(n)}%`}
          accent="text-primary"
          pulseKey={`${systemKw}-${hasBattery}-off`}
        />
        <ImpactTile
          icon={Shield}
          label={`Lifetime value (${horizonStr})`}
          value={result.cumulativeEnergyValue}
          formatter={(n) => formatCurrencyShort(n)}
          accent="text-primary"
          pulseKey={`${systemKw}-${hasBattery}-life`}
        />
      </div>

      {/* === Battery delta + inflation hedge === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Battery delta */}
        <div className="rounded-2xl border border-hairline bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Battery className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Battery impact</p>
                <p className="text-xs text-foreground/80">What battery storage adds</p>
              </div>
            </div>
            <div className="flex rounded-lg bg-muted/50 border border-hairline p-0.5 text-[10px] font-bold">
              <button
                onClick={() => { onSetHasBattery(false); onSetSelfConsumption(0.35); }}
                className={`px-2 py-1 rounded-md transition-all ${!hasBattery ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >No</button>
              <button
                onClick={() => { onSetHasBattery(true); onSetSelfConsumption(0.85); }}
                className={`px-2 py-1 rounded-md transition-all ${hasBattery ? "bg-card text-accent shadow-sm" : "text-muted-foreground"}`}
              >Yes</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-3 border ${hasBattery ? "border-hairline bg-muted/30" : "border-primary/30 bg-primary/5"}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">No battery</p>
              <div className="text-xl font-display font-extrabold tabular-nums mt-1">{formatCurrency(noBatteryResult.valueYear1)}</div>
              <p className="text-[10px] text-muted-foreground">/yr · {pct(noBatteryResult.offsetPct)} offset</p>
            </div>
            <div className={`rounded-xl p-3 border ${hasBattery ? "border-accent/30 bg-accent/5" : "border-hairline bg-muted/30"}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-accent">With battery</p>
              <div className="text-xl font-display font-extrabold text-accent tabular-nums mt-1">{formatCurrency(withBatteryResult.valueYear1)}</div>
              <p className="text-[10px] text-muted-foreground">/yr · {pct(withBatteryResult.offsetPct)} offset</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 px-3 py-2">
            <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
              Battery lift
            </span>
            <span className="font-display font-extrabold text-accent tabular-nums">
              +{formatCurrency(batteryLiftAnnual)}/yr · +{formatCurrencyShort(batteryLiftLifetime)} lifetime
            </span>
          </div>
        </div>

        {/* Inflation hedge gauge */}
        <div className="rounded-2xl border border-hairline bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Flame className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Inflation hedge</p>
              <p className="text-xs text-foreground/80">Exposure reduced over {horizonStr}</p>
            </div>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-4xl font-display font-extrabold text-primary tabular-nums leading-none">
                {pct(result.inflationExposureReducedPct)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">of utility spend neutralized</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-destructive">Do nothing</p>
              <div className="text-base font-bold text-destructive tabular-nums">{formatCurrencyShort(result.cumulativeDoNothing)}</div>
              <div className="flex items-center gap-1 text-[11px] mt-1 justify-end">
                <TrendingDown className="h-3 w-3 text-accent" />
                <span className="text-accent font-bold">−{formatCurrencyShort(result.cumulativeSavings)}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 h-3 rounded-full bg-muted overflow-hidden flex">
            <div
              className="h-full bg-accent transition-all duration-700"
              style={{ width: `${Math.min(100, result.inflationExposureReducedPct * 100)}%` }}
            />
            <div className="h-full bg-destructive/40 flex-1" />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
            <span>Hedged</span><span>Still exposed</span>
          </div>
        </div>
      </div>

      {/* === System size sweep comparison === */}
      <div className="rounded-2xl border border-hairline bg-muted/30 p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h4 className="text-sm font-display font-extrabold tracking-tight flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-primary" />
              System size sweep · lifetime value
            </h4>
            <p className="text-[11px] text-muted-foreground">Tap a bar to size the system</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {horizonStr} · {hasBattery ? "with battery" : "no battery"}
          </span>
        </div>
        <div className="h-48">
          <Recharts.ResponsiveContainer width="100%" height="100%">
            <Recharts.BarChart data={sizeScenarios} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <Recharts.CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <Recharts.XAxis dataKey="kw" tickFormatter={(k) => `${k}kW`} fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Recharts.YAxis tickFormatter={(v) => formatCurrencyShort(v)} fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Recharts.Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => formatCurrency(v)}
                labelFormatter={(l) => `${l}kW system`}
              />
              <Recharts.Bar
                dataKey="cumulative"
                name="Lifetime value"
                radius={[8, 8, 0, 0]}
                onClick={(d) => onSetSystemKw(d.kw)}
                cursor="pointer"
              >
                {sizeScenarios.map((s) => (
                  <Recharts.Cell
                    key={s.kw}
                    fill={s.kw === systemKw ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.25)"}
                  />
                ))}
                <Recharts.LabelList
                  dataKey="cumulative"
                  position="top"
                  formatter={(v: number) => formatCurrencyShort(v)}
                  fontSize={10}
                  fill="hsl(var(--muted-foreground))"
                />
              </Recharts.Bar>
            </Recharts.BarChart>
          </Recharts.ResponsiveContainer>
        </div>
      </div>

      {/* === Stacked composition chart: self-used $ + export $ vs annual bill === */}
      <div className="rounded-2xl border border-hairline bg-muted/30 p-5">
        <h4 className="text-sm font-display font-extrabold tracking-tight mb-3">
          Where the value comes from · self-used vs exported
        </h4>
        <div className="h-72">
          <Recharts.ResponsiveContainer width="100%" height="100%">
            <Recharts.ComposedChart data={stackedData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="billLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
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
              <Recharts.Bar dataKey="selfUsedValue" name="Self-used power $" stackId="a" fill="hsl(var(--accent))" radius={[0, 0, 0, 0]} />
              <Recharts.Bar dataKey="exportValue" name="Exported power $" stackId="a" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
              <Recharts.Line
                type="monotone"
                dataKey="annualBill"
                name="Annual bill (do nothing)"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </Recharts.ComposedChart>
          </Recharts.ResponsiveContainer>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          <span className="font-semibold text-foreground">Why this matters:</span> The green bars are power you use directly in the home — the most valuable kind, because it offsets your retail rate. The amber bars are exports — they pay less. {hasBattery
            ? "With a battery, more of your production lands in the green band."
            : "Without a battery, more shifts into the amber export band — worth less per kWh."}
          {" "}The dashed red line is the bill you'd be paying with no roof at all.
        </p>

        {/* === Exports explained === */}
        {(() => {
          const retailRate = baseInputs.rate;
          const exportRate = baseInputs.exportRate;
          const selfUsedKwh = result.selfUsedYear1;
          const exportedKwh = result.exportedYear1;
          const selfUsedValue = selfUsedKwh * retailRate;
          const exportValue = exportedKwh * exportRate;
          const totalKwh = selfUsedKwh + exportedKwh;
          const totalValue = selfUsedValue + exportValue;
          const selfUsedShare = totalKwh > 0 ? selfUsedKwh / totalKwh : 0;
          const exportShare = totalKwh > 0 ? exportedKwh / totalKwh : 0;
          const blendedRate = totalKwh > 0 ? totalValue / totalKwh : 0;
          const rateGap = retailRate - exportRate;
          const rateGapPct = retailRate > 0 ? (rateGap / retailRate) : 0;

          return (
            <div className="mt-4 rounded-2xl border border-hairline bg-card/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-warning/15 text-warning">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <h5 className="text-[12px] font-bold uppercase tracking-[0.12em] text-foreground">
                  Exports, explained
                </h5>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                When your roof produces more power than the home is using in that moment, the extra flows back to{" "}
                <span className="font-semibold text-foreground">the grid</span> — that's an <span className="font-semibold text-foreground">export</span>.
                The utility credits you for it, but at a <span className="font-semibold text-warning">lower rate</span> than what they charge you to buy power back.
              </p>

              {/* Rate gap visualization */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-accent">You buy power at</p>
                  <div className="text-xl font-display font-extrabold text-accent tabular-nums mt-1">
                    ${retailRate.toFixed(2)}<span className="text-xs font-bold">/kWh</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">retail rate · what self-used kWh saves</p>
                </div>
                <div className="rounded-xl border border-warning/30 bg-warning/5 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-warning">Utility pays you at</p>
                  <div className="text-xl font-display font-extrabold text-warning tabular-nums mt-1">
                    ${exportRate.toFixed(2)}<span className="text-xs font-bold">/kWh</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    export credit · {Math.round(rateGapPct * 100)}% less per kWh
                  </p>
                </div>
              </div>

              {/* Year 1 breakdown */}
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Your Year-1 production split
              </p>
              <div className="h-6 rounded-full bg-muted overflow-hidden flex mb-2">
                <div
                  className="h-full bg-accent flex items-center justify-center text-[10px] font-bold text-accent-foreground transition-all duration-500"
                  style={{ width: `${selfUsedShare * 100}%` }}
                  title={`Self-used: ${Math.round(selfUsedShare * 100)}%`}
                >
                  {selfUsedShare > 0.12 ? `${Math.round(selfUsedShare * 100)}%` : ""}
                </div>
                <div
                  className="h-full bg-warning flex items-center justify-center text-[10px] font-bold text-warning-foreground transition-all duration-500"
                  style={{ width: `${exportShare * 100}%` }}
                  title={`Exported: ${Math.round(exportShare * 100)}%`}
                >
                  {exportShare > 0.12 ? `${Math.round(exportShare * 100)}%` : ""}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="flex items-start gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-accent mt-1 shrink-0" />
                  <div>
                    <div className="font-bold text-foreground">Self-used in home</div>
                    <div className="text-muted-foreground">
                      {formatCount(selfUsedKwh)} kWh → <span className="font-bold text-accent">{formatCurrency(selfUsedValue)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-warning mt-1 shrink-0" />
                  <div>
                    <div className="font-bold text-foreground">Exported to grid</div>
                    <div className="text-muted-foreground">
                      {formatCount(exportedKwh)} kWh → <span className="font-bold text-warning">{formatCurrency(exportValue)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold text-foreground">
                    Blended value per kWh you produce
                  </span>
                  <span className="font-display font-extrabold text-primary tabular-nums">
                    ${blendedRate.toFixed(3)}/kWh
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                  {hasBattery ? (
                    <>
                      <span className="font-semibold text-accent">Battery is doing its job:</span> it shifts production into the home so most kWh earn the higher retail rate instead of the lower export credit. Lose the battery and the blended rate drops toward <span className="font-semibold">${exportRate.toFixed(2)}</span>.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-warning">Heads-up:</span> without a battery, more production exports during the day while the home is empty — earning the lower credit. A battery stores those kWh so the home uses them at the higher retail rate later.
                    </>
                  )}
                </p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* === Cumulative savings line === */}
      <div className="rounded-2xl border border-hairline bg-muted/30 p-5">
        <h4 className="text-sm font-display font-extrabold tracking-tight mb-3">Cumulative value · the curve bends up as rates rise</h4>
        <div className="h-56">
          <Recharts.ResponsiveContainer width="100%" height="100%">
            <Recharts.AreaChart data={result.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
              <Recharts.Area
                type="monotone"
                dataKey="energyValueCumulative"
                name="Cumulative value"
                stroke="hsl(var(--primary))"
                fill="url(#cumFill)"
                strokeWidth={3}
              />
            </Recharts.AreaChart>
          </Recharts.ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
