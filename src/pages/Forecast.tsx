import { useMemo, useState } from "react";
import { Target, TrendingUp, Users, Percent, DollarSign, Award, Shield, Calendar } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { useDeals } from "@/hooks/useDeals";
import { formatCurrency, formatCount, pctNum } from "@/lib/format";
import { StatTile } from "@/components/pipeline/StatTile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const DAY_MS = 86_400_000;

export default function Forecast() {
  const { data: deals = [], isLoading } = useDeals();
  const [goal, setGoal] = useState(150_000);
  const [retentionPct, setRetentionPct] = useState(95);

  const stats = useMemo(() => {
    const leads = deals.length;
    const pitched = deals.filter((d) => d.was_presented).length;
    const won = deals.filter((d) => d.stage === "won");
    const lost = deals.filter((d) => d.stage === "lost");
    const finished = won.length + lost.length;
    const gross = won.reduce((s, d) => s + (d.closed_amount ?? 0), 0);
    const nis = gross * (retentionPct / 100);

    // Rolling windows based on created_at (leads) and closed_at (wins)
    const now = Date.now();
    const firstLead = deals.reduce<number>((min, d) => {
      const t = d.created_at ? new Date(d.created_at).getTime() : Infinity;
      return Math.min(min, t);
    }, Infinity);
    const daysActive = Math.max(7, Math.ceil((now - firstLead) / DAY_MS));
    const weeksActive = daysActive / 7;
    const monthsActive = daysActive / 30;

    const pitchRate = leads > 0 ? pitched / leads : 0;
    const closeRate = finished > 0 ? won.length / finished : 0;
    const avgTicket = won.length > 0 ? gross / won.length : 0;

    const leadsPerWeek = leads / weeksActive;
    const nisPerWeek = nis / weeksActive;
    const nisPerMonth = nis / monthsActive;

    // Forecast to goal
    const remaining = Math.max(0, goal - nis);
    const weeksToGoal = nisPerWeek > 0 ? remaining / nisPerWeek : Infinity;

    // What it takes at current close+ticket+retention
    const dollarsPerLead =
      leads > 0
        ? (pitchRate * closeRate * avgTicket * (retentionPct / 100))
        : 0;
    const leadsNeededForGoal = dollarsPerLead > 0 ? goal / dollarsPerLead : Infinity;
    const leadsRemaining = Math.max(0, leadsNeededForGoal - leads);

    return {
      leads, pitched, won: won.length, lost: lost.length, finished,
      gross, nis, pitchRate, closeRate, avgTicket, retentionPct,
      daysActive, weeksActive, monthsActive,
      leadsPerWeek, nisPerWeek, nisPerMonth,
      remaining, weeksToGoal, dollarsPerLead, leadsNeededForGoal, leadsRemaining,
    };
  }, [deals, goal, retentionPct]);

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
                  <Calendar className="h-4 w-4 text-primary" /> Time-based forecast
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
                <Lever
                  label="+10% Close Rate"
                  before={stats.nis}
                  after={projectNIS(stats, { close: stats.closeRate + 0.1 })}
                  goal={goal}
                />
                <Lever
                  label="+25% Pitch Rate"
                  before={stats.nis}
                  after={projectNIS(stats, { pitch: Math.min(1, stats.pitchRate * 1.25) })}
                  goal={goal}
                />
                <Lever
                  label="+10 More Leads"
                  before={stats.nis}
                  after={projectNIS(stats, { extraLeads: 10 })}
                  goal={goal}
                />
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

type S = {
  leads: number; pitchRate: number; closeRate: number; avgTicket: number; retentionPct: number;
};
function projectNIS(s: S, o: { close?: number; pitch?: number; extraLeads?: number }) {
  const leads = s.leads + (o.extraLeads ?? 0);
  const pitch = o.pitch ?? s.pitchRate;
  const close = o.close ?? s.closeRate;
  return leads * pitch * close * s.avgTicket * (s.retentionPct / 100);
}
