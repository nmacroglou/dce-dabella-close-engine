import { useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { useAdminMetrics } from "@/hooks/useAdminMetrics";
import { useIsAdmin } from "@/hooks/useUserRole";
import {
  Loader2, Users, UserPlus, Activity, Briefcase, DollarSign,
  TrendingUp, Trophy, AlertCircle, ShieldCheck, MessageSquareWarning, Target,
} from "lucide-react";
import { fmt, pct } from "@/lib/format";
import { DEAL_STAGES, STAGE_LABELS, type DealStage } from "@/types/deal";

/* ------------------------- helpers ------------------------- */
const DAY_MS = 86_400_000;
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS);

function uniqueActiveReps(eventDates: string[], days: number): number {
  const cutoff = daysAgo(days).getTime();
  return new Set(eventDates.filter(d => new Date(d).getTime() >= cutoff)).size;
}

/* ------------------------- tile ------------------------- */
function KpiTile({
  icon: Icon, label, value, sub, accent,
}: { icon: any; label: string; value: string; sub?: string; accent?: "primary" | "success" | "warning" | "destructive" }) {
  const accentMap = {
    primary: "from-primary/20 to-primary/5 text-primary",
    success: "from-success/20 to-success/5 text-success",
    warning: "from-warning/20 to-warning/5 text-warning",
    destructive: "from-destructive/20 to-destructive/5 text-destructive",
  } as const;
  const a = accentMap[accent ?? "primary"];
  return (
    <div className="card-premium p-4 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] transition-all">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${a} grid place-items-center shadow-sm`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-extrabold font-display text-foreground num-display">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, action }: { title: string; icon: any; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="card-premium p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold font-display text-foreground tracking-tight">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ------------------------- page ------------------------- */
export default function Admin() {
  const { isAdmin } = useIsAdmin();
  const { data, isLoading, error } = useAdminMetrics(isAdmin);
  const [windowDays, setWindowDays] = useState<7 | 30 | 90>(30);

  const m = useMemo(() => {
    if (!data) return null;
    const { deals, followUps, objections, profiles, stageHistory } = data;
    const cutoff = daysAgo(windowDays).getTime();
    const priorCutoff = daysAgo(windowDays * 2).getTime();

    const inWindow = <T extends { created_at?: string; closed_at?: string | null }>(arr: T[], key: "created_at" | "closed_at" = "created_at") =>
      arr.filter(r => { const v = r[key]; return v && new Date(v).getTime() >= cutoff; });
    const inPrior = <T extends { created_at?: string; closed_at?: string | null }>(arr: T[], key: "created_at" | "closed_at" = "created_at") =>
      arr.filter(r => { const v = r[key]; if (!v) return false; const t = new Date(v).getTime(); return t >= priorCutoff && t < cutoff; });

    /* Adoption */
    const totalUsers = profiles.length;
    const newUsers = inWindow(profiles).length;
    // active = had any event in window
    const allEventDates = [
      ...deals.map(d => d.created_at),
      ...stageHistory.map(s => s.changed_at),
      ...followUps.map(f => f.created_at),
      ...objections.map(o => o.created_at),
    ];
    const eventByRep = new Map<string, string[]>();
    const pushEvt = (rep: string, when: string) => {
      const arr = eventByRep.get(rep) ?? []; arr.push(when); eventByRep.set(rep, arr);
    };
    deals.forEach(d => pushEvt(d.rep_id, d.created_at));
    stageHistory.forEach(s => pushEvt(s.rep_id, s.changed_at));
    followUps.forEach(f => pushEvt(f.rep_id, f.created_at));
    objections.forEach(o => pushEvt(o.rep_id, o.created_at));

    const activeReps = Array.from(eventByRep.entries())
      .filter(([, dates]) => uniqueActiveReps(dates, windowDays) > 0).length;
    const wau = Array.from(eventByRep.entries()).filter(([, dates]) => uniqueActiveReps(dates, 7) > 0).length;
    const dau = Array.from(eventByRep.entries()).filter(([, dates]) => uniqueActiveReps(dates, 1) > 0).length;
    const mau = Array.from(eventByRep.entries()).filter(([, dates]) => uniqueActiveReps(dates, 30) > 0).length;

    /* Activity */
    const dealsCreated = inWindow(deals).length;
    const dealsCreatedPrior = inPrior(deals).length;
    const followUpsSent = inWindow(followUps).length;
    const objectionsLogged = inWindow(objections).length;
    const presentationsRun = stageHistory.filter(s => s.to_stage === "presented" && new Date(s.changed_at).getTime() >= cutoff).length;

    /* Outcomes */
    const wonInWindow = deals.filter(d => d.stage === "won" && d.closed_at && new Date(d.closed_at).getTime() >= cutoff);
    const lostInWindow = deals.filter(d => d.stage === "lost" && d.closed_at && new Date(d.closed_at).getTime() >= cutoff);
    const revenue = wonInWindow.reduce((s, d) => s + (d.closed_amount ?? 0), 0);
    const priorWon = deals.filter(d => d.stage === "won" && d.closed_at && new Date(d.closed_at).getTime() >= priorCutoff && new Date(d.closed_at).getTime() < cutoff);
    const priorRevenue = priorWon.reduce((s, d) => s + (d.closed_amount ?? 0), 0);
    const closedDeals = wonInWindow.length + lostInWindow.length;
    const closeRate = closedDeals ? (wonInWindow.length / closedDeals) * 100 : 0;
    const avgDeal = wonInWindow.length ? revenue / wonInWindow.length : 0;

    /* Funnel */
    const stageCounts = DEAL_STAGES.reduce((acc, s) => { acc[s] = 0; return acc; }, {} as Record<DealStage, number>);
    deals.forEach(d => { stageCounts[d.stage] = (stageCounts[d.stage] ?? 0) + 1; });

    /* Leaderboard by rep (in window) */
    const repAgg = new Map<string, { rep_id: string; deals: number; revenue: number; won: number; lost: number; activity: number }>();
    const ensure = (id: string) => {
      let row = repAgg.get(id);
      if (!row) { row = { rep_id: id, deals: 0, revenue: 0, won: 0, lost: 0, activity: 0 }; repAgg.set(id, row); }
      return row;
    };
    inWindow(deals).forEach(d => { ensure(d.rep_id).deals++; });
    wonInWindow.forEach(d => { const r = ensure(d.rep_id); r.won++; r.revenue += d.closed_amount ?? 0; });
    lostInWindow.forEach(d => { ensure(d.rep_id).lost++; });
    inWindow(followUps).forEach(f => { ensure(f.rep_id).activity++; });
    inWindow(objections).forEach(o => { ensure(o.rep_id).activity++; });

    const profileMap = new Map(profiles.map(p => [p.user_id, p]));
    const leaderboard = Array.from(repAgg.values())
      .map(r => ({
        ...r,
        name: profileMap.get(r.rep_id)?.display_name || profileMap.get(r.rep_id)?.email || r.rep_id.slice(0, 8),
        email: profileMap.get(r.rep_id)?.email ?? "",
        closeRate: r.won + r.lost ? (r.won / (r.won + r.lost)) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    /* Objections (top in window) */
    const objCounts = new Map<string, number>();
    inWindow(objections).forEach(o => objCounts.set(o.objection_type, (objCounts.get(o.objection_type) ?? 0) + 1));
    const topObjections = Array.from(objCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);

    /* SLA */
    const dueFollowUps = followUps.filter(f => new Date(f.created_at).getTime() >= cutoff);
    const completedSLA = dueFollowUps.filter(f => f.completed_at).length;
    const slaPct = dueFollowUps.length ? Math.round((completedSLA / dueFollowUps.length) * 100) : 0;

    return {
      totalUsers, newUsers, activeReps, dau, wau, mau,
      dealsCreated, dealsCreatedPrior, followUpsSent, objectionsLogged, presentationsRun,
      revenue, priorRevenue, wonCount: wonInWindow.length, closeRate, avgDeal,
      stageCounts, leaderboard, topObjections, slaPct,
    };
  }, [data, windowDays]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Admin access required.</p>
        </div>
      </div>
    );
  }

  if (isLoading || !m) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="grid place-items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-destructive">Failed to load admin metrics: {String(error)}</p>
        </div>
      </div>
    );
  }

  const revDelta = m.priorRevenue ? ((m.revenue - m.priorRevenue) / m.priorRevenue) * 100 : 0;
  const dealsDelta = m.dealsCreatedPrior ? ((m.dealsCreated - m.dealsCreatedPrior) / m.dealsCreatedPrior) * 100 : 0;
  const adoptionPct = m.totalUsers ? Math.round((m.activeReps / m.totalUsers) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold gradient-text">Admin Console</h1>
            <p className="text-sm text-muted-foreground mt-1">DaBella · cross-rep adoption, activity & outcomes</p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl border border-hairline bg-muted/40 backdrop-blur">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setWindowDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  windowDays === d ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >Last {d}d</button>
            ))}
          </div>
        </div>

        {/* Adoption row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile icon={Users} label="Total accounts" value={fmt(m.totalUsers)} sub={`${m.newUsers} new in ${windowDays}d`} />
          <KpiTile icon={UserPlus} label="Active reps" value={fmt(m.activeReps)} sub={`${adoptionPct}% adoption`} accent="success" />
          <KpiTile icon={Activity} label="DAU / WAU / MAU" value={`${m.dau} / ${m.wau} / ${m.mau}`} sub={m.wau ? `Stickiness ${pct((m.dau / m.wau) * 100)}` : "—"} />
          <KpiTile icon={ShieldCheck} label="Follow-up SLA" value={`${m.slaPct}%`} sub="Completed / due" accent={m.slaPct >= 75 ? "success" : m.slaPct >= 50 ? "warning" : "destructive"} />
        </div>

        {/* Outcomes row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile icon={DollarSign} label="Revenue" value={fmt(Math.round(m.revenue))} sub={`${revDelta >= 0 ? "+" : ""}${revDelta.toFixed(0)}% vs prior`} accent={revDelta >= 0 ? "success" : "destructive"} />
          <KpiTile icon={Trophy} label="Wins" value={fmt(m.wonCount)} sub={`Close rate ${pct(m.closeRate)}`} accent="success" />
          <KpiTile icon={Target} label="Avg deal" value={fmt(Math.round(m.avgDeal))} sub="Won deals only" />

          <KpiTile icon={Briefcase} label="Deals created" value={fmt(m.dealsCreated)} sub={`${dealsDelta >= 0 ? "+" : ""}${dealsDelta.toFixed(0)}% vs prior`} accent={dealsDelta >= 0 ? "primary" : "warning"} />
        </div>

        {/* Activity row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile icon={Activity} label="Presentations run" value={fmt(m.presentationsRun)} accent="primary" />
          <KpiTile icon={MessageSquareWarning} label="Objections logged" value={fmt(m.objectionsLogged)} accent="warning" />
          <KpiTile icon={TrendingUp} label="Follow-ups created" value={fmt(m.followUpsSent)} />
          <KpiTile icon={AlertCircle} label="Lost deals" value={fmt(m.stageCounts.lost)} accent="destructive" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <SectionCard title="Rep Leaderboard" icon={Trophy}>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="text-left px-2 py-2 font-semibold">#</th>
                      <th className="text-left px-2 py-2 font-semibold">Rep</th>
                      <th className="text-right px-2 py-2 font-semibold">Revenue</th>
                      <th className="text-right px-2 py-2 font-semibold">Wins</th>
                      <th className="text-right px-2 py-2 font-semibold">Close %</th>
                      <th className="text-right px-2 py-2 font-semibold">Deals</th>
                      <th className="text-right px-2 py-2 font-semibold">Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.leaderboard.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-6 text-muted-foreground text-xs">No activity in window.</td></tr>
                    )}
                    {m.leaderboard.slice(0, 15).map((r, i) => (
                      <tr key={r.rep_id} className="border-t border-border/60 hover:bg-muted/30">
                        <td className="px-2 py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                        <td className="px-2 py-2">
                          <div className="font-semibold text-foreground truncate max-w-[180px]">{r.name}</div>
                          {r.email && <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">{r.email}</div>}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums font-semibold text-success">${fmt(Math.round(r.revenue))}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{r.won}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{pct(r.closeRate)}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{r.deals}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">{r.activity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>

          {/* Funnel */}
          <SectionCard title="Pipeline Funnel" icon={Target}>
            <div className="space-y-2">
              {DEAL_STAGES.map((s) => {
                const count = m.stageCounts[s];
                const max = Math.max(...Object.values(m.stageCounts), 1);
                const w = (count / max) * 100;
                return (
                  <div key={s}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{STAGE_LABELS[s]}</span>
                      <span className="font-bold text-foreground tabular-nums">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full gradient-brand transition-all" style={{ width: `${w}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Objections */}
        <SectionCard title={`Top objections — last ${windowDays}d`} icon={MessageSquareWarning}>
          {m.topObjections.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No objections logged.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {m.topObjections.map(([type, count]) => {
                const max = m.topObjections[0][1];
                const w = (count / max) * 100;
                return (
                  <div key={type} className="rounded-xl border border-hairline bg-muted/20 p-3 hover:border-warning/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground capitalize">{type.replace(/_/g, " ")}</span>
                      <span className="text-sm font-extrabold tabular-nums text-warning">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-warning transition-all" style={{ width: `${w}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </main>
    </div>
  );
}
