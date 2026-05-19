import { memo } from "react";
import { TrendingUp, TrendingDown, Target, DollarSign, Activity, AlertCircle, Minus } from "lucide-react";
import { fmt } from "@/lib/format";


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
  rangeDays: number;
}) {
  const confMap = {
    low: { label: "Low confidence", cls: "bg-warning/15 text-warning border-warning/30" },
    med: { label: "Medium confidence", cls: "bg-primary/15 text-primary border-primary/30" },
    high: { label: "High confidence", cls: "bg-success/15 text-success border-success/30" },
  }[confidence];
  const pctNum = Math.round(rate * 100);
  return (
    <div className="card-premium p-5 group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
      <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-gradient-to-br from-primary/25 to-primary/0 blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Sit-to-Close · {rangeDays}d</p>
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

export const HeroKPI = memo(HeroKPIBase);
export const MiniStat = memo(MiniStatBase);
export const WinRateDonut = memo(WinRateDonutBase);
export const EconomicsKPI = memo(EconomicsKPIBase);
export const DualKPI = memo(DualKPIBase);
export const SitToCloseKPI = memo(SitToCloseKPIBase);



