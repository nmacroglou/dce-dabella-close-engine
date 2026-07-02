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
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DAY_MS = 86_400_000;

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

export default function Forecast() {
  const { data: deals = [], isLoading } = useDeals();
  const [goal, setGoal] = useState(150_000);
  const [retentionPct, setRetentionPct] = useState(95);
  const [preset, setPreset] = useState<PresetKey>("30d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const range = useMemo(() => {
    if (preset === "custom" && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    return rangeFromPreset(preset);
  }, [preset, customFrom, customTo]);

  const scoped = useMemo(() => {
    const fromMs = range.from.getTime();
    const toMs = range.to.getTime();
    return deals.filter((d) => {
      const t = d.created_at ? new Date(d.created_at).getTime() : 0;
      return t >= fromMs && t <= toMs;
    });
  }, [deals, range]);

  const stats = useMemo(() => {
    const leads = scoped.length;
    const pitched = scoped.filter((d) => d.was_presented).length;
    const won = scoped.filter((d) => d.stage === "won");
    const lost = scoped.filter((d) => d.stage === "lost");
    const finished = won.length + lost.length;
    const gross = won.reduce((s, d) => s + (d.closed_amount ?? 0), 0);
    const nis = gross * (retentionPct / 100);

    const now = Date.now();
    const spanEnd = Math.min(now, range.to.getTime());
    const spanDays = Math.max(1, Math.ceil((spanEnd - range.from.getTime()) / DAY_MS));
    const weeksActive = spanDays / 7;
    const monthsActive = spanDays / 30;

    const pitchRate = leads > 0 ? pitched / leads : 0;
    const closeRate = finished > 0 ? won.length / finished : 0;
    const avgTicket = won.length > 0 ? gross / won.length : 0;

    const leadsPerWeek = leads / weeksActive;
    const nisPerWeek = nis / weeksActive;
    const nisPerMonth = nis / monthsActive;

    const remaining = Math.max(0, goal - nis);
    const weeksToGoal = nisPerWeek > 0 ? remaining / nisPerWeek : Infinity;

    const dollarsPerLead =
      leads > 0 ? pitchRate * closeRate * avgTicket * (retentionPct / 100) : 0;
    const leadsNeededForGoal = dollarsPerLead > 0 ? goal / dollarsPerLead : Infinity;
    const leadsRemaining = Math.max(0, leadsNeededForGoal - leads);

    return {
      leads, pitched, won: won.length, lost: lost.length, finished,
      gross, nis, pitchRate, closeRate, avgTicket, retentionPct,
      spanDays, weeksActive, monthsActive,
      leadsPerWeek, nisPerWeek, nisPerMonth,
      remaining, weeksToGoal, dollarsPerLead, leadsNeededForGoal, leadsRemaining,
    };
  }, [scoped, goal, retentionPct, range]);

  const goalPct = Math.min(100, (stats.nis / goal) * 100);
  const onPace = stats.nisPerMonth >= goal;

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
            <div className="w-56">
              <div className="flex justify-between text-xs">
                <Label className="uppercase tracking-wider text-muted-foreground">Retention</Label>
                <span className="font-bold tabular-nums">{retentionPct}%</span>
              </div>
              <Slider
                value={[retentionPct]}
                onValueChange={([v]) => setRetentionPct(v)}
                min={70} max={100} step={1}
                className="mt-2"
              />
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
            {/* KPI grid */}
            <section className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <StatTile icon={Users} label="Lead Count" value={formatCount(stats.leads)} accent="text-primary" sub={`${stats.leadsPerWeek.toFixed(1)}/wk`} />
              <StatTile icon={Percent} label="Pitch %" value={pctNum(stats.pitchRate * 100)} accent="text-info" sub={`${stats.pitched} pitched`} />
              <StatTile icon={Award} label="Close Rate" value={pctNum(stats.closeRate * 100)} accent="text-success" sub={`${stats.won}W / ${stats.lost}L`} />
              <StatTile icon={DollarSign} label="Gross Sales" value={formatCurrency(stats.gross)} accent="text-warning" sub={`${formatCurrency(stats.avgTicket)} avg`} />
              <StatTile icon={TrendingUp} label="NIS" value={formatCurrency(stats.nis)} accent="text-primary" sub={`${retentionPct}% ret.`} />
              <StatTile icon={Shield} label="Retention" value={`${retentionPct}%`} accent="text-info" sub="adjustable" />
            </section>

            {/* Goal progress */}
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
                <div
                  className="h-full bg-gradient-to-r from-primary to-success transition-all"
                  style={{ width: `${goalPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
                <span>0</span>
                <span className="font-bold text-foreground">{goalPct.toFixed(1)}%</span>
                <span>{formatCurrency(goal)}</span>
              </div>
            </section>

            {/* Forecast */}
            <section className="grid gap-4 md:grid-cols-2">
              <div className="card-elevated p-5 space-y-3">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" /> Time-based forecast
                </h3>
                <p className="text-sm text-muted-foreground">
                  At your current pace of <b className="text-foreground">{formatCurrency(stats.nisPerWeek)}/wk</b>{" "}
                  ({formatCurrency(stats.nisPerMonth)}/mo NIS):
                </p>
                <ul className="text-sm space-y-2">
                  <Row label="Weeks to hit goal" value={isFinite(stats.weeksToGoal) ? `${stats.weeksToGoal.toFixed(1)} wks` : "—"} />
                  <Row label="Projected date" value={isFinite(stats.weeksToGoal)
                    ? new Date(Date.now() + stats.weeksToGoal * 7 * DAY_MS).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                    : "—"} />
                  <Row label="Monthly gap vs goal" value={formatCurrency(Math.max(0, goal - stats.nisPerMonth))} />
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

            {/* What-if levers */}
            <section className="card-elevated p-5 space-y-3">
              <h3 className="font-display font-bold text-lg">What would move the needle?</h3>
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <Lever label="+10% Close Rate" before={stats.nis} after={projectNIS(stats, { close: stats.closeRate + 0.1 })} goal={goal} />
                <Lever label="+25% Pitch Rate" before={stats.nis} after={projectNIS(stats, { pitch: Math.min(1, stats.pitchRate * 1.25) })} goal={goal} />
                <Lever label="+10 More Leads" before={stats.nis} after={projectNIS(stats, { extraLeads: 10 })} goal={goal} />
              </div>
            </section>

            {/* Definitions panel */}
            <section className="card-elevated p-5 space-y-4">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" /> How these numbers are calculated
              </h3>
              <p className="text-xs text-muted-foreground">
                All metrics use deals in the selected time range, filtered by <code>created_at</code> and scoped to your rep view.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <Definition
                  icon={Users} label="Lead Count" accent="text-primary"
                  formula="count(deals where created_at ∈ range)"
                  plain="Every deal card you created in this range — regardless of stage."
                  live={`= ${formatCount(stats.leads)} leads`}
                />
                <Definition
                  icon={Percent} label="Pitch %" accent="text-info"
                  formula="pitched ÷ leads   where pitched = deals with was_presented = true"
                  plain="Of your leads, the share you actually delivered a presentation to."
                  live={`${stats.pitched} pitched ÷ ${stats.leads} leads = ${pctNum(stats.pitchRate * 100)}`}
                />
                <Definition
                  icon={Award} label="Close Rate" accent="text-success"
                  formula="won ÷ (won + lost)   — disqualified and open deals are excluded"
                  plain="Of the deals that reached a decision (won or lost), how many you closed."
                  live={`${stats.won}W ÷ (${stats.won}W + ${stats.lost}L) = ${pctNum(stats.closeRate * 100)}`}
                />
                <Definition
                  icon={DollarSign} label="Gross Sales" accent="text-warning"
                  formula="sum(closed_amount) for deals where stage = 'won'"
                  plain="Contract value of every won deal in the range, before retention."
                  live={`= ${formatCurrency(stats.gross)} (${stats.won} won · ${formatCurrency(stats.avgTicket)} avg ticket)`}
                />
                <Definition
                  icon={TrendingUp} label="NIS (Net Installed Sales)" accent="text-primary"
                  formula="Gross Sales × Retention %"
                  plain="What actually sticks after cancellations — this is what counts toward your goal and commission tiers."
                  live={`${formatCurrency(stats.gross)} × ${retentionPct}% = ${formatCurrency(stats.nis)}`}
                />
                <Definition
                  icon={Shield} label="Retention %" accent="text-info"
                  formula="Manual input (slider above) — default 95%"
                  plain="Not yet tracked automatically in the app. Adjust the slider to match your latest board retention. Once cancellation data is captured on deals we can compute this from (won − cancelled) ÷ won."
                  live={`Currently set to ${retentionPct}%`}
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
      <code className="block text-[11px] font-mono bg-background/60 border border-border/40 rounded px-2 py-1.5 text-foreground/90 overflow-x-auto">
        {formula}
      </code>
      <p className="text-xs text-muted-foreground">{plain}</p>
      <p className="text-xs font-bold tabular-nums text-foreground">{live}</p>
    </div>
  );
}

type S = {
  leads: number; pitchRate: number; closeRate: number; avgTicket: number; retentionPct: number;
};
function projectNIS(s: S, o: { close?: number; pitch?: number; extraLeads?: number }) {
  const leads = s.leads + (o.extraLeads ?? 0);
  const pitch = o.pitch ?? s.pitchRate;
  const close = o.close ?? s.closeRate;
  return leads * pitch * close * s.avgTicket * (s.retentionPct / 100);
}
