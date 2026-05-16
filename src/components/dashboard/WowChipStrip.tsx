import { memo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { WowDelta } from "@/lib/dashboardSeries";

export interface WowChip {
  label: string;
  current: string;
  delta: WowDelta;
}

function Chip({ chip }: { chip: WowChip }) {
  const tone =
    chip.delta.dir === "up" ? "text-success bg-success/10 border-success/30"
    : chip.delta.dir === "down" ? "text-destructive bg-destructive/10 border-destructive/30"
    : "text-muted-foreground bg-muted/40 border-border";
  const Icon = chip.delta.dir === "up" ? TrendingUp : chip.delta.dir === "down" ? TrendingDown : Minus;
  return (
    <div className="rounded-xl border border-hairline bg-background/60 backdrop-blur px-3 py-2.5 hover:border-primary/30 transition-colors">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{chip.label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="text-base font-display font-extrabold text-foreground num-display leading-none">{chip.current}</p>
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border ${tone}`}>
          <Icon className="h-3 w-3" />
          {chip.delta.dir === "flat" ? "flat" : `${chip.delta.pct.toFixed(0)}%`}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5">vs prior period</p>
    </div>
  );
}

function WowChipStripBase({ chips }: { chips: WowChip[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {chips.map((c) => <Chip key={c.label} chip={c} />)}
    </div>
  );
}

export const WowChipStrip = memo(WowChipStripBase);
