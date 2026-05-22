import { memo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  icon: React.ElementType;
  label: string;
  value: string;
  accent: string;
  sub?: string;
  trend?: { value: string; direction: "up" | "down" | "flat" };
}

const trendIcon = { up: TrendingUp, down: TrendingDown, flat: Minus } as const;
const trendColor = { up: "text-success", down: "text-destructive", flat: "text-muted-foreground" } as const;

function StatTileBase({ icon: Icon, label, value, accent, sub, trend }: StatTileProps) {
  const TIcon = trend ? trendIcon[trend.direction] : null;
  return (
    <div className="group relative overflow-hidden card-elevated p-4 hover:-translate-y-0.5">
      <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-current opacity-[0.06] blur-2xl transition-opacity group-hover:opacity-[0.10]" style={{ color: "currentColor" }} />
      <div className="relative flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg bg-muted/70", accent)}>
          <Icon className={cn("h-3.5 w-3.5", accent)} />
        </span>
      </div>
      <p className={cn("relative font-display font-extrabold tabular-nums text-2xl leading-tight", accent)}>{value}</p>
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
}

export const StatTile = memo(StatTileBase);
