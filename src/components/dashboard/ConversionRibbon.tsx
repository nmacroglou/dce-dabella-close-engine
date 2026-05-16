import { memo, useMemo } from "react";
import { ChevronRight, Workflow } from "lucide-react";
import type { Deal, DealStage } from "@/types/deal";
import { STAGE_LABELS } from "@/types/deal";

const FUNNEL: DealStage[] = ["inspecting", "presented", "follow_up", "won"];

function avgDaysFor(deals: Deal[], stage: DealStage): number {
  const inStage = deals.filter((d) => d.stage === stage);
  if (inStage.length === 0) return 0;
  const now = Date.now();
  const sum = inStage.reduce((s, d) => s + Math.max(0, (now - new Date(d.stage_changed_at).getTime()) / 864e5), 0);
  return sum / inStage.length;
}

function ConversionRibbonBase({ deals }: { deals: Deal[] }) {
  const data = useMemo(() => {
    const counts: Record<DealStage, number> = {
      inspecting: 0, presented: 0, follow_up: 0, won: 0, lost: 0,
    };
    for (const d of deals) counts[d.stage] += 1;
    // "ever reached" semantics: deals at stage X or later
    const orderIdx: Record<DealStage, number> = { inspecting: 0, presented: 1, follow_up: 2, won: 3, lost: -1 };
    const everReached = (s: DealStage) =>
      deals.filter((d) => d.stage !== "lost" && orderIdx[d.stage] >= orderIdx[s]).length
      + (s !== "won" ? deals.filter((d) => d.stage === "lost").length : 0);

    return FUNNEL.map((stage, i) => {
      const reached = everReached(stage);
      const prev = i === 0 ? deals.length : everReached(FUNNEL[i - 1]);
      const conv = prev > 0 ? reached / prev : 0;
      return {
        stage,
        count: counts[stage],
        reached,
        conv,
        avgDays: avgDaysFor(deals, stage),
      };
    });
  }, [deals]);

  const max = Math.max(1, ...data.map((d) => d.reached));

  return (
    <section className="card-premium p-5 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-9 w-9 rounded-xl gradient-brand grid place-items-center shadow-[var(--shadow-glow)]">
          <Workflow className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-base font-bold font-display text-foreground">Conversion ribbon</h3>
          <p className="text-[11px] text-muted-foreground">Stage-to-stage conversion and average days in stage.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[repeat(4,1fr_auto)_1fr] items-center gap-3">
        {data.map((d, i) => (
          <div key={d.stage} className="contents">
            <div className="rounded-xl border border-hairline bg-gradient-to-br from-background/80 to-background/30 p-3 hover:border-primary/30 transition-colors">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{STAGE_LABELS[d.stage]}</p>
              <div className="flex items-baseline justify-between gap-2 mt-1">
                <p className="text-2xl font-display font-extrabold gradient-text num-display">{d.reached}</p>
                <span className="text-[10px] text-muted-foreground">{d.count} now</span>
              </div>
              <div className="h-1.5 mt-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${
                  d.stage === "won" ? "bg-success" : d.stage === "follow_up" ? "bg-warning" : "gradient-brand"
                }`} style={{ width: `${(d.reached / max) * 100}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">avg {d.avgDays.toFixed(1)}d in stage</p>
            </div>
            {i < data.length - 1 && (
              <div className="hidden md:flex flex-col items-center text-muted-foreground">
                <ChevronRight className="h-4 w-4" />
                <span className="text-[10px] font-bold text-foreground tabular-nums">
                  {Math.round(data[i + 1].conv * 100)}%
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export const ConversionRibbon = memo(ConversionRibbonBase);
