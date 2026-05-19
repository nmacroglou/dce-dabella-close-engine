import { lazy, Suspense, useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAuth } from "@/contexts/AuthContext";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useDeals } from "@/hooks/useDeals";
import { useActivityTimeline } from "@/hooks/useActivityTimeline";
import { followUpStatus } from "@/types/followUp";
import AppHeader from "@/components/AppHeader";
import {
  Loader2, Target, DollarSign, Award,
  Flame, Clock, AlertCircle, Trophy, Sparkles, ArrowUpRight,
  Zap, Activity, Hourglass, Wallet, Gauge, Pencil,
} from "lucide-react";
import { fmt, pct } from "@/lib/format";
import { OBJECTIONS } from "@/data/objections";
import { HeroKPI, MiniStat, EconomicsKPI, DualKPI } from "@/components/dashboard/kpi-tiles";
import { WowChipStrip } from "@/components/dashboard/WowChipStrip";
import { ConversionRibbon } from "@/components/dashboard/ConversionRibbon";
import { ReportingActions } from "@/components/dashboard/ReportingActions";
import { bucketByDay, splitCurrentPrior, sumBuckets, wowDelta } from "@/lib/dashboardSeries";

// Defer chart-heavy below-the-fold sections to shrink initial bundle.
const TrendsCard = lazy(() => import("@/components/dashboard/TrendsCard").then(m => ({ default: m.TrendsCard })));
const ActivityTimeline = lazy(() => import("@/components/dashboard/ActivityTimeline").then(m => ({ default: m.ActivityTimeline })));
const ObjectionHeatmap = lazy(() => import("@/components/dashboard/ObjectionHeatmap").then(m => ({ default: m.ObjectionHeatmap })));

const SectionFallback = () => (
  <div className="rounded-2xl border border-hairline bg-card/50 p-8 grid place-items-center">
    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
  </div>
);

const HOURS_KEY = "dabella.hud.weeklyHours";
const COMMISSION_KEY = "dabella.hud.commissionPct";
const RANGE_KEY = "dabella.hud.rangeDays";
type RangeDays = 7 | 30 | 90;

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: followUps = [] } = useFollowUps();
  const { data: deals = [] } = useDeals();
  const { data: timelineEvents = [], isLoading: timelineLoading } = useActivityTimeline(14);

  const followUpInsights = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    let overdue = 0, today = 0, upcoming = 0, completed = 0, totalDue = 0;
    const overdueList: typeof followUps = [];
    for (const f of followUps) {
      const status = followUpStatus(f);
      const due = new Date(f.due_at);
      if (status === "completed") { completed++; continue; }
      totalDue++;
      if (status === "overdue") { overdue++; overdueList.push(f); }
      else if (due >= todayStart && due <= todayEnd) today++;
      else upcoming++;
    }
    const compliancePct = totalDue + completed > 0 ? Math.round((completed / (totalDue + completed)) * 100) : 0;
    return { overdue, today, upcoming, completed, compliancePct, overdueList: overdueList.slice(0, 5) };
  }, [followUps]);

  /* ---- Rep economics inputs ---- */
  const [weeklyHours, setWeeklyHours] = useState<number>(40);
  const [commissionPct, setCommissionPct] = useState<number>(8);
  const [editingEcon, setEditingEcon] = useState(false);
  const [rangeDays, setRangeDays] = useState<RangeDays>(30);

  useEffect(() => {
    const h = parseFloat(localStorage.getItem(HOURS_KEY) ?? "");
    const c = parseFloat(localStorage.getItem(COMMISSION_KEY) ?? "");
    const r = parseInt(localStorage.getItem(RANGE_KEY) ?? "", 10);
    if (!Number.isNaN(h) && h > 0) setWeeklyHours(h);
    if (!Number.isNaN(c) && c > 0) setCommissionPct(c);
    if (r === 7 || r === 30 || r === 90) setRangeDays(r);
  }, []);
  useEffect(() => { localStorage.setItem(HOURS_KEY, String(weeklyHours)); }, [weeklyHours]);
  useEffect(() => { localStorage.setItem(COMMISSION_KEY, String(commissionPct)); }, [commissionPct]);
  useEffect(() => { localStorage.setItem(RANGE_KEY, String(rangeDays)); }, [rangeDays]);

  /* ---- Windowed stats (7 / 30 / 90 days) ----
     "Revenue" + "Close rate" use closed_at so wins/losses surface in the
     window they were actually decided. "Deals run" still uses created_at
     because it tracks activity started. */
  const windowed = useMemo(() => {
    const cutoff = Date.now() - rangeDays * 864e5;
    const cutoffIso = new Date(cutoff).toISOString();
    const inWinByCreated = deals.filter((d) => new Date(d.created_at).getTime() >= cutoff);
    const wonInWin = deals.filter((d) => d.stage === "won" && d.closed_at && d.closed_at >= cutoffIso);
    const lostInWin = deals.filter((d) => d.stage === "lost" && d.closed_at && d.closed_at >= cutoffIso);
    const revenue = wonInWin.reduce((s, d) => s + (d.closed_amount ?? 0), 0);
    const finished = wonInWin.length + lostInWin.length;
    const closeRate = finished > 0 ? wonInWin.length / finished : 0;
    // Pipeline still in flight from deals started in this window (not yet decided).
    const pendingInWin = inWinByCreated.filter(
      (d) => d.stage === "presented" || d.stage === "follow_up" || d.stage === "inspecting"
    ).length;
    const active = deals.filter((d) => d.stage !== "won" && d.stage !== "lost").length;
    return {
      dealsRun: inWinByCreated.length, won: wonInWin.length, lost: lostInWin.length, revenue, closeRate, active,
      pending: pendingInWin,
    };
  }, [deals, rangeDays]);



  const economics = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 864e5;
    const wonThisWeek = deals.filter(
      (d) => d.stage === "won" && d.closed_at && new Date(d.closed_at).getTime() >= weekAgo
    );
    const earnedThisWeek = wonThisWeek.reduce(
      (s, d) => s + ((d.closed_amount ?? 0) * commissionPct) / 100, 0
    );
    const dollarsPerHour = weeklyHours > 0 ? earnedThisWeek / weeklyHours : 0;
    const openDeals = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
    const moneyInMotion = openDeals.reduce(
      (s, d) => s + Math.max(d.price_a ?? 0, d.price_b ?? 0, d.price_c ?? 0), 0
    );
    const expectedCommissionInMotion = (moneyInMotion * commissionPct) / 100;
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const daysIntoMonth = Math.max(1, Math.ceil((now - monthStart.getTime()) / 864e5));
    const velocityPerDay = (stats?.monthRevenue ?? 0) / daysIntoMonth;
    const projectedMonth = velocityPerDay * 30;
    return {
      dollarsPerHour, earnedThisWeek, wonThisWeekCount: wonThisWeek.length,
      moneyInMotion, expectedCommissionInMotion, openDealsCount: openDeals.length,
      velocityPerDay, projectedMonth,
    };
  }, [deals, weeklyHours, commissionPct, stats]);

  /* ---- WoW chip strip & report payload (current window vs prior of equal length) ---- */
  const dayBuckets14 = useMemo(
    () => bucketByDay(deals, rangeDays * 2, weeklyHours, commissionPct),
    [deals, weeklyHours, commissionPct, rangeDays],
  );
  const wow = useMemo(() => {
    const { current, prior } = splitCurrentPrior(dayBuckets14);
    const curRev = sumBuckets(current, "revenue");
    const priRev = sumBuckets(prior, "revenue");
    const curWon = sumBuckets(current, "won");
    const priWon = sumBuckets(prior, "won");
    const curRun = sumBuckets(current, "dealsRun");
    const priRun = sumBuckets(prior, "dealsRun");
    const curLost = sumBuckets(current, "lost");
    const priLost = sumBuckets(prior, "lost");
    const curDph = sumBuckets(current, "dollarsPerHour");
    const priDph = sumBuckets(prior, "dollarsPerHour");
    const curRate = curWon + curLost > 0 ? curWon / (curWon + curLost) : 0;
    const priRate = priWon + priLost > 0 ? priWon / (priWon + priLost) : 0;
    return {
      revenue: { current: curRev, prior: priRev, delta: wowDelta(curRev, priRev) },
      closeRate: {
        current: curRate,
        prior: priRate,
        // Rate metrics: compare in percentage POINTS, not relative %.
        delta: {
          pct: Math.abs((curRate - priRate) * 100),
          dir: curRate - priRate > 0.005 ? "up" as const : curRate - priRate < -0.005 ? "down" as const : "flat" as const,
          absolute: (curRate - priRate) * 100,
        },
      },
      dealsRun: { current: curRun, prior: priRun, delta: wowDelta(curRun, priRun) },
      dollarsPerHour: { current: curDph, prior: priDph, delta: wowDelta(curDph, priDph) },
      closedDeals: { current: curWon, prior: priWon },
    };
  }, [dayBuckets14]);

  const topObjection = useMemo(() => {
    if (!stats) return undefined;
    const sorted = Object.entries(stats.objectionCounts).sort((a, b) => b[1].total - a[1].total);
    if (sorted.length === 0) return undefined;
    const [id, v] = sorted[0];
    const label = OBJECTIONS.find((o) => o.id === id)?.label ?? id;
    return `${label} (${v.total})`;
  }, [stats]);

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen surface-premium">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  const greeting = (user?.user_metadata?.full_name || user?.email || "").split(" ")[0] || "rep";

  return (
    <div className="min-h-screen surface-premium">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ===== HERO with State of the Week ===== */}
        <section className="relative overflow-hidden rounded-3xl border border-hairline bg-card shadow-[var(--shadow-lg)]">
          <div className="absolute inset-0 gradient-surface opacity-80" />
          <div className="absolute -top-24 -right-16 w-[28rem] h-[28rem] rounded-full opacity-40 blur-3xl gradient-brand animate-pulse" style={{ animationDuration: "6s" }} />
          <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full opacity-25 blur-3xl gradient-accent animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute inset-0 opacity-[0.05]" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }} />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="relative p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-end">
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div className="chip chip-primary backdrop-blur">
                  <Sparkles className="h-3 w-3" />
                  <span className="uppercase tracking-[0.2em] text-[10px]">DaBella Operator HUD</span>
                </div>
                <ReportingActions
                  rangeLabel={`Last ${rangeDays} days`}
                  buckets={dayBuckets14}
                  summary={{
                    rangeLabel: `Last ${rangeDays} days`,
                    revenue: { current: wow.revenue.current, prior: wow.revenue.prior },
                    closedDeals: wow.closedDeals,
                    closeRate: { current: wow.closeRate.current, prior: wow.closeRate.prior },
                    dealsRun: { current: wow.dealsRun.current, prior: wow.dealsRun.prior },
                    dollarsPerHour: { current: wow.dollarsPerHour.current, prior: wow.dollarsPerHour.prior },
                    topObjection,
                  }}
                />
              </div>

              <h2 className="text-display-xl text-foreground">
                Hey {greeting} —<br className="hidden sm:block" />
                <span className="gradient-text">state of the week</span> is in.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-xl">
                Live performance, week-over-week trends, and the next move that closes more deals.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-5">
                <Link to="/pipeline" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl gradient-brand text-primary-foreground font-bold text-sm hover:opacity-95 transition-all pressable shadow-[var(--shadow-glow)]">
                  Open Pipeline <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link to="/deals" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-hairline bg-card/80 backdrop-blur font-bold text-sm hover:border-primary/40 hover:bg-card transition-all pressable">
                  My Deals
                </Link>
              </div>

              <div className="mt-6">
                <WowChipStrip chips={[
                  { label: `Revenue (${rangeDays}d)`, current: fmt(Math.round(wow.revenue.current)), delta: wow.revenue.delta },
                  { label: `Close rate (${rangeDays}d)`, current: `${Math.round(wow.closeRate.current * 100)}%`, delta: wow.closeRate.delta, deltaSuffix: "pp" },
                  { label: `Deals run (${rangeDays}d)`, current: String(wow.dealsRun.current), delta: wow.dealsRun.delta },
                  { label: `$/Hour (${rangeDays}d)`, current: fmt(Math.round(wow.dollarsPerHour.current)), delta: wow.dollarsPerHour.delta },
                ]} />
              </div>
            </div>

            {/* Hero side: SLA compliance ring */}
            <div className="relative flex flex-col items-center justify-center min-w-[12rem]">
              <div className="relative h-36 w-36">
                <svg viewBox="0 0 100 100" className="-rotate-90 h-full w-full">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--accent))" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(followUpInsights.compliancePct / 100) * 2 * Math.PI * 44} ${2 * Math.PI * 44}`}
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="text-3xl font-display font-extrabold text-foreground leading-none">{followUpInsights.compliancePct}%</p>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mt-1">SLA</p>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 font-semibold">Follow-up compliance</p>
            </div>
          </div>
        </section>

        {/* ===== RANGE PICKER ===== */}
        <section className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold font-display text-foreground uppercase tracking-wider">Performance window</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">KPIs below reflect deals created in the selected range.</p>
          </div>
          <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-hairline-strong bg-card/60 backdrop-blur shadow-sm">
            {([7, 30, 90] as RangeDays[]).map((d) => (
              <button
                key={d}
                onClick={() => setRangeDays(d)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all pressable ${
                  rangeDays === d
                    ? "gradient-brand text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Last {d}d
              </button>
            ))}
          </div>
        </section>

        {/* ===== HERO KPIs (windowed) ===== */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <HeroKPI icon={DollarSign} label={`Revenue · last ${rangeDays}d`} value={fmt(Math.round(windowed.revenue))}
            sub={`${windowed.won} closed deals`} tone="success" />
          <DualKPI icon={Target} label={`Close rate · last ${rangeDays}d`} tone="brand"
            primary={{
              value: pct(windowed.closeRate * 100),
              caption: "Decided",
              sub: `${windowed.won}W · ${windowed.lost}L`,
            }}
            secondary={{
              value: pct(windowed.presentedWinRate * 100),
              caption: "From presented",
              sub: `${windowed.wonFromPresented} / ${windowed.presented}`,
            }} />

          <HeroKPI icon={Activity} label="Active pipeline" value={String(windowed.active)}
            sub={`${windowed.dealsRun} run in ${rangeDays}d`} tone="brand" />
          <HeroKPI icon={AlertCircle} label="Overdue follow-ups" value={String(followUpInsights.overdue)}
            sub={`${followUpInsights.today} due today`}
            tone={followUpInsights.overdue > 0 ? "destructive" : "success"} />
        </section>

        {/* ===== TRENDS — period over period ===== */}
        <Suspense fallback={<SectionFallback />}>
          <TrendsCard deals={deals} weeklyHours={weeklyHours} commissionPct={commissionPct} />
        </Suspense>

        {/* ===== CONVERSION RIBBON ===== */}
        <ConversionRibbon deals={deals} />

        {/* ===== REP ECONOMICS ===== */}
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/15 grid place-items-center">
                <Gauge className="h-3.5 w-3.5 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Rep Economics</h3>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">— how every hour and every open deal maps to dollars</span>
            </div>
            <button
              onClick={() => setEditingEcon((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
            >
              <Pencil className="h-3 w-3" />
              {editingEcon ? "Done" : `${weeklyHours}h/wk · ${commissionPct}% comm`}
            </button>
          </div>

          {editingEcon && (
            <div className="rounded-xl border border-border bg-muted/30 p-3 mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-muted-foreground w-32">Hours per week</span>
                <input
                  type="number" min={1} max={120} value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </label>
              <label className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-muted-foreground w-32">Commission %</span>
                <input
                  type="number" min={0} max={100} step={0.5} value={commissionPct}
                  onChange={(e) => setCommissionPct(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <EconomicsKPI
              icon={Hourglass} label="$ / Hour (this week)" accent="success"
              value={fmt(Math.round(economics.dollarsPerHour))}
              sub={`${fmt(Math.round(economics.earnedThisWeek))} earned · ${weeklyHours}h worked`}
              footer={
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">{economics.wonThisWeekCount} deal{economics.wonThisWeekCount === 1 ? "" : "s"} closed (7d)</span>
                  <span className="font-bold text-success">{commissionPct}% comm</span>
                </div>
              }
            />
            <EconomicsKPI
              icon={Wallet} label="Money in Motion" accent="primary"
              value={fmt(Math.round(economics.moneyInMotion))}
              sub={`${economics.openDealsCount} open deal${economics.openDealsCount === 1 ? "" : "s"} in your pipeline`}
              footer={
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Est. commission if all close</span>
                  <span className="font-bold text-primary">{fmt(Math.round(economics.expectedCommissionInMotion))}</span>
                </div>
              }
            />
            <EconomicsKPI
              icon={Gauge} label="Pipeline Velocity" accent="warning"
              value={`${fmt(Math.round(economics.velocityPerDay))}/day`}
              sub="Avg revenue closed per day this month"
              footer={
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Projected month at this pace</span>
                  <span className="font-bold text-warning">{fmt(Math.round(economics.projectedMonth))}</span>
                </div>
              }
            />
          </div>
        </section>

        {/* ===== ACTIVITY TIMELINE + OBJECTION HEATMAP ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Suspense fallback={<SectionFallback />}>
              <ActivityTimeline events={timelineEvents} isLoading={timelineLoading} />
            </Suspense>
          </div>
          <Suspense fallback={<SectionFallback />}>
            <ObjectionHeatmap />
          </Suspense>
        </div>

        {/* ===== FOLLOW-UP HOT LIST ===== */}
        {followUpInsights.overdueList.length > 0 && (
          <section className="rounded-2xl border border-destructive/30 bg-gradient-to-r from-destructive/5 via-card to-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-destructive/15 grid place-items-center">
                  <Zap className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Hot list — overdue follow-ups</h3>
                  <p className="text-xs text-muted-foreground">Knock these out first to recover SLA.</p>
                </div>
              </div>
              <Link to="/pipeline" className="text-xs font-bold text-primary hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {followUpInsights.overdueList.map((f) => {
                const d = deals.find((dd) => dd.id === f.deal_id);
                const hoursLate = Math.round((Date.now() - new Date(f.due_at).getTime()) / 36e5);
                return (
                  <Link key={f.id} to="/deals" className="group rounded-xl border border-border bg-card p-3 hover:border-destructive/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{d?.homeowner1 ?? "Deal"}</p>
                        <p className="text-[11px] text-muted-foreground truncate">Touchpoint #{f.touchpoint_number} · {f.channel}</p>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-destructive/15 text-destructive">
                        {hoursLate}h late
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== BOTTOM MINI ROW ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat icon={Flame} label="7-day close rate" value={pct(stats.weeklyCloseRate)}
            sub={`${stats.weeklyClosed} won of ${stats.weeklyFinished} closed (7d)`} accent="text-warning" />
          <MiniStat icon={Clock} label="Avg time to close" value={`${stats.avgDaysToClose.toFixed(1)}d`}
            sub="From first inspection" accent="text-primary" />
          <MiniStat icon={Trophy} label="All-time revenue" value={fmt(stats.allTimeRevenue)}
            sub={`${stats.totalWon} closed deals`} accent="text-success" />
          <MiniStat icon={Award} label="Leaderboard" value="Coming"
            sub="Anonymous ranks soon" accent="text-muted-foreground" />
        </div>
      </main>
    </div>
  );
}
