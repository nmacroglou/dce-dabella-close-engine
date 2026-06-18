import { memo } from "react";
import { TrendingUp, TrendingDown, Target, DollarSign, Activity, AlertCircle, Minus, Info } from "lucide-react";
import { fmt } from "@/lib/format";

/** Small (?) icon with a native tooltip explaining the formula behind a KPI. */
function FormulaHint({ formula }: { formula: string }) {
  return (
    <span
      tabIndex={0}
      role="img"
      aria-label={`Formula: ${formula}`}
      title={formula}
      className="inline-flex items-center justify-center h-4 w-4 rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors cursor-help ml-1 align-middle"
    >
      <Info className="h-3 w-3" />
    </span>
  );
}




/* ---------- Hero KPI tile (large, gradient-accent) ---------- */
function HeroKPIBase({
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
    <div className="card-premium p-5 group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
      <div className={`absolute -top-12 -right-12 h-44 w-44 rounded-full bg-gradient-to-br ${toneMap[tone]} blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <div className={`h-9 w-9 rounded-xl grid place-items-center bg-background/70 backdrop-blur border border-hairline ${toneMap[tone].split(" ").pop()} transition-transform group-hover:scale-110`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-display font-extrabold tracking-tight text-foreground leading-none num-display">{value}</p>
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
function MiniStatBase({ icon: Icon, label, value, sub, accent = "text-primary" }: {
  icon: React.ElementType; label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-card p-4 hover:border-primary/40 hover:shadow-[var(--shadow-sm)] transition-all">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-display font-extrabold text-foreground tracking-tight num-display">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

/* ---------- Win rate donut (SVG) ---------- */
function WinRateDonutBase({ won, lost, pending }: { won: number; lost: number; pending: number }) {
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

/* ---------- Rep Economics KPI tile (premium) ---------- */
function EconomicsKPIBase({
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
    <div className={`relative overflow-hidden rounded-2xl border ${accentMap.border} bg-card p-5 ring-1 ${accentMap.ring} shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 hover:-translate-y-0.5`}>
      <div className={`absolute -top-16 -right-12 h-44 w-44 rounded-full bg-gradient-to-br ${accentMap.glow} to-transparent blur-3xl`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg grid place-items-center bg-background/85 backdrop-blur border border-hairline ${accentMap.icon}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          </div>
        </div>
        <p className="text-4xl font-display font-extrabold tracking-tight text-foreground leading-none num-display">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-2">{sub}</p>}
        {footer && <div className="mt-3 pt-3 border-t border-hairline">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Dual-metric KPI: two related numbers side by side ---------- */
function DualKPIBase({
  icon: Icon, label, primary, secondary, tone = "brand",
}: {
  icon: React.ElementType;
  label: string;
  primary: { value: string; caption: string; sub?: string };
  secondary: { value: string; caption: string; sub?: string };
  tone?: "brand" | "success" | "warning" | "destructive";
}) {
  const toneMap = {
    brand: "from-primary/20 to-primary/0 text-primary",
    success: "from-success/20 to-success/0 text-success",
    warning: "from-warning/20 to-warning/0 text-warning",
    destructive: "from-destructive/20 to-destructive/0 text-destructive",
  };
  return (
    <div className="card-premium p-5 group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
      <div className={`absolute -top-12 -right-12 h-44 w-44 rounded-full bg-gradient-to-br ${toneMap[tone]} blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <div className={`h-9 w-9 rounded-xl grid place-items-center bg-background/70 backdrop-blur border border-hairline ${toneMap[tone].split(" ").pop()} transition-transform group-hover:scale-110`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-2xl font-display font-extrabold tracking-tight text-foreground leading-none num-display">{primary.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1.5">{primary.caption}</p>
            {primary.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{primary.sub}</p>}
          </div>
          <div className="border-l border-hairline pl-3">
            <p className="text-2xl font-display font-extrabold tracking-tight text-foreground leading-none num-display">{secondary.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1.5">{secondary.caption}</p>
            {secondary.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{secondary.sub}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Sit-to-Close KPI (the one that matters) ----------
   Industry-standard in-home sales metric. Cohort-based: only counts
   presentations that have had time to resolve, so small samples don't
   show wild swings. Includes confidence chip + a "still deciding" hint. */
function SitToCloseKPIBase({
  rate, cohortWon, cohortSize, stillDeciding, oneCallPct, oneCallWins, confidence, rangeDays,
}: {
  rate: number;
  cohortWon: number;
  cohortSize: number;
  stillDeciding: number;
  oneCallPct: number;
  oneCallWins: number;
  confidence: "low" | "med" | "high";
  rangeDays: number | "all";
}) {
  const confMap = {
    low: { label: "Low confidence", cls: "bg-warning/15 text-warning border-warning/30" },
    med: { label: "Medium confidence", cls: "bg-primary/15 text-primary border-primary/30" },
    high: { label: "High confidence", cls: "bg-success/15 text-success border-success/30" },
  }[confidence];
  const pctNum = Math.round(rate * 100);
  const rangeLabel = rangeDays === "all" ? "All time" : `${rangeDays}d`;
  const formulaRange = rangeDays === "all" ? "all time" : `last ${rangeDays}d`;
  return (
    <div className="card-premium p-5 group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
      <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-gradient-to-br from-primary/25 to-primary/0 blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Sit-to-Close · {rangeLabel}<FormulaHint formula={`Cohort wins ÷ resolved presentations in ${formulaRange}. Only counts presentations old enough to decide (excludes 'still deciding'). Confidence chip reflects cohort size.`} /></p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">Wins ÷ presentations old enough to decide</p>
          </div>
          <div className="h-9 w-9 rounded-xl grid place-items-center bg-background/70 backdrop-blur border border-hairline text-primary transition-transform group-hover:scale-110">
            <Target className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-display font-extrabold tracking-tight text-foreground leading-none num-display">{pctNum}%</p>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${confMap.cls}`}>
            {confMap.label}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {cohortWon} wins of {cohortSize} resolved presentations
        </p>
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-success transition-all" style={{ width: `${pctNum}%` }} />
        </div>
        <div className="mt-3 pt-3 border-t border-hairline grid grid-cols-2 gap-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">One-call close</p>
            <p className="text-sm font-display font-bold text-foreground mt-0.5">
              {Math.round(oneCallPct * 100)}%
              <span className="text-[10px] font-medium text-muted-foreground ml-1">({oneCallWins})</span>
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Still deciding</p>
            <p className="text-sm font-display font-bold text-foreground mt-0.5">
              {stillDeciding}
              <span className="text-[10px] font-medium text-muted-foreground ml-1">pending</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Revenue KPI (windowed, with pace + best day + avg ticket) ---------- */
function RevenueKPIBase({
  revenue, won, avgTicket, bestDay, bestDayLabel, priorRevenue, paceDelta, rangeDays,
}: {
  revenue: number; won: number; avgTicket: number; bestDay: number; bestDayLabel: string;
  priorRevenue: number; paceDelta: number; rangeDays: number | "all";
}) {
  const dir = paceDelta > 0.01 ? "up" : paceDelta < -0.01 ? "down" : "flat";
  const PaceIcon = dir === "up" ? TrendingUp : dir === "down" ? TrendingDown : Minus;
  const paceCls =
    dir === "up" ? "bg-success/15 text-success border-success/30"
    : dir === "down" ? "bg-destructive/15 text-destructive border-destructive/30"
    : "bg-muted/40 text-muted-foreground border-border";
  const bestPct = revenue > 0 ? Math.min(100, Math.round((bestDay / revenue) * 100)) : 0;
  const rangeLabel = rangeDays === "all" ? "All time" : `${rangeDays}d`;
  const formulaRange = rangeDays === "all" ? "all time" : `last ${rangeDays}d`;
  const priorText = rangeDays === "all" ? null : `prior ${rangeDays}d ${fmt(Math.round(priorRevenue))}`;
  return (
    <div className="card-premium p-5 group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
      <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-gradient-to-br from-success/25 to-success/0 blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Revenue · {rangeLabel}<FormulaHint formula={`Sum of closed_amount for deals where stage = 'won' and closed_at within ${formulaRange}. Pace = (current − prior window) ÷ prior.`} /></p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">Closed-won dollars in window</p>
          </div>
          <div className="h-9 w-9 rounded-xl grid place-items-center bg-background/70 backdrop-blur border border-hairline text-success transition-transform group-hover:scale-110">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-display font-extrabold tracking-tight text-foreground leading-none num-display">{fmt(Math.round(revenue))}</p>
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border ${paceCls}`}>
            <PaceIcon className="h-3 w-3" />
            {dir === "flat" ? "flat" : `${Math.abs(Math.round(paceDelta * 100))}%`}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {won} deals{priorText ? ` · ${priorText}` : ""}
        </p>
        {/* Best-day share bar */}
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden" title={`Best day ${bestDayLabel} = ${bestPct}% of window`}>
          <div className="h-full bg-gradient-to-r from-success to-primary transition-all" style={{ width: `${bestPct}%` }} />
        </div>
        <div className="mt-3 pt-3 border-t border-hairline grid grid-cols-2 gap-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Avg ticket</p>
            <p className="text-sm font-display font-bold text-foreground mt-0.5">{fmt(Math.round(avgTicket))}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Best day</p>
            <p className="text-sm font-display font-bold text-foreground mt-0.5">
              {fmt(Math.round(bestDay))}
              <span className="text-[10px] font-medium text-muted-foreground ml-1">{bestDayLabel}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Active Pipeline KPI (stage mix + value + aging) ---------- */
function PipelineKPIBase({
  active, pipelineValue, stageCounts, avgAge, oldestAge, rangeDays, dealsRunInWindow,
}: {
  active: number;
  pipelineValue: number;
  stageCounts: { inspecting: number; presented: number; follow_up: number };
  avgAge: number;
  oldestAge: number;
  rangeDays: number | "all";
  dealsRunInWindow: number;
}) {
  const total = Math.max(active, 1);
  const insp = (stageCounts.inspecting / total) * 100;
  const pres = (stageCounts.presented / total) * 100;
  const fu = (stageCounts.follow_up / total) * 100;
  const ageTone =
    oldestAge >= 21 ? "bg-destructive/15 text-destructive border-destructive/30"
    : oldestAge >= 10 ? "bg-warning/15 text-warning border-warning/30"
    : "bg-success/15 text-success border-success/30";
  const rangeLabel = rangeDays === "all" ? "All time" : `${rangeDays}d`;
  return (
    <div className="card-premium p-5 group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
      <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-gradient-to-br from-primary/25 to-primary/0 blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Active pipeline<FormulaHint formula="Open deals with stage in (inspecting, presented, follow_up). Potential = sum of selected option price; age measured from stage_changed_at." /></p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">Open deals not yet decided</p>
          </div>
          <div className="h-9 w-9 rounded-xl grid place-items-center bg-background/70 backdrop-blur border border-hairline text-primary transition-transform group-hover:scale-110">
            <Activity className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-display font-extrabold tracking-tight text-foreground leading-none num-display">{active}</p>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${ageTone}`}>
            oldest {oldestAge}d
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {fmt(Math.round(pipelineValue))} potential · {dealsRunInWindow} run in {rangeLabel}
        </p>
        {/* Stage mix bar: inspecting / presented / follow_up */}
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden flex" title={`${stageCounts.inspecting} inspecting · ${stageCounts.presented} presented · ${stageCounts.follow_up} follow-up`}>
          <div className="h-full bg-muted-foreground/60" style={{ width: `${insp}%` }} />
          <div className="h-full bg-primary" style={{ width: `${pres}%` }} />
          <div className="h-full bg-warning" style={{ width: `${fu}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />Insp {stageCounts.inspecting}</span>
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Pres {stageCounts.presented}</span>
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-warning" />F-up {stageCounts.follow_up}</span>
        </div>
        <div className="mt-3 pt-3 border-t border-hairline grid grid-cols-2 gap-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Avg age</p>
            <p className="text-sm font-display font-bold text-foreground mt-0.5">{avgAge}d</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Stale risk</p>
            <p className="text-sm font-display font-bold text-foreground mt-0.5">
              {stageCounts.follow_up}
              <span className="text-[10px] font-medium text-muted-foreground ml-1">in follow-up</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Follow-up Health KPI (overdue + due today + compliance) ---------- */
function FollowUpHealthKPIBase({
  overdue, today, thisWeek, oldestOverdueDays, compliancePct,
}: {
  overdue: number; today: number; thisWeek: number; oldestOverdueDays: number; compliancePct: number;
}) {
  const tone =
    overdue >= 5 || oldestOverdueDays >= 7 ? "destructive"
    : overdue > 0 ? "warning"
    : "success";
  const toneMap = {
    destructive: { glow: "from-destructive/25", icon: "text-destructive", chip: "bg-destructive/15 text-destructive border-destructive/30", label: oldestOverdueDays >= 7 ? "Critical" : "Action needed" },
    warning: { glow: "from-warning/25", icon: "text-warning", chip: "bg-warning/15 text-warning border-warning/30", label: "Watch list" },
    success: { glow: "from-success/25", icon: "text-success", chip: "bg-success/15 text-success border-success/30", label: "All clear" },
  }[tone];
  return (
    <div className="card-premium p-5 group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
      <div className={`absolute -top-12 -right-12 h-44 w-44 rounded-full bg-gradient-to-br ${toneMap.glow} to-transparent blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Follow-up health<FormulaHint formula="Overdue = due_at < now and not completed. SLA compliance = completed ÷ (completed + due). Tone goes destructive at 5+ overdue or oldest ≥ 7d." /></p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">Past-due, today, and SLA compliance</p>
          </div>
          <div className={`h-9 w-9 rounded-xl grid place-items-center bg-background/70 backdrop-blur border border-hairline ${toneMap.icon} transition-transform group-hover:scale-110`}>
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-display font-extrabold tracking-tight text-foreground leading-none num-display">{overdue}</p>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${toneMap.chip}`}>
            {toneMap.label}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {overdue === 0 ? "No past-due touchpoints" : `Oldest overdue ${oldestOverdueDays}d`}
        </p>
        {/* Compliance bar */}
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden" title={`${compliancePct}% completed on time`}>
          <div className={`h-full transition-all ${compliancePct >= 80 ? "bg-success" : compliancePct >= 50 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${compliancePct}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{compliancePct}% SLA compliance</p>
        <div className="mt-3 pt-3 border-t border-hairline grid grid-cols-2 gap-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Due today</p>
            <p className="text-sm font-display font-bold text-foreground mt-0.5">{today}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Next 7 days</p>
            <p className="text-sm font-display font-bold text-foreground mt-0.5">{thisWeek}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const HeroKPI = memo(HeroKPIBase);
export const MiniStat = memo(MiniStatBase);
export const WinRateDonut = memo(WinRateDonutBase);
export const EconomicsKPI = memo(EconomicsKPIBase);
export const DualKPI = memo(DualKPIBase);
export const SitToCloseKPI = memo(SitToCloseKPIBase);
export const RevenueKPI = memo(RevenueKPIBase);
export const PipelineKPI = memo(PipelineKPIBase);
export const FollowUpHealthKPI = memo(FollowUpHealthKPIBase);




