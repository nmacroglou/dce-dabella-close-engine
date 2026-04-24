import { useStageHistory } from "@/hooks/useStageHistory";
import { STAGE_LABELS, STAGE_COLORS, type DealStage } from "@/types/deal";
import type { Deal } from "@/types/deal";
import { Clock, TrendingDown, TrendingUp, ArrowRight } from "lucide-react";
import { fmt as formatCurrency } from "@/lib/format";

interface StageHistoryTimelineProps {
  deal: Deal;
}

function formatRelative(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function formatExact(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function durationBetween(fromIso: string, toIso: string): string {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  if (ms < 0) return "";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

export default function StageHistoryTimeline({ deal }: StageHistoryTimelineProps) {
  const { data: history, isLoading } = useStageHistory(deal.id);

  if (isLoading) {
    return (
      <p className="text-xs text-muted-foreground p-2">Loading timeline…</p>
    );
  }

  if (!history || history.length === 0) {
    return (
      <p className="text-xs text-muted-foreground p-2">No stage changes yet.</p>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 px-1 pb-2 mb-1 border-b border-border">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Stage timeline
        </p>
      </div>
      <ol className="relative space-y-3 pl-5">
        <span className="absolute left-[7px] top-2 bottom-2 w-px bg-border" aria-hidden />
        {history.map((entry, idx) => {
          const next = history[idx + 1];
          const duration = next ? durationBetween(entry.changed_at, next.changed_at) : "";
          const isCurrent = idx === history.length - 1;
          const isWon = entry.to_stage === "won";
          const isLost = entry.to_stage === "lost";

          return (
            <li key={entry.id} className="relative">
              <span
                className={`absolute -left-[18px] top-1 h-3 w-3 rounded-full ring-2 ring-background ${
                  isWon
                    ? "bg-success"
                    : isLost
                    ? "bg-destructive"
                    : isCurrent
                    ? "bg-primary"
                    : "bg-muted-foreground/40"
                }`}
                aria-hidden
              />
              <div className="flex items-center gap-2 flex-wrap">
                {entry.from_stage && (
                  <>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {STAGE_LABELS[entry.from_stage]}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </>
                )}
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STAGE_COLORS[entry.to_stage as DealStage]}`}
                >
                  {STAGE_LABELS[entry.to_stage as DealStage]}
                </span>
                {isCurrent && (
                  <span className="text-[10px] font-semibold text-primary">Current</span>
                )}
              </div>
              <p
                className="text-[11px] text-muted-foreground mt-0.5"
                title={formatExact(entry.changed_at)}
              >
                {formatRelative(entry.changed_at)}
                {duration && <span className="ml-2">· stayed {duration}</span>}
              </p>

              {isWon && deal.closed_amount != null && (
                <div className="mt-1.5 flex items-center gap-1.5 rounded-md bg-success/10 px-2 py-1">
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                  <span className="text-xs font-bold text-success">
                    {formatCurrency(deal.closed_amount)}
                  </span>
                  {deal.selected_option && (
                    <span className="text-[10px] font-semibold text-success/80">
                      Option {deal.selected_option}
                    </span>
                  )}
                </div>
              )}

              {isLost && deal.lost_reason && (
                <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-destructive/10 px-2 py-1">
                  <TrendingDown className="h-3.5 w-3.5 text-destructive flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-destructive">
                    {deal.lost_reason}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
