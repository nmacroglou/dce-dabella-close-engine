import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Target, TrendingUp, Users, Percent, DollarSign, Award, Shield, Calendar as CalendarIcon, Info,
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
import type { Deal } from "@/types/deal";

const DAY_MS = 86_400_000;
const RESOLVE_DAYS = 14;

type PresetKey = "7d" | "30d" | "90d" | "mtd" | "qtd" | "ytd" | "all" | "custom";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "7d", label: "Last 7d" },
  { key: "30d", label: "Last 30d" },
  { key: "90d", label: "Last 90d" },
  { key: "mtd", label: "MTD" },
  { key: "qtd", label: "QTD" },
  { key: "ytd", label: "YTD" },
  { key: "all", label: "All time" },
];

function rangeFromPreset(key: PresetKey): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(to);
  switch (key) {
    case "7d": from.setDate(to.getDate() - 7); break;
    case "30d": from.setDate(to.getDate() - 30); break;
    case "90d": from.setDate(to.getDate() - 90); break;
    case "mtd": from.setFullYear(to.getFullYear(), to.getMonth(), 1); from.setHours(0, 0, 0, 0); break;
    case "qtd": {
      const q = Math.floor(to.getMonth() / 3) * 3;
      from.setFullYear(to.getFullYear(), q, 1); from.setHours(0, 0, 0, 0); break;
    }
    case "ytd": from.setFullYear(to.getFullYear(), 0, 1); from.setHours(0, 0, 0, 0); break;
    case "all":
    case "custom":
      from.setFullYear(2000, 0, 1); from.setHours(0, 0, 0, 0); break;
  }
  return { from, to };
}

/** Won-deal contract value: closed_amount first, then selected option price, then largest of A/B/C. */
function wonValue(d: Deal): number {
  if (d.closed_amount && d.closed_amount > 0) return d.closed_amount;
  const opt = d.selected_option;
  const optPrice =
    opt === "A" ? d.price_a : opt === "B" ? d.price_b : opt === "C" ? d.price_c : null;
  if (optPrice && optPrice > 0) return optPrice;
  return Math.max(d.price_a ?? 0, d.price_b ?? 0, d.price_c ?? 0);
}

/** A cancel proxy: deal ended in disqualified but had gotten far enough to pick an option
 *  (or had a contract value on it). Those are the ones that were effectively sold-then-lost. */
function isPostSaleCancel(d: Deal): boolean {
  return d.stage === "disqualified" && (
    !!d.selected_option || (d.closed_amount ?? 0) > 0 || d.was_demoed
  );
}

export default function Forecast() {
  const { data: deals = [], isLoading } = useDeals();
  const [goal, setGoal] = useState(150_000);
  const [preset, setPreset] = useState<PresetKey>("30d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  /** Strict lead = deals with was_demoed (real sit). Off = every deal card created. */
  const [strictLeads, setStrictLeads] = useState(true);

  const range = useMemo(() => {
    if (preset === "custom" && customFrom && customTo) return { from: customFrom, to: customTo };
    return rangeFromPreset(preset);
  }, [preset, customFrom, customTo]);

  const stats = useMemo(() => {
    const fromMs = range.from.getTime();
    const toMs = range.to.getTime();
    const inRangeCreated = (d: Deal) => {
      const t = d.created_at ? new Date(d.created_at).getTime() : 0;
      return t >= fromMs && t <= toMs;
    };
    const inRangeClosed = (d: Deal) => {
      const t = d.closed_at ? new Date(d.closed_at).getTime() : 0;
      return t >= fromMs && t <= toMs;
    };

    // Leads: created_at based; strict mode requires was_demoed = true (a real sit).
    const allCreated = deals.filter(inRangeCreated);
    const leadDeals = strictLeads ? allCreated.filter((d) => d.was_demoed) : allCreated;
    const leads = leadDeals.length;
    const pitched = leadDeals.filter((d) => d.was_presented).length;
    const dqInRange = allCreated.filter((d) => d.stage === "disqualified").length;
    const pitchDenom = Math.max(0, leads - (strictLeads ? 0 : dqInRange));
    const pitchRate = pitchDenom > 0 ? pitched / pitchDenom : 0;

    // Wins & losses: closed_at based.
    const wonInWin = deals.filter((d) => d.stage === "won" && inRangeClosed(d));
    const lostInWin = deals.filter((d) => d.stage === "lost" && inRangeClosed(d));

    // Sit-to-Close cohort (mirrors Dashboard): every presentation created in range that
    // has had ≥14 days to resolve, or is already won/lost.
    const now = Date.now();
    const resolveCutoff = now - RESOLVE_DAYS * DAY_MS;
    const presentationsInWin = allCreated.filter(
      (d) => d.stage === "presented" || d.stage === "follow_up" || d.stage === "won" || d.stage === "lost",
    );
    const cohort = presentationsInWin.filter((d) => {
      if (d.stage === "won" || d.stage === "lost") return true;
      return new Date(d.stage_changed_at).getTime() <= resolveCutoff;
    });
    const cohortWon = cohort.filter((d) => d.stage === "won").length;
    const closeRate = cohort.length > 0 ? cohortWon / cohort.length : 0;
    const stillDeciding = presentationsInWin.length - cohort.length;

    // Gross uses the option-price fallback.
    const gross = wonInWin.reduce((s, d) => s + wonValue(d), 0);
    const avgTicket = wonInWin.length > 0 ? gross / wonInWin.length : 0;

    // Retention: computed from data. Cancels = disqualified deals in range (by created_at)
    // that had actually been sold (option picked / demoed / had a $ amount).
    const cancels = allCreated.filter(isPostSaleCancel).length;
    const soldOrCancelled = wonInWin.length + cancels;
    const retentionRate = soldOrCancelled > 0 ? wonInWin.length / soldOrCancelled : 1;
    const nis = gross * retentionRate;

    const spanEnd = Math.min(now, toMs);
    const spanDays = Math.max(1, Math.ceil((spanEnd - fromMs) / DAY_MS));
    const weeksActive = spanDays / 7;
    const monthsActive = spanDays / 30;

    const leadsPerWeek = leads / weeksActive;
    const nisPerWeek = nis / weeksActive;
    const nisPerMonth = nis / monthsActive;

    const remaining = Math.max(0, goal - nis);
    const weeksToGoal = nisPerWeek > 0 ? remaining / nisPerWeek : Infinity;

    const dollarsPerLead =
      leads > 0 ? pitchRate * closeRate * avgTicket * retentionRate : 0;
    const leadsNeededForGoal = dollarsPerLead > 0 ? goal / dollarsPerLead : Infinity;
    const leadsRemaining = Math.max(0, leadsNeededForGoal - leads);

    return {
      leads, pitched, pitchDenom, dqInRange,
      won: wonInWin.length, lost: lostInWin.length,
      cohortSize: cohort.length, cohortWon, stillDeciding,
      gross, avgTicket, cancels, retentionRate, nis,
      pitchRate, closeRate,
      spanDays, weeksActive, monthsActive,
      leadsPerWeek, nisPerWeek, nisPerMonth,
      remaining, weeksToGoal, dollarsPerLead, leadsNeededForGoal, leadsRemaining,
    };
  }, [deals, goal, range, strictLeads]);

  const goalPct = Math.min(100, (stats.nis / goal) * 100);
  const onPace = stats.nisPerMonth >= goal;
  const retentionPctDisplay = Math.round(stats.retentionRate * 100);
  const confidenceLabel: "low" | "med" | "high" =
    stats.cohortSize >= 20 ? "high" : stats.cohortSize >= 8 ? "med" : "low";

  // Confidence band: smaller cohort → wider swing on close rate.
  // High = ±10%, Med = ±20%, Low = ±40% (multiplicative on close rate).
  const bandWidth = confidenceLabel === "high" ? 0.10 : confidenceLabel === "med" ? 0.20 : 0.40;
  const scenarios = (() => {
    const scale = (mult: number) => {
      const close = Math.max(0, Math.min(1, stats.closeRate * mult));
      // NIS scales linearly with close rate in our forecast model.
      const nisPerWeek = stats.nisPerWeek * mult;
      const nisPerMonth = stats.nisPerMonth * mult;
      const remaining = Math.max(0, goal - stats.nis);
      const weeksToGoal = nisPerWeek > 0 ? remaining / nisPerWeek : Infinity;
      const projectedDate = isFinite(weeksToGoal)
        ? new Date(Date.now() + weeksToGoal * 7 * DAY_MS)
        : null;
      return { close, nisPerWeek, nisPerMonth, weeksToGoal, projectedDate };
    };
    return {
      best: scale(1 + bandWidth),
      likely: scale(1),
      worst: scale(Math.max(0, 1 - bandWidth)),
    };
  })();


  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 md:px-6 py-6 space-y-6">
        <header className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Target className="h-7 w-7 text-primary" /> Goal Forecast
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Live projection to your NIS goal, driven by your actual pipeline.
            </p>
          </div>
          <div className="flex items-end gap-4 flex-wrap">
            <div className="w-40">
              <Label htmlFor="goal" className="text-xs uppercase tracking-wider text-muted-foreground">NIS Goal</Label>
              <Input
                id="goal"
                type="number"
                value={goal}
                onChange={(e) => setGoal(Math.max(0, +e.target.value || 0))}
                className="mt-1 font-bold tabular-nums"
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
              <Switch id="strict" checked={strictLeads} onCheckedChange={setStrictLeads} />
              <Label htmlFor="strict" className="text-xs font-bold cursor-pointer">
                Strict Leads
                <div className="text-[10px] font-normal text-muted-foreground">
                  {strictLeads ? "Only demoed sits count" : "Every deal card counts"}
                </div>
              </Label>
            </div>
          </div>
        </header>

        {/* Time range picker */}
        <section className="card-elevated p-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2">
            Time range
          </span>
          {PRESETS.map((p) => (
            <Button
              key={p.key}
              size="sm"
              variant={preset === p.key ? "default" : "outline"}
              onClick={() => setPreset(p.key)}
              className="h-8 text-xs font-bold"
            >
              {p.label}
            </Button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant={preset === "custom" ? "default" : "outline"}
                className={cn("h-8 text-xs font-bold gap-1.5", !customFrom && "text-muted-foreground")}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {customFrom && customTo
                  ? `${format(customFrom, "MMM d")} – ${format(customTo, "MMM d")}`
                  : "Custom"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: customFrom, to: customTo }}
                onSelect={(r) => {
                  setCustomFrom(r?.from);
                  setCustomTo(r?.to);
                  if (r?.from && r?.to) setPreset("custom");
                }}
                numberOfMonths={2}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {format(range.from, "MMM d, yyyy")} → {format(range.to, "MMM d, yyyy")} · {stats.spanDays}d
          </span>
        </section>

        {isLoading ? (
          <div className="text-muted-foreground text-sm">Loading your pipeline…</div>
        ) : (
          <>
            <section className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <StatTile icon={Users} label="Lead Count" value={formatCount(stats.leads)} accent="text-primary" sub={`${stats.leadsPerWeek.toFixed(1)}/wk · ${strictLeads ? "sits" : "all"}`} />
              <StatTile icon={Percent} label="Pitch %" value={pctNum(stats.pitchRate * 100)} accent="text-info" sub={`${stats.pitched} of ${stats.pitchDenom}`} />
              <StatTile icon={Award} label="Close Rate" value={pctNum(stats.closeRate * 100)} accent="text-success" sub={`Sit-to-Close · ${confidenceLabel}`} />
              <StatTile icon={DollarSign} label="Gross Sales" value={formatCurrency(stats.gross)} accent="text-warning" sub={`${formatCurrency(stats.avgTicket)} avg`} />
              <StatTile icon={TrendingUp} label="NIS" value={formatCurrency(stats.nis)} accent="text-primary" sub={`${retentionPctDisplay}% ret.`} />
              <StatTile icon={Shield} label="Retention" value={`${retentionPctDisplay}%`} accent="text-info" sub={`${stats.cancels} cancels`} />
            </section>

            <section className="card-elevated p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="font-display text-xl font-bold">Progress to {formatCurrency(goal)} NIS</h2>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(stats.nis)} booked · {formatCurrency(stats.remaining)} to go
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${onPace ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                  {onPace ? "On pace" : "Behind pace"}
                </span>
              </div>
              <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-success transition-all" style={{ width: `${goalPct}%` }} />
              </div>
              <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
                <span>0</span>
                <span className="font-bold text-foreground">{goalPct.toFixed(1)}%</span>
                <span>{formatCurrency(goal)}</span>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="card-elevated p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" /> Time-based forecast
                  </h3>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      confidenceLabel === "high" && "bg-success/15 text-success",
                      confidenceLabel === "med" && "bg-warning/15 text-warning",
                      confidenceLabel === "low" && "bg-destructive/15 text-destructive",
                    )}
                    title={`Cohort of ${stats.cohortSize} · band ±${Math.round(bandWidth * 100)}%`}
                  >
                    {confidenceLabel} confidence · ±{Math.round(bandWidth * 100)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Current pace: <b className="text-foreground">{formatCurrency(stats.nisPerWeek)}/wk</b>{" "}
                  ({formatCurrency(stats.nisPerMonth)}/mo NIS)
                </p>

                {/* Confidence band scenarios */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <ScenarioCard tone="worst" label="Worst" sc={scenarios.worst} />
                  <ScenarioCard tone="likely" label="Likely" sc={scenarios.likely} />
                  <ScenarioCard tone="best" label="Best" sc={scenarios.best} />
                </div>

                {/* Visual band bar */}
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
                  Each lead is worth <b className="text-foreground">{formatCurrency(stats.dollarsPerLead)}</b> in NIS at
                  your current pitch × close × ticket × retention.
                </p>
                <ul className="text-sm space-y-2">
                  <Row label="Leads needed for goal" value={isFinite(stats.leadsNeededForGoal) ? formatCount(Math.ceil(stats.leadsNeededForGoal)) : "—"} />
                  <Row label="Leads remaining" value={isFinite(stats.leadsRemaining) ? formatCount(Math.ceil(stats.leadsRemaining)) : "—"} />
                  <Row label="Weeks of leads at current pace" value={stats.leadsPerWeek > 0 && isFinite(stats.leadsRemaining) ? `${(stats.leadsRemaining / stats.leadsPerWeek).toFixed(1)} wks` : "—"} />
                </ul>
              </div>
            </section>

            <section className="card-elevated p-5 space-y-3">
              <h3 className="font-display font-bold text-lg">What would move the needle?</h3>
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <Lever label="+10% Close Rate" before={stats.nis} after={projectNIS(stats, { close: stats.closeRate + 0.1 })} goal={goal} />
                <Lever label="+25% Pitch Rate" before={stats.nis} after={projectNIS(stats, { pitch: Math.min(1, stats.pitchRate * 1.25) })} goal={goal} />
                <Lever label="+10 More Leads" before={stats.nis} after={projectNIS(stats, { extraLeads: 10 })} goal={goal} />
              </div>
            </section>

            <section className="card-elevated p-5 space-y-4">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" /> How these numbers are calculated
              </h3>
              <p className="text-xs text-muted-foreground">
                Date basis: <b className="text-foreground">created_at</b> for leads/pitch, <b className="text-foreground">closed_at</b> for wins/losses/gross/NIS.
                All numbers are scoped to your rep view and the selected time range.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <Definition
                  icon={Users} label="Lead Count" accent="text-primary"
                  formula={strictLeads
                    ? "count(deals where was_demoed = true AND created_at ∈ range)"
                    : "count(deals where created_at ∈ range)"}
                  plain={strictLeads
                    ? "Only counts real sits — deals where a demo actually happened. Toggle 'Strict Leads' off to include every deal card."
                    : "Every deal card created in the range, regardless of stage or outcome."}
                  live={`= ${formatCount(stats.leads)} leads`}
                />
                <Definition
                  icon={Percent} label="Pitch %" accent="text-info"
                  formula={strictLeads
                    ? "pitched ÷ leads   (leads already exclude no-sits)"
                    : "pitched ÷ (leads − disqualified)   — bad leads removed from denom"}
                  plain="Of the qualified leads, the share that got a full presentation (was_presented = true)."
                  live={`${stats.pitched} ÷ ${stats.pitchDenom} = ${pctNum(stats.pitchRate * 100)}`}
                />
                <Definition
                  icon={Award} label="Close Rate (Sit-to-Close)" accent="text-success"
                  formula="cohort_wins ÷ cohort_size · cohort = presentations that are won/lost OR stuck in follow-up ≥ 14 days"
                  plain="Industry-standard Sit-to-Close, matching the Dashboard. Deals still deciding are excluded so a hot week doesn't inflate the number on tiny sample sizes."
                  live={`${stats.cohortWon} ÷ ${stats.cohortSize} = ${pctNum(stats.closeRate * 100)}  ·  ${stats.stillDeciding} still deciding  ·  confidence: ${confidenceLabel}`}
                />
                <Definition
                  icon={DollarSign} label="Gross Sales" accent="text-warning"
                  formula="sum(price(d)) for won deals where closed_at ∈ range · price = closed_amount ?? price[selected_option] ?? max(price_a,b,c)"
                  plain="Contract value of every won deal that closed in the range. Falls back to the selected option's price if closed_amount was left blank."
                  live={`${stats.won} won · avg ${formatCurrency(stats.avgTicket)} · total ${formatCurrency(stats.gross)}`}
                />
                <Definition
                  icon={Shield} label="Retention %" accent="text-info"
                  formula="won ÷ (won + cancels)   · cancels = disqualified deals that had a selected_option / demo / $ amount"
                  plain="Computed from data — a deal that made it to a sale but later ended in 'disqualified' is treated as a cancellation. Once a proper cancelled flag exists on deals, this will get more exact."
                  live={`${stats.won} won ÷ (${stats.won} won + ${stats.cancels} cancels) = ${retentionPctDisplay}%`}
                />
                <Definition
                  icon={TrendingUp} label="NIS (Net Installed Sales)" accent="text-primary"
                  formula="Gross Sales × Retention %"
                  plain="What actually installs after cancellations — this is what counts toward your goal and commission tiers."
                  live={`${formatCurrency(stats.gross)} × ${retentionPctDisplay}% = ${formatCurrency(stats.nis)}`}
                />
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                <b className="text-foreground">Forecast math:</b> $ / lead = Pitch % × Close % × Avg Ticket × Retention.
                Leads needed = Goal ÷ ($ / lead). Weeks to goal = (Goal − NIS) ÷ NIS per week, where NIS per week = NIS ÷ (days in range ÷ 7).
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between border-b border-border/50 pb-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </li>
  );
}

function Lever({ label, before, after, goal }: { label: string; before: number; after: number; goal: number }) {
  const delta = after - before;
  const pctOfGoal = (after / goal) * 100;
  return (
    <div className="rounded-xl border border-border/60 p-3 bg-muted/30">
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-extrabold tabular-nums">{formatCurrency(after)}</div>
      <div className="text-xs text-success font-bold">+{formatCurrency(delta)}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{pctOfGoal.toFixed(0)}% of goal</div>
    </div>
  );
}

function Definition({
  icon: Icon, label, accent, formula, plain, live,
}: {
  icon: React.ElementType; label: string; accent: string;
  formula: string; plain: string; live: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg bg-muted/70", accent)}>
          <Icon className={cn("h-3.5 w-3.5", accent)} />
        </span>
        <h4 className="font-display font-bold text-sm">{label}</h4>
      </div>
      <code className="block text-[11px] font-mono bg-background/60 border border-border/40 rounded px-2 py-1.5 text-foreground/90 overflow-x-auto whitespace-pre-wrap">
        {formula}
      </code>
      <p className="text-xs text-muted-foreground">{plain}</p>
      <p className="text-xs font-bold tabular-nums text-foreground">{live}</p>
    </div>
  );
}

type S = {
  leads: number; pitchRate: number; closeRate: number; avgTicket: number; retentionRate: number;
};
function projectNIS(s: S, o: { close?: number; pitch?: number; extraLeads?: number }) {
  const leads = s.leads + (o.extraLeads ?? 0);
  const pitch = o.pitch ?? s.pitchRate;
  const close = o.close ?? s.closeRate;
  return leads * pitch * close * s.avgTicket * s.retentionRate;
}
