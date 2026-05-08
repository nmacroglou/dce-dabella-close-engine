import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAuth } from "@/contexts/AuthContext";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useDeals } from "@/hooks/useDeals";
import { followUpStatus } from "@/types/followUp";
import AppHeader from "@/components/AppHeader";
import {
  Loader2, TrendingUp, TrendingDown, Target, DollarSign, Award,
  Flame, Clock, AlertCircle, Trophy, BarChart3, Sparkles, ArrowUpRight,
  Zap, Activity, Hourglass, Wallet, Gauge, Pencil,
} from "lucide-react";
import { fmt } from "@/lib/format";
import { STAGE_LABELS, type DealStage } from "@/types/deal";
import { OBJECTIONS } from "@/data/objections";

const HOURS_KEY = "dabella.hud.weeklyHours";
const COMMISSION_KEY = "dabella.hud.commissionPct";

const pct = (n: number) => `${Math.round(n * 100)}%`;

/* ---------- Hero KPI tile (large, gradient-accent) ---------- */
function HeroKPI({
  icon: Icon, label, value, sub, tone = "brand", trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  tone?: "brand" | "success" | "warning" | "destructive";
  trend?: { dir: "up" | "down"; text: string };
}) {
  const toneMap = {
    brand: "from-primary/20 to-primary/0 text-primary",
    success: "from-success/20 to-success/0 text-success",
    warning: "from-warning/20 to-warning/0 text-warning",
    destructive: "from-destructive/20 to-destructive/0 text-destructive",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 group">
      <div className={`absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-to-br ${toneMap[tone]} blur-2xl opacity-70 group-hover:opacity-100 transition-opacity`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <div className={`h-9 w-9 rounded-xl grid place-items-center bg-background/60 backdrop-blur border border-border ${toneMap[tone].split(" ").pop()}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-display font-extrabold tracking-tight text-foreground leading-none">{value}</p>
          {trend && (
            <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
              trend.dir === "up" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
            }`}>
              {trend.dir === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.text}
            </span>
          )}
        </div>
        {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ---------- Compact stat ---------- */
function MiniStat({ icon: Icon, label, value, sub, accent = "text-primary" }: {
  icon: React.ElementType; label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-display font-extrabold text-foreground tracking-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

/* ---------- Win rate donut (SVG) ---------- */
function WinRateDonut({ won, lost, pending }: { won: number; lost: number; pending: number }) {
  const total = Math.max(won + lost + pending, 1);
  const C = 2 * Math.PI * 42;
  const seg = (n: number) => (n / total) * C;
  const wonLen = seg(won);
  const lostLen = seg(lost);
  const pendLen = seg(pending);
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;

  return (
    <div className="relative h-44 w-44 mx-auto">
      <svg viewBox="0 0 100 100" className="-rotate-90 h-full w-full">
        <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--success))" strokeWidth="10"
          strokeDasharray={`${wonLen} ${C - wonLen}`} strokeDashoffset="0" strokeLinecap="round" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--destructive))" strokeWidth="10"
          strokeDasharray={`${lostLen} ${C - lostLen}`} strokeDashoffset={-wonLen} strokeLinecap="round" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted-foreground) / 0.35)" strokeWidth="10"
          strokeDasharray={`${pendLen} ${C - pendLen}`} strokeDashoffset={-(wonLen + lostLen)} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Win rate</p>
          <p className="text-3xl font-display font-extrabold text-foreground leading-none mt-1">{winRate}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">{won + lost} closed</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Rep Economics KPI tile (premium, editable) ---------- */
function EconomicsKPI({
  icon: Icon, label, value, sub, accent, footer,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent: "primary" | "success" | "warning";
  footer?: React.ReactNode;
}) {
  const accentMap = {
    primary: { ring: "ring-primary/20", glow: "from-primary/30", icon: "text-primary", border: "border-primary/30" },
    success: { ring: "ring-success/20", glow: "from-success/30", icon: "text-success", border: "border-success/30" },
    warning: { ring: "ring-warning/20", glow: "from-warning/30", icon: "text-warning", border: "border-warning/30" },
  }[accent];
  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 ${accentMap.border} bg-card p-5 ring-1 ${accentMap.ring}`}>
      <div className={`absolute -top-16 -right-12 h-44 w-44 rounded-full bg-gradient-to-br ${accentMap.glow} to-transparent blur-3xl`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg grid place-items-center bg-background/80 backdrop-blur border border-border ${accentMap.icon}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          </div>
        </div>
        <p className="text-4xl font-display font-extrabold tracking-tight text-foreground leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-2">{sub}</p>}
        {footer && <div className="mt-3 pt-3 border-t border-border/60">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Dollars/Hour vs Lead Flow chart ---------- */
function EarningsLeadFlowChart({
  buckets, maxDollars, maxLeads, totalLeads, avgDollars,
}: {
  buckets: { label: string; shortDate: string; dollars: number; leads: number }[];
  maxDollars: number; maxLeads: number; totalLeads: number; avgDollars: number;
}) {
  const W = 800, H = 240, PAD_L = 44, PAD_R = 44, PAD_T = 16, PAD_B = 28;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const n = buckets.length;
  const stepX = innerW / Math.max(1, n - 1);
  const x = (i: number) => PAD_L + i * stepX;
  const yDollars = (v: number) => PAD_T + innerH - (v / maxDollars) * innerH;
  const barW = Math.max(6, (innerW / n) * 0.55);

  const linePath = buckets
    .map((b, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${yDollars(b.dollars).toFixed(1)}`)
    .join(" ");
  const areaPath =
    `${linePath} L ${x(n - 1).toFixed(1)} ${(PAD_T + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(PAD_T + innerH).toFixed(1)} Z`;

  return (
    <section className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-5 lg:p-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-success/30 to-primary/20 grid place-items-center border border-border">
            <Activity className="h-4 w-4 text-success" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Earnings velocity vs lead flow</h3>
            <p className="text-[11px] text-muted-foreground">Last 14 days — are inbound leads turning into dollars-per-hour?</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            <span className="text-muted-foreground">$ / hour</span>
            <span className="font-bold text-foreground">avg {fmt(Math.round(avgDollars))}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary/70" />
            <span className="text-muted-foreground">Leads</span>
            <span className="font-bold text-foreground">{totalLeads}</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[240px] min-w-[640px]" preserveAspectRatio="none">
          <defs>
            <linearGradient id="dphGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.45" />
              <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.85" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => {
            const y = PAD_T + innerH * (1 - p);
            return (
              <g key={p}>
                <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="hsl(var(--border))" strokeDasharray="2 4" strokeWidth="1" />
                <text x={PAD_L - 6} y={y + 3} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 9 }}>
                  {fmt(Math.round(maxDollars * p))}
                </text>
                <text x={W - PAD_R + 6} y={y + 3} textAnchor="start" className="fill-muted-foreground" style={{ fontSize: 9 }}>
                  {Math.round(maxLeads * p)}
                </text>
              </g>
            );
          })}

          {/* lead bars (right axis) */}
          {buckets.map((b, i) => {
            const h = (b.leads / maxLeads) * innerH;
            const cx = x(i);
            return (
              <rect key={`b${i}`} x={cx - barW / 2} y={PAD_T + innerH - h} width={barW} height={h}
                rx={2} fill="url(#leadGrad)">
                <title>{`${b.shortDate} — ${b.leads} lead${b.leads === 1 ? "" : "s"}`}</title>
              </rect>
            );
          })}

          {/* $/hr area + line */}
          <path d={areaPath} fill="url(#dphGrad)" />
          <path d={linePath} fill="none" stroke="hsl(var(--success))" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {buckets.map((b, i) => (
            <circle key={`p${i}`} cx={x(i)} cy={yDollars(b.dollars)} r={3} fill="hsl(var(--success))"
              stroke="hsl(var(--card))" strokeWidth="1.5">
              <title>{`${b.shortDate} — ${fmt(Math.round(b.dollars))}/hr · ${b.leads} lead${b.leads === 1 ? "" : "s"}`}</title>
            </circle>
          ))}

          {/* x-axis labels */}
          {buckets.map((b, i) => (
            <text key={`x${i}`} x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted-foreground"
              style={{ fontSize: 9, fontWeight: i === buckets.length - 1 ? 700 : 400 }}>
              {b.label}
            </text>
          ))}

          {/* axis titles */}
          <text x={PAD_L - 36} y={PAD_T - 4} className="fill-success" style={{ fontSize: 9, fontWeight: 700 }}>$/HR</text>
          <text x={W - PAD_R + 6} y={PAD_T - 4} className="fill-primary" style={{ fontSize: 9, fontWeight: 700 }}>LEADS</text>
        </svg>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: followUps = [] } = useFollowUps();
  const { data: deals = [] } = useDeals();

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

  /* ---- Rep economics: editable inputs persisted to localStorage ---- */
  const [weeklyHours, setWeeklyHours] = useState<number>(40);
  const [commissionPct, setCommissionPct] = useState<number>(8);
  const [editingEcon, setEditingEcon] = useState(false);

  useEffect(() => {
    const h = parseFloat(localStorage.getItem(HOURS_KEY) ?? "");
    const c = parseFloat(localStorage.getItem(COMMISSION_KEY) ?? "");
    if (!Number.isNaN(h) && h > 0) setWeeklyHours(h);
    if (!Number.isNaN(c) && c > 0) setCommissionPct(c);
  }, []);
  useEffect(() => { localStorage.setItem(HOURS_KEY, String(weeklyHours)); }, [weeklyHours]);
  useEffect(() => { localStorage.setItem(COMMISSION_KEY, String(commissionPct)); }, [commissionPct]);

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

    // Money in motion — open pipeline value (best price per open deal)
    const openDeals = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
    const moneyInMotion = openDeals.reduce(
      (s, d) => s + Math.max(d.price_a ?? 0, d.price_b ?? 0, d.price_c ?? 0), 0
    );
    const expectedCommissionInMotion = (moneyInMotion * commissionPct) / 100;

    // Pipeline velocity: $ closed per active selling day this month
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

  /* ---- 14-day series: $/hour vs lead flow ---- */
  const trendSeries = useMemo(() => {
    const DAYS = 14;
    const dayMs = 864e5;
    const hoursPerDay = weeklyHours / 7;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const buckets = Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(today.getTime() - (DAYS - 1 - i) * dayMs);
      return { date: d, label: d.toLocaleDateString(undefined, { weekday: "short" }), shortDate: `${d.getMonth() + 1}/${d.getDate()}`, dollars: 0, leads: 0 };
    });
    const startMs = buckets[0].date.getTime();
    for (const d of deals) {
      if (d.created_at) {
        const t = new Date(d.created_at).getTime();
        const idx = Math.floor((t - startMs) / dayMs);
        if (idx >= 0 && idx < DAYS) buckets[idx].leads += 1;
      }
      if (d.stage === "won" && d.closed_at) {
        const t = new Date(d.closed_at).getTime();
        const idx = Math.floor((t - startMs) / dayMs);
        if (idx >= 0 && idx < DAYS) {
          const commission = ((d.closed_amount ?? 0) * commissionPct) / 100;
          buckets[idx].dollars += hoursPerDay > 0 ? commission / hoursPerDay : 0;
        }
      }
    }
    const maxDollars = Math.max(1, ...buckets.map((b) => b.dollars));
    const maxLeads = Math.max(1, ...buckets.map((b) => b.leads));
    const totalLeads = buckets.reduce((s, b) => s + b.leads, 0);
    const avgDollars = buckets.reduce((s, b) => s + b.dollars, 0) / DAYS;
    return { buckets, maxDollars, maxLeads, totalLeads, avgDollars };
  }, [deals, weeklyHours, commissionPct]);

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  const optTotal = stats.optionMix.A + stats.optionMix.B + stats.optionMix.C;
  const greeting = (user?.user_metadata?.full_name || user?.email || "").split(" ")[0] || "rep";
  const funnelOrder: DealStage[] = ["inspecting", "presented", "follow_up", "won", "lost"];
  const maxFunnel = Math.max(...stats.funnel.map((f) => f.count), 1);

  const objectionRows = Object.entries(stats.objectionCounts).sort((a, b) => b[1].total - a[1].total);
  const maxObj = Math.max(...objectionRows.map(([, v]) => v.total), 1);

  const dealById = new Map(deals.map((d) => [d.id, d]));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card">
          <div className="absolute inset-0 gradient-surface opacity-80" />
          <div className="absolute -top-24 -right-16 w-[28rem] h-[28rem] rounded-full opacity-30 blur-3xl gradient-brand" />
          <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full opacity-20 blur-3xl gradient-accent" />
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }} />

          <div className="relative p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">DaBella Daily HUD</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-foreground tracking-tight leading-[1.05]">
                Hey {greeting} —<br className="hidden sm:block" />
                <span className="gradient-text">today's edge</span> is loaded.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-xl">
                Live performance, pipeline pressure, and the next move that closes more deals.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-5">
                <Link to="/pipeline" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
                  Open Pipeline <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link to="/deals" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card font-bold text-sm hover:bg-accent/10 transition-colors">
                  My Deals
                </Link>
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

        {/* ===== HERO KPIs ===== */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <HeroKPI icon={DollarSign} label="Revenue this month" value={fmt(stats.monthRevenue)}
            sub={`${stats.monthClosed} closed deals`} tone="success" />
          <HeroKPI icon={Target} label="Close rate" value={pct(stats.monthCloseRate)}
            sub={`${stats.monthClosed} won · ${stats.monthLost} lost`} tone="brand" />
          <HeroKPI icon={Activity} label="Active pipeline" value={String(stats.winLoss.pending)}
            sub={`${stats.monthDealsRun} run this month`} tone="brand" />
          <HeroKPI icon={AlertCircle} label="Overdue follow-ups" value={String(followUpInsights.overdue)}
            sub={`${followUpInsights.today} due today`}
            tone={followUpInsights.overdue > 0 ? "destructive" : "success"} />
        </section>

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
              icon={Hourglass}
              label="$ / Hour (this week)"
              accent="success"
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
              icon={Wallet}
              label="Money in Motion"
              accent="primary"
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
              icon={Gauge}
              label="Pipeline Velocity"
              accent="warning"
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

        {/* ===== FOLLOW-UP COMMAND STRIP ===== */}
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
                const d = dealById.get(f.deal_id);
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

        {/* ===== PIPELINE FUNNEL + WIN/LOSS DONUT ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-foreground">Pipeline funnel</h3>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              Where every deal sits — and how well you're moving them through.
            </p>
            <div className="space-y-4">
              {funnelOrder.map((stage) => {
                const count = stats.funnel.find((f) => f.stage === stage)?.count ?? 0;
                const widthPct = (count / maxFunnel) * 100;
                const color =
                  stage === "won" ? "bg-success" :
                  stage === "lost" ? "bg-destructive" :
                  stage === "follow_up" ? "bg-warning" : "bg-primary";
                return (
                  <div key={stage}>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-foreground">{STAGE_LABELS[stage]}</span>
                      <span className="text-muted-foreground tabular-nums">{count}</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${color}`}
                        style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-border">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Inspected → Presented</p>
                <p className="text-2xl font-display font-extrabold text-foreground mt-1">{pct(stats.inspectedToPresented)}</p>
              </div>
              <div className="rounded-xl bg-success/5 border border-success/20 p-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-success">Presented → Won</p>
                <p className="text-2xl font-display font-extrabold text-success mt-1">{pct(stats.presentedToWon)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-1">Win / Loss</h3>
            <p className="text-xs text-muted-foreground mb-5">All-time outcomes & avg deal size.</p>
            <WinRateDonut won={stats.winLoss.won} lost={stats.winLoss.lost} pending={stats.winLoss.pending} />
            <div className="grid grid-cols-3 gap-2 mt-5 text-center">
              <div>
                <div className="flex items-center justify-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Won</p>
                </div>
                <p className="text-lg font-bold text-foreground mt-0.5">{stats.winLoss.won}</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-destructive" />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Lost</p>
                </div>
                <p className="text-lg font-bold text-foreground mt-0.5">{stats.winLoss.lost}</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Open</p>
                </div>
                <p className="text-lg font-bold text-foreground mt-0.5">{stats.winLoss.pending}</p>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-border space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg won</span>
                <span className="font-bold text-success tabular-nums">{fmt(stats.winLoss.avgWon)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg lost (Opt A)</span>
                <span className="font-semibold text-muted-foreground tabular-nums">{fmt(stats.winLoss.avgLost)}</span>
              </div>
            </div>
          </section>
        </div>

        {/* ===== OPTION MIX + OBJECTIONS ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-1">Option mix on closes</h3>
            <p className="text-xs text-muted-foreground mb-5">
              {optTotal === 0
                ? "No closes yet — once you start winning, you'll see if you're leaving Option A on the table."
                : "Are you closing on the right tier?"}
            </p>
            {optTotal === 0 ? (
              <p className="text-sm text-muted-foreground italic">No data yet.</p>
            ) : (
              <div className="space-y-4">
                {(["A", "B", "C"] as const).map((k) => {
                  const count = stats.optionMix[k];
                  const p = (count / optTotal) * 100;
                  const grad = k === "A"
                    ? "from-primary to-[hsl(var(--brand-to))]"
                    : k === "B" ? "from-accent to-[hsl(var(--accent-to))]"
                    : "from-warning to-[hsl(38_92%_60%)]";
                  return (
                    <div key={k}>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="text-foreground">Option {k}</span>
                        <span className="text-muted-foreground tabular-nums">{count} · {Math.round(p)}%</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${grad}`} style={{ width: `${p}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-1">Objection heatmap</h3>
            <p className="text-xs text-muted-foreground mb-5">What's coming up most — and how it correlates with outcomes.</p>
            {objectionRows.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Tag objections from a deal's Objections tab to see patterns here.
              </p>
            ) : (
              <div className="space-y-3">
                {objectionRows.slice(0, 6).map(([type, v]) => {
                  const label = OBJECTIONS.find((o) => o.id === type)?.label ?? type;
                  const w = (v.total / maxObj) * 100;
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="text-foreground">{label}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {v.total} · <span className="text-success">{v.onWins}W</span> / <span className="text-destructive">{v.onLosses}L</span>
                        </span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-warning to-destructive/70"
                          style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ===== BOTTOM MINI ROW ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat icon={Flame} label="7-day close rate" value={pct(stats.weeklyCloseRate)}
            sub={`${stats.weeklyClosed} / ${stats.weeklyRun} this week`} accent="text-warning" />
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
