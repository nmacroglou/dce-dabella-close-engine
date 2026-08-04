import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  Target, TrendingUp, Users, Percent, DollarSign, Award, Shield,
  Calendar as CalendarIcon, Info, Printer, Copy, Check, Flag,
  ArrowUp, ArrowDown, Minus,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { useDeals } from "@/hooks/useDeals";
import { formatCurrency, formatCount, pctNum } from "@/lib/format";
import { StatTile } from "@/components/pipeline/StatTile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Deal } from "@/types/deal";
import {
  DAY_MS, RESOLVE_DAYS, LS_KEY, PRESETS, startOfDay, endOfDay, rangeFromPreset,
  wonValue, isPostSaleCancel, computeStats, delta, projectNIS,
  type PresetKey, type Scenario, type S,
} from "@/lib/forecast";
import {
  DeltaChip, PlanTile, AsmInput, MathStep, Row, Lever, Definition, KpiWithDelta,
  ScenarioCard, ConfidenceBand,
} from "@/components/forecast/parts";


// ─────────────────────────── component ───────────────────────────

export default function Forecast() {
  const { data: deals = [], isLoading } = useDeals();

  // Persisted UI state
  const [goal, setGoal] = useState(150_000);
  const [preset, setPreset] = useState<PresetKey>("30d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [strictLeads, setStrictLeads] = useState(false);
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [horizonDays, setHorizonDays] = useState(30);
  const [planMode, setPlanMode] = useState<"full" | "remaining">("full");
  // Plan assumption overrides — user can dial these to see "what if"
  const [ovrRet, setOvrRet] = useState<number | null>(null);
  const [ovrClose, setOvrClose] = useState<number | null>(null);
  const [ovrPitch, setOvrPitch] = useState<number | null>(null);
  const [ovrTicket, setOvrTicket] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.goal === "number") setGoal(s.goal);
        if (typeof s.preset === "string") setPreset(s.preset);
        if (typeof s.strictLeads === "boolean") setStrictLeads(s.strictLeads);
        if (s.customFrom) setCustomFrom(new Date(s.customFrom));
        if (s.customTo) setCustomTo(new Date(s.customTo));
        if (s.targetDate) setTargetDate(new Date(s.targetDate));
      }
    } catch { /* ignore */ }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        goal, preset, strictLeads,
        customFrom: customFrom?.toISOString(),
        customTo: customTo?.toISOString(),
        targetDate: targetDate?.toISOString(),
      }));
    } catch { /* ignore */ }
  }, [goal, preset, strictLeads, customFrom, customTo, targetDate]);

  const range = useMemo(() => {
    if (preset === "custom" && customFrom && customTo) {
      return { from: startOfDay(customFrom), to: endOfDay(customTo) };
    }
    return rangeFromPreset(preset);
  }, [preset, customFrom, customTo]);

  const priorRange = useMemo(() => {
    const span = range.to.getTime() - range.from.getTime();
    return { from: new Date(range.from.getTime() - span), to: new Date(range.from.getTime() - 1) };
  }, [range]);

  const stats  = useMemo(() => computeStats(deals, range.from, range.to, strictLeads), [deals, range, strictLeads]);
  const priorStats = useMemo(() => computeStats(deals, priorRange.from, priorRange.to, strictLeads), [deals, priorRange, strictLeads]);

  const goalPct = Math.min(100, (stats.nis / goal) * 100);
  const onPace = stats.nisPerMonth >= goal;
  const retentionPctDisplay = Math.round(stats.retentionRate * 100);
  const confidenceLabel: "low" | "med" | "high" =
    stats.cohortSize >= 20 ? "high" : stats.cohortSize >= 8 ? "med" : "low";
  const bandWidth = confidenceLabel === "high" ? 0.10 : confidenceLabel === "med" ? 0.20 : 0.40;

  const scenarios = useMemo(() => {
    const scale = (mult: number) => {
      const nisPerWeek = stats.nisPerWeek * mult;
      const nisPerMonth = stats.nisPerMonth * mult;
      const remaining = Math.max(0, goal - stats.nis);
      const weeksToGoal = nisPerWeek > 0 ? remaining / nisPerWeek : Infinity;
      const projectedDate = isFinite(weeksToGoal) ? new Date(Date.now() + weeksToGoal * 7 * DAY_MS) : null;
      return { nisPerWeek, nisPerMonth, weeksToGoal, projectedDate };
    };
    return {
      best: scale(1 + bandWidth),
      likely: scale(1),
      worst: scale(Math.max(0, 1 - bandWidth)),
    };
  }, [stats, goal, bandWidth]);

  // Target-date pace calculation
  const targetPace = useMemo(() => {
    if (!targetDate) return null;
    const daysRemaining = Math.max(1, Math.ceil((endOfDay(targetDate).getTime() - Date.now()) / DAY_MS));
    const weeksRemaining = daysRemaining / 7;
    const remaining = Math.max(0, goal - stats.nis);
    const requiredPerWeek = remaining / weeksRemaining;
    const gap = requiredPerWeek - stats.nisPerWeek;
    return { daysRemaining, weeksRemaining, requiredPerWeek, gap, meets: gap <= 0 };
  }, [targetDate, goal, stats]);

  const dollarsPerLead = stats.leads > 0 ? stats.pitchRate * stats.closeRate * stats.avgTicket * stats.retentionRate : 0;
  const leadsNeededForGoal = dollarsPerLead > 0 ? goal / dollarsPerLead : Infinity;
  const leadsRemaining = Math.max(0, leadsNeededForGoal - stats.leads);

  // Effective assumptions. Historical wins; then any user override; finally
  // industry-default fallbacks so the plan can always project even in a range
  // with zero closed deals. `usingDefault` flags which numbers are guessed
  // so we can warn the user in the UI.
  const DEFAULTS = { retention: 0.90, close: 0.30, pitch: 0.70, ticket: 25_000 };
  const asm = useMemo(() => {
    const pick = (ovr: number | null, hist: number, def: number) =>
      ovr !== null ? { v: ovr, def: false } : hist > 0 ? { v: hist, def: false } : { v: def, def: true };
    const r = pick(ovrRet,    stats.retentionRate, DEFAULTS.retention);
    const c = pick(ovrClose,  stats.closeRate,     DEFAULTS.close);
    const p = pick(ovrPitch,  stats.pitchRate,     DEFAULTS.pitch);
    const t = pick(ovrTicket, stats.avgTicket,     DEFAULTS.ticket);
    return {
      retention: r.v, close: c.v, pitch: p.v, ticket: t.v,
      usingDefault: { retention: r.def, close: c.def, pitch: p.def, ticket: t.def },
      anyDefault: r.def || c.def || p.def || t.def,
    };
  }, [ovrRet, ovrClose, ovrPitch, ovrTicket, stats]);


  const horizonPlan = useMemo(() => {
    const targetNIS = planMode === "remaining" ? Math.max(0, goal - stats.nis) : goal;
    const ret = asm.retention > 0 ? asm.retention : 1;
    const avgT = asm.ticket > 0 ? asm.ticket : 0;
    const pr = asm.pitch > 0 ? asm.pitch : 0;

    const calc = (closeR: number) => {
      const requiredGross = targetNIS / ret;
      const requiredWon = avgT > 0 ? requiredGross / avgT : Infinity;
      const requiredPresentations = closeR > 0 ? requiredWon / closeR : Infinity;
      const requiredLeads = pr > 0 ? requiredPresentations / pr : Infinity;
      const weeks = horizonDays / 7;
      return {
        targetNIS, requiredGross, requiredWon,
        requiredPresentations, requiredLeads,
        nisPerWeek: targetNIS / weeks,
        nisPerDay: targetNIS / horizonDays,
        leadsPerWeek: requiredLeads / weeks,
        leadsPerDay: requiredLeads / horizonDays,
        wonPerWeek: requiredWon / weeks,
        wonPerDay: requiredWon / horizonDays,
        presentationsPerWeek: requiredPresentations / weeks,
        presentationsPerDay: requiredPresentations / horizonDays,
      };
    };
    return {
      likely: calc(asm.close),
      best:   calc(asm.close * (1 + bandWidth)),
      worst:  calc(Math.max(0.0001, asm.close * (1 - bandWidth))),
      leadsPaceDelta: (pr > 0 && asm.close > 0 && avgT > 0)
        ? (calc(asm.close).leadsPerWeek - stats.leadsPerWeek)
        : 0,
      nisPaceDelta: (calc(asm.close).nisPerWeek - stats.nisPerWeek),
      feasible: targetNIS > 0 && pr > 0 && asm.close > 0 && avgT > 0,
      done: targetNIS <= 0,
      targetNIS,
    };
  }, [goal, stats, horizonDays, bandWidth, planMode, asm]);




  const rangeLabel = `${format(range.from, "MMM d, yyyy")} → ${format(range.to, "MMM d, yyyy")}`;

  const summary = useMemo(() => [
    `Goal Forecast — ${rangeLabel}`,
    ``,
    `Goal: ${formatCurrency(goal)} NIS`,
    `Progress: ${formatCurrency(stats.nis)} (${goalPct.toFixed(1)}%) — ${onPace ? "on pace" : "behind pace"}`,
    ``,
    `• Leads: ${stats.leads}${strictLeads ? " (sits only)" : ""}`,
    `• Pitch %: ${pctNum(stats.pitchRate * 100)} (${stats.pitched} of ${stats.pitchDenom})`,
    `• Close %: ${pctNum(stats.closeRate * 100)}  (Sit-to-Close, ${confidenceLabel} confidence)`,
    `• Gross Sales: ${formatCurrency(stats.gross)} (${stats.won} won, ${formatCurrency(stats.avgTicket)} avg)`,
    `• Retention: ${retentionPctDisplay}% (${stats.cancels} cancels)`,
    `• NIS: ${formatCurrency(stats.nis)}`,
    ``,
    `Pace: ${formatCurrency(stats.nisPerWeek)}/wk · ${formatCurrency(stats.nisPerMonth)}/mo`,
    `Range to goal (±${Math.round(bandWidth*100)}%): ${scenarios.best.projectedDate ? format(scenarios.best.projectedDate, "MMM d") : "—"} (best) → ${scenarios.worst.projectedDate ? format(scenarios.worst.projectedDate, "MMM d") : "—"} (worst)`,
    targetPace ? `Target ${format(targetDate!, "MMM d, yyyy")}: need ${formatCurrency(targetPace.requiredPerWeek)}/wk (${targetPace.meets ? "on track" : `short ${formatCurrency(targetPace.gap)}/wk`})` : "",
  ].filter(Boolean).join("\n"), [rangeLabel, goal, stats, goalPct, onPace, strictLeads, retentionPctDisplay, confidenceLabel, bandWidth, scenarios, targetPace, targetDate]);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(summary); setCopied(true); toast.success("Summary copied"); setTimeout(() => setCopied(false), 1500); }
    catch { toast.error("Could not copy"); }
  };
  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden"><AppHeader /></div>
      <main className="mx-auto max-w-6xl px-4 md:px-6 py-6 space-y-6 print:py-2 print:px-4" id="forecast-print">
        <header className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Target className="h-7 w-7 text-primary" /> Goal Forecast
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Live projection to your NIS goal, driven by your actual pipeline.
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 print:block hidden">
              Report generated {format(new Date(), "MMM d, yyyy · h:mm a")} · {rangeLabel}
            </p>
          </div>
          <div className="flex items-end gap-3 flex-wrap print:hidden">
            <div className="w-36">
              <Label htmlFor="goal" className="text-xs uppercase tracking-wider text-muted-foreground">NIS Goal</Label>
              <Input id="goal" type="number" value={goal}
                onChange={(e) => setGoal(Math.max(0, +e.target.value || 0))}
                className="mt-1 font-bold tabular-nums" />
            </div>
            <div className="flex flex-col">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Target Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("mt-1 h-9 gap-1.5", !targetDate && "text-muted-foreground")}>
                    <Flag className="h-3.5 w-3.5" />
                    {targetDate ? format(targetDate, "MMM d, yyyy") : "Optional"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={targetDate} onSelect={setTargetDate}
                    initialFocus className={cn("p-3 pointer-events-auto")} />
                  {targetDate && (
                    <div className="p-2 border-t border-border">
                      <Button variant="ghost" size="sm" className="w-full h-8 text-xs" onClick={() => setTargetDate(undefined)}>Clear</Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
              <Switch id="strict" checked={strictLeads} onCheckedChange={setStrictLeads} />
              <Label htmlFor="strict" className="text-xs font-bold cursor-pointer">
                Sits only
                <div className="text-[10px] font-normal text-muted-foreground">
                  {strictLeads ? "Excludes no-sits" : "All deal cards"}
                </div>
              </Label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="h-9 gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="h-9 gap-1.5">
                <Printer className="h-3.5 w-3.5" /> PDF
              </Button>
            </div>
          </div>
        </header>

        {/* Time range picker */}
        <section className="card-elevated p-4 flex flex-wrap items-center gap-2 print:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2">
            Time range
          </span>
          {PRESETS.map((p) => (
            <Button key={p.key} size="sm"
              variant={preset === p.key ? "default" : "outline"}
              onClick={() => setPreset(p.key)}
              className="h-8 text-xs font-bold">
              {p.label}
            </Button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm"
                variant={preset === "custom" ? "default" : "outline"}
                className={cn("h-8 text-xs font-bold gap-1.5", !customFrom && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {customFrom && customTo
                  ? `${format(customFrom, "MMM d")} – ${format(customTo, "MMM d")}`
                  : "Custom"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="range" selected={{ from: customFrom, to: customTo }}
                onSelect={(r) => {
                  setCustomFrom(r?.from); setCustomTo(r?.to);
                  if (r?.from && r?.to) setPreset("custom");
                }}
                numberOfMonths={2} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {rangeLabel} · {stats.spanDays}d
          </span>
        </section>

        {isLoading ? (
          <div className="text-muted-foreground text-sm">Loading your pipeline…</div>
        ) : (
          <>
            {/* KPI tiles with prior-period deltas */}
            <section className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <KpiWithDelta icon={Users} label="Lead Count" value={formatCount(stats.leads)}
                accent="text-primary" sub={`${stats.leadsPerWeek.toFixed(1)}/wk · ${strictLeads ? "sits" : "all"}`}
                d={delta(stats.leads, priorStats.leads)} />
              <KpiWithDelta icon={Percent} label="Pitch %" value={pctNum(stats.pitchRate * 100)}
                accent="text-info" sub={`${stats.pitched} of ${stats.pitchDenom}`}
                d={delta(stats.pitchRate, priorStats.pitchRate)} />
              <KpiWithDelta icon={Award} label="Close Rate" value={pctNum(stats.closeRate * 100)}
                accent="text-success" sub={`Sit-to-Close · ${confidenceLabel}`}
                d={delta(stats.closeRate, priorStats.closeRate)} />
              <KpiWithDelta icon={DollarSign} label="Gross Sales" value={formatCurrency(stats.gross)}
                accent="text-warning" sub={`${formatCurrency(stats.avgTicket)} avg`}
                d={delta(stats.gross, priorStats.gross)} />
              <KpiWithDelta icon={TrendingUp} label="NIS" value={formatCurrency(stats.nis)}
                accent="text-primary" sub={`${retentionPctDisplay}% ret.`}
                d={delta(stats.nis, priorStats.nis)} />
              <KpiWithDelta icon={Shield} label="Retention" value={`${retentionPctDisplay}%`}
                accent="text-info" sub={`${stats.cancels} cancels`}
                d={delta(stats.retentionRate, priorStats.retentionRate)} />
            </section>

            {/* Progress */}
            <section className="card-elevated p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="font-display text-xl font-bold">Progress to {formatCurrency(goal)} NIS</h2>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(stats.nis)} booked · {formatCurrency(Math.max(0, goal - stats.nis))} to go
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${onPace ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                  {onPace ? "On pace" : "Behind pace"}
                </span>
              </div>
              <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-success transition-all"
                  style={{ width: `${goalPct}%` }} />
              </div>
              <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
                <span>0</span>
                <span className="font-bold text-foreground">{goalPct.toFixed(1)}%</span>
                <span>{formatCurrency(goal)}</span>
              </div>
            </section>

            {/* Target date pace */}
            {targetPace && (
              <section className={cn(
                "card-elevated p-5 border-l-4",
                targetPace.meets ? "border-l-success" : "border-l-warning"
              )}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-display font-bold text-lg flex items-center gap-2">
                      <Flag className="h-4 w-4" /> Hit {formatCurrency(goal)} by {format(targetDate!, "MMM d, yyyy")}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {targetPace.daysRemaining} days ({targetPace.weeksRemaining.toFixed(1)} wks) remain
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Required pace</div>
                    <div className="font-display text-2xl font-extrabold tabular-nums">{formatCurrency(targetPace.requiredPerWeek)}/wk</div>
                    <div className={cn("text-xs font-bold", targetPace.meets ? "text-success" : "text-warning")}>
                      {targetPace.meets
                        ? `On track — cushion of ${formatCurrency(-targetPace.gap)}/wk`
                        : `Short ${formatCurrency(targetPace.gap)}/wk vs current pace`}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Horizon plan — next N days playbook */}
            <section className="card-elevated p-5 space-y-4 border-l-4 border-l-primary">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    Next {horizonDays} days to book {formatCurrency(horizonPlan.targetNIS)} NIS
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {planMode === "full"
                      ? `Plan assumes you're booking the full ${formatCurrency(goal)} goal inside this ${horizonDays}-day window.`
                      : `Plan subtracts the ${formatCurrency(stats.nis)} you've already booked, leaving ${formatCurrency(horizonPlan.targetNIS)} to book.`}
                  </p>
                </div>
                <div className="flex items-center gap-2 print:hidden flex-wrap">
                  <div className="flex gap-1 mr-2">
                    <Button size="sm"
                      variant={planMode === "full" ? "default" : "outline"}
                      onClick={() => setPlanMode("full")}
                      className="h-7 px-2 text-[11px] font-bold">Full goal</Button>
                    <Button size="sm"
                      variant={planMode === "remaining" ? "default" : "outline"}
                      onClick={() => setPlanMode("remaining")}
                      className="h-7 px-2 text-[11px] font-bold">Remaining</Button>
                  </div>
                  <Label htmlFor="horizon" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Horizon</Label>
                  <div className="flex gap-1">
                    {[7, 14, 30, 60, 90].map((d) => (
                      <Button key={d} size="sm"
                        variant={horizonDays === d ? "default" : "outline"}
                        onClick={() => setHorizonDays(d)}
                        className="h-7 px-2 text-[11px] font-bold">{d}d</Button>
                    ))}
                  </div>
                  <Input id="horizon" type="number" min={1} max={365} value={horizonDays}
                    onChange={(e) => setHorizonDays(Math.max(1, Math.min(365, +e.target.value || 30)))}
                    className="h-7 w-16 text-xs font-bold tabular-nums" />
                </div>
              </div>

              {horizonPlan.done ? (
                <div className="rounded-lg bg-success/10 text-success p-3 text-sm font-bold">
                  Goal already hit — nothing left to book in this window.
                </div>
              ) : (
                <>
                  {asm.anyDefault && (
                    <div className="rounded-lg bg-warning/10 text-warning p-3 text-xs space-y-1">
                      <div className="font-bold">Using industry defaults for missing history</div>
                      <div>
                        Your selected range doesn't have enough closed deals to derive{" "}
                        {[
                          asm.usingDefault.pitch    ? "Pitch %"   : null,
                          asm.usingDefault.close    ? "Close %"   : null,
                          asm.usingDefault.ticket   ? "Avg Ticket": null,
                          asm.usingDefault.retention? "Retention" : null,
                        ].filter(Boolean).join(", ")}. Widen the date range above, or edit the assumptions
                        below — the plan updates instantly.
                      </div>
                    </div>
                  )}
                  <div className="grid gap-3 md:grid-cols-5 grid-cols-2">
                    <PlanTile label="NIS to book"
                      value={formatCurrency(horizonPlan.likely.targetNIS)}
                      sub={`${formatCurrency(horizonPlan.likely.nisPerWeek)}/wk · ${formatCurrency(horizonPlan.likely.nisPerDay)}/day`}
                      accent="text-primary" />
                    <PlanTile label="Gross to sell"
                      value={formatCurrency(horizonPlan.likely.requiredGross)}
                      sub={`÷ ${Math.round(asm.retention * 100)}% retention`}
                      accent="text-warning" />
                    <PlanTile label="Deals to win"
                      value={isFinite(horizonPlan.likely.requiredWon) ? formatCount(Math.ceil(horizonPlan.likely.requiredWon)) : "—"}
                      sub={`÷ ${formatCurrency(asm.ticket)} avg ticket`}
                      accent="text-success" />
                    <PlanTile label="Sits to run"
                      value={isFinite(horizonPlan.likely.requiredPresentations) ? formatCount(Math.ceil(horizonPlan.likely.requiredPresentations)) : "—"}
                      sub={`÷ ${pctNum(asm.close * 100)} close rate`}
                      accent="text-info" />
                    <PlanTile label="Leads needed"
                      value={isFinite(horizonPlan.likely.requiredLeads) ? formatCount(Math.ceil(horizonPlan.likely.requiredLeads)) : "—"}
                      sub={`÷ ${pctNum(asm.pitch * 100)} pitch rate`}
                      accent="text-primary" />
                  </div>

                  {/* Editable assumptions */}
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2 print:hidden">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="font-bold text-foreground text-[11px] uppercase tracking-wider">
                        Plan assumptions <span className="text-muted-foreground font-normal normal-case">— tweak to see what changes</span>
                      </div>
                      {(ovrRet !== null || ovrClose !== null || ovrPitch !== null || ovrTicket !== null) && (
                        <Button size="sm" variant="ghost" className="h-6 text-[10px]"
                          onClick={() => { setOvrRet(null); setOvrClose(null); setOvrPitch(null); setOvrTicket(null); }}>
                          Reset to historical
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <AsmInput label="Retention %" suffix="%"
                        value={Math.round(asm.retention * 1000) / 10}
                        placeholder={`${Math.round(stats.retentionRate * 100)}`}
                        overridden={ovrRet !== null}
                        onChange={(v) => setOvrRet(v === null ? null : Math.max(0, Math.min(100, v)) / 100)} />
                      <AsmInput label="Close Rate %" suffix="%"
                        value={Math.round(asm.close * 1000) / 10}
                        placeholder={`${Math.round(stats.closeRate * 100)}`}
                        overridden={ovrClose !== null}
                        onChange={(v) => setOvrClose(v === null ? null : Math.max(0, Math.min(100, v)) / 100)} />
                      <AsmInput label="Pitch Rate %" suffix="%"
                        value={Math.round(asm.pitch * 1000) / 10}
                        placeholder={`${Math.round(stats.pitchRate * 100)}`}
                        overridden={ovrPitch !== null}
                        onChange={(v) => setOvrPitch(v === null ? null : Math.max(0, Math.min(100, v)) / 100)} />
                      <AsmInput label="Avg Ticket $" suffix="$"
                        value={Math.round(asm.ticket)}
                        placeholder={`${Math.round(stats.avgTicket)}`}
                        overridden={ovrTicket !== null}
                        onChange={(v) => setOvrTicket(v === null ? null : Math.max(0, v))} />
                    </div>
                    {stats.cancels + stats.won < 5 && (
                      <p className="text-[10px] text-warning">
                        Heads up: your retention is based on only {stats.won + stats.cancels} sold/cancelled deal(s) in range.
                        With {stats.cancels} cancel(s) vs {stats.won} sale(s), the formula says Gross = NIS ÷ Retention.
                        If you expect fewer cancels going forward, set Retention to something like 90–100% above.
                      </p>
                    )}
                  </div>

                  {/* Plain-english math walkthrough */}
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2 text-xs">
                    <div className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">
                      The math, step by step
                    </div>
                    <MathStep n={1} label="Start with NIS target"
                      calc={formatCurrency(horizonPlan.targetNIS)}
                      note={planMode === "full" ? "your full goal" : `${formatCurrency(goal)} goal − ${formatCurrency(stats.nis)} already booked`} />
                    <MathStep n={2} label="÷ Retention → Gross sales needed"
                      calc={`${formatCurrency(horizonPlan.targetNIS)} ÷ ${Math.round(asm.retention * 100)}% = ${formatCurrency(horizonPlan.likely.requiredGross)}`}
                      note={asm.retention < 1 ? `you have to sell more than ${formatCurrency(horizonPlan.targetNIS)} because ~${Math.round((1-asm.retention)*100)}% cancels after signing` : "no cancels assumed — gross = NIS"} />
                    <MathStep n={3} label="÷ Avg Ticket → Deals to win"
                      calc={`${formatCurrency(horizonPlan.likely.requiredGross)} ÷ ${formatCurrency(asm.ticket)} = ${isFinite(horizonPlan.likely.requiredWon) ? Math.ceil(horizonPlan.likely.requiredWon) : "—"} deals`}
                      note="how many contracts you have to sign" />
                    <MathStep n={4} label="÷ Close Rate → Sits to run"
                      calc={`${isFinite(horizonPlan.likely.requiredWon) ? Math.ceil(horizonPlan.likely.requiredWon) : "—"} ÷ ${pctNum(asm.close * 100)} = ${isFinite(horizonPlan.likely.requiredPresentations) ? Math.ceil(horizonPlan.likely.requiredPresentations) : "—"} presentations`}
                      note="full pitches you need to deliver" />
                    <MathStep n={5} label="÷ Pitch Rate → Leads to run"
                      calc={`${isFinite(horizonPlan.likely.requiredPresentations) ? Math.ceil(horizonPlan.likely.requiredPresentations) : "—"} ÷ ${pctNum(asm.pitch * 100)} = ${isFinite(horizonPlan.likely.requiredLeads) ? Math.ceil(horizonPlan.likely.requiredLeads) : "—"} leads`}
                      note={`over ${horizonDays} days = ${horizonPlan.likely.leadsPerWeek.toFixed(1)}/wk`} />
                  </div>


                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs space-y-1.5">
                    <div className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">
                      Confidence range on leads needed (±{Math.round(bandWidth * 100)}% on close rate)
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded border border-success/40 bg-success/5 p-2">
                        <div className="text-[10px] font-bold uppercase text-muted-foreground">Best</div>
                        <div className="font-display font-extrabold tabular-nums text-sm">
                          {isFinite(horizonPlan.best.requiredLeads) ? formatCount(Math.ceil(horizonPlan.best.requiredLeads)) : "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground tabular-nums">
                          {horizonPlan.best.leadsPerWeek.toFixed(1)}/wk
                        </div>
                      </div>
                      <div className="rounded border border-primary/40 bg-primary/5 p-2">
                        <div className="text-[10px] font-bold uppercase text-muted-foreground">Likely</div>
                        <div className="font-display font-extrabold tabular-nums text-sm">
                          {isFinite(horizonPlan.likely.requiredLeads) ? formatCount(Math.ceil(horizonPlan.likely.requiredLeads)) : "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground tabular-nums">
                          {horizonPlan.likely.leadsPerWeek.toFixed(1)}/wk
                        </div>
                      </div>
                      <div className="rounded border border-destructive/40 bg-destructive/5 p-2">
                        <div className="text-[10px] font-bold uppercase text-muted-foreground">Worst</div>
                        <div className="font-display font-extrabold tabular-nums text-sm">
                          {isFinite(horizonPlan.worst.requiredLeads) ? formatCount(Math.ceil(horizonPlan.worst.requiredLeads)) : "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground tabular-nums">
                          {horizonPlan.worst.leadsPerWeek.toFixed(1)}/wk
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "rounded-lg p-3 text-xs font-bold flex items-center justify-between gap-2",
                    horizonPlan.nisPaceDelta <= 0 ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
                  )}>
                    <span>
                      {horizonPlan.nisPaceDelta <= 0
                        ? `On pace — current ${formatCurrency(stats.nisPerWeek)}/wk beats required ${formatCurrency(horizonPlan.likely.nisPerWeek)}/wk`
                        : `Need to add ${formatCurrency(horizonPlan.nisPaceDelta)}/wk NIS · ${horizonPlan.leadsPaceDelta > 0 ? `≈ ${horizonPlan.leadsPaceDelta.toFixed(1)} more leads/wk` : "same lead volume, better conversion"}`}
                    </span>
                  </div>
                </>
              )}
            </section>




            {/* Forecasts */}
            <section className="grid gap-4 md:grid-cols-2">
              <div className="card-elevated p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" /> Time-based forecast
                  </h3>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    confidenceLabel === "high" && "bg-success/15 text-success",
                    confidenceLabel === "med" && "bg-warning/15 text-warning",
                    confidenceLabel === "low" && "bg-destructive/15 text-destructive",
                  )} title={`Cohort of ${stats.cohortSize} · band ±${Math.round(bandWidth * 100)}%`}>
                    {confidenceLabel} confidence · ±{Math.round(bandWidth * 100)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Current pace: <b className="text-foreground">{formatCurrency(stats.nisPerWeek)}/wk</b>{" "}
                  ({formatCurrency(stats.nisPerMonth)}/mo NIS)
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <ScenarioCard tone="worst" label="Worst" sc={scenarios.worst} />
                  <ScenarioCard tone="likely" label="Likely" sc={scenarios.likely} />
                  <ScenarioCard tone="best" label="Best" sc={scenarios.best} />
                </div>
                <ConfidenceBand best={scenarios.best} worst={scenarios.worst} likely={scenarios.likely} />
                <ul className="text-sm space-y-2 pt-1">
                  <Row label="Monthly gap vs goal (likely)" value={formatCurrency(Math.max(0, goal - stats.nisPerMonth))} />
                  <Row label="NIS range / mo" value={`${formatCurrency(scenarios.worst.nisPerMonth)} – ${formatCurrency(scenarios.best.nisPerMonth)}`} />
                </ul>
              </div>

              <div className="card-elevated p-5 space-y-3">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Lead-based forecast
                </h3>
                <p className="text-sm text-muted-foreground">
                  Each lead is worth <b className="text-foreground">{formatCurrency(dollarsPerLead)}</b> in NIS at
                  your current pitch × close × ticket × retention.
                </p>
                <ul className="text-sm space-y-2">
                  <Row label="Leads needed for goal" value={isFinite(leadsNeededForGoal) ? formatCount(Math.ceil(leadsNeededForGoal)) : "—"} />
                  <Row label="Leads remaining" value={isFinite(leadsRemaining) ? formatCount(Math.ceil(leadsRemaining)) : "—"} />
                  <Row label="Weeks of leads at current pace" value={stats.leadsPerWeek > 0 && isFinite(leadsRemaining) ? `${(leadsRemaining / stats.leadsPerWeek).toFixed(1)} wks` : "—"} />
                </ul>
              </div>
            </section>

            {/* What-if levers */}
            <section className="card-elevated p-5 space-y-3">
              <h3 className="font-display font-bold text-lg">What would move the needle?</h3>
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <Lever label="+10% Close Rate" before={stats.nis}
                  after={projectNIS(stats, { close: stats.closeRate + 0.1 })} goal={goal} />
                <Lever label="+25% Pitch Rate" before={stats.nis}
                  after={projectNIS(stats, { pitch: Math.min(1, stats.pitchRate * 1.25) })} goal={goal} />
                <Lever label="+10 More Leads" before={stats.nis}
                  after={projectNIS(stats, { extraLeads: 10 })} goal={goal} />
              </div>
            </section>

            {/* Definitions */}
            <section className="card-elevated p-5 space-y-4 break-inside-avoid">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" /> How these numbers are calculated
              </h3>
              <p className="text-xs text-muted-foreground">
                Date basis: <b className="text-foreground">created_at</b> for leads/pitch (activity), <b className="text-foreground">closed_at</b> for wins/losses/gross/NIS (outcomes).
                All numbers are scoped to your rep view and the selected time range. Prior-period arrows compare the previous {stats.spanDays}-day window.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <Definition icon={Users} label="Lead Count" accent="text-primary"
                  formula={strictLeads
                    ? "count(deals where isSit(d) AND created_at ∈ range) · isSit = past inspecting or was_demoed/was_presented"
                    : "count(deals where created_at ∈ range)"}
                  plain={strictLeads
                    ? "Only counts leads that actually became a sit — any deal past the inspecting stage or explicitly flagged demoed/presented."
                    : "Every deal card created in the range, regardless of stage or outcome. Matches Workday's 'leads assigned'."}
                  live={`= ${formatCount(stats.leads)} leads`} />
                <Definition icon={Percent} label="Pitch %" accent="text-info"
                  formula={strictLeads ? "pitched ÷ leads (denom already clean)" : "pitched ÷ (leads − disqualified)"}
                  plain="Of the qualified leads, the share that got a full presentation (was_presented true, or stage past presented)."
                  live={`${stats.pitched} ÷ ${stats.pitchDenom} = ${pctNum(stats.pitchRate * 100)}`} />
                <Definition icon={Award} label="Close Rate (Sit-to-Close)" accent="text-success"
                  formula="cohort_wins ÷ cohort_size · cohort = presentations won/lost OR stuck ≥ 14 days"
                  plain="Matches the Dashboard. Still-deciding deals are excluded so a hot week doesn't inflate small samples."
                  live={`${stats.cohortWon} ÷ ${stats.cohortSize} = ${pctNum(stats.closeRate * 100)}  ·  ${stats.stillDeciding} still deciding  ·  ${confidenceLabel} conf.`} />
                <Definition icon={DollarSign} label="Gross Sales" accent="text-warning"
                  formula="sum(price(d)) for won where closed_at ∈ range · price = closed_amount ?? price[selected] ?? max(A/B/C)"
                  plain="Contract value of every won deal that closed in the range. Uses the option price when closed_amount is blank."
                  live={`${stats.won} won · avg ${formatCurrency(stats.avgTicket)} · total ${formatCurrency(stats.gross)}`} />
                <Definition icon={Shield} label="Retention %" accent="text-info"
                  formula="won ÷ (won + cancels) · cancels = disqualified with selected_option / demo / $"
                  plain="Computed from data — a deal that made it to a sale but later ended in disqualified is treated as a cancel."
                  live={`${stats.won} ÷ (${stats.won} + ${stats.cancels}) = ${retentionPctDisplay}%`} />
                <Definition icon={TrendingUp} label="NIS (Net Installed Sales)" accent="text-primary"
                  formula="Gross Sales × Retention %"
                  plain="What actually installs after cancellations — what counts toward your goal and commission tiers."
                  live={`${formatCurrency(stats.gross)} × ${retentionPctDisplay}% = ${formatCurrency(stats.nis)}`} />
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                <b className="text-foreground">Forecast math:</b> $ / lead = Pitch % × Close % × Avg Ticket × Retention.
                Leads needed = Goal ÷ ($ / lead). Weeks to goal = (Goal − NIS) ÷ NIS per week.
                Confidence bands scale close rate by ±{Math.round(bandWidth * 100)}% (high=±10, med=±20, low=±40) based on cohort size.
              </div>
            </section>
          </>
        )}
      </main>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: letter; margin: 0.5in; }
          body { background: white !important; }
          .card-elevated { box-shadow: none !important; border: 1px solid #ddd !important; break-inside: avoid; }
          button, .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────── sub-components ───────────────────────────

