import { memo } from "react";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "default" | "primary" | "accent" | "warning" | "destructive";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  tone?: Tone;
  icon?: LucideIcon;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  className?: string;
}

const toneMap: Record<Tone, { ring: string; text: string; iconBg: string; corner: string }> = {
  default:     { ring: "border-hairline",       text: "text-foreground", iconBg: "bg-muted text-muted-foreground", corner: "from-foreground/5" },
  primary:     { ring: "border-primary/30",     text: "text-primary",    iconBg: "bg-primary/10 text-primary",      corner: "from-primary/15" },
  accent:      { ring: "border-accent/30",      text: "text-accent",     iconBg: "bg-accent/10 text-accent",        corner: "from-accent/15" },
  warning:     { ring: "border-warning/30",     text: "text-warning",    iconBg: "bg-warning/10 text-warning",      corner: "from-warning/15" },
  destructive: { ring: "border-destructive/30", text: "text-destructive",iconBg: "bg-destructive/10 text-destructive", corner: "from-destructive/15" },
};

const TrendIcon = { up: TrendingUp, down: TrendingDown, flat: Minus } as const;
const trendColor = { up: "text-success", down: "text-destructive", flat: "text-muted-foreground" } as const;

/** Reusable stat card with label, large value, optional icon, trend, and subtitle. */
export default memo(function StatCard({
  label, value, sub, accent, tone, icon: Icon, trend, className,
}: StatCardProps) {
  const resolvedTone: Tone = tone ?? (accent ? "primary" : "default");
  const t = toneMap[resolvedTone];
  const TIcon = trend ? TrendIcon[trend.direction] : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card p-4 transition-all duration-200",
        "shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
        t.ring,
        className,
      )}
    >
      {/* corner glow */}
      <div className={cn("pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-radial blur-2xl bg-gradient-to-br to-transparent", t.corner)} />

      <div className="relative flex items-start justify-between gap-2 mb-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider leading-tight">{label}</p>
        {Icon && (
          <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", t.iconBg)}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      <p className={cn("relative font-display font-extrabold tabular-nums leading-tight text-2xl", t.text)}>
        {value}
      </p>

      {(sub || trend) && (
        <div className="relative mt-1 flex items-center gap-1.5 text-xs">
          {trend && TIcon && (
            <span className={cn("inline-flex items-center gap-0.5 font-bold tabular-nums", trendColor[trend.direction])}>
              <TIcon className="h-3 w-3" />
              {trend.value}
            </span>
          )}
          {sub && <span className="text-muted-foreground truncate">{sub}</span>}
        </div>
      )}
    </div>
  );
});
