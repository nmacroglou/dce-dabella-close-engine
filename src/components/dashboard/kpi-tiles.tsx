import { memo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

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

export const HeroKPI = memo(HeroKPIBase);
export const MiniStat = memo(MiniStatBase);
export const WinRateDonut = memo(WinRateDonutBase);
export const EconomicsKPI = memo(EconomicsKPIBase);

