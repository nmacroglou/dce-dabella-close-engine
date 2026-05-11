import { memo, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowRightCircle, MessageSquareWarning, Mail, Clock4, Search, History } from "lucide-react";
import type { TimelineEvent, TimelineKind } from "@/hooks/useActivityTimeline";

const FILTERS: { key: "all" | TimelineKind; label: string }[] = [
  { key: "all", label: "All" },
  { key: "won", label: "Wins" },
  { key: "lost", label: "Losses" },
  { key: "stage", label: "Stage" },
  { key: "objection", label: "Objections" },
  { key: "followup_done", label: "Follow-ups" },
];

function iconFor(kind: TimelineKind) {
  switch (kind) {
    case "won": return { Icon: CheckCircle2, tone: "text-success bg-success/15 border-success/30" };
    case "lost": return { Icon: XCircle, tone: "text-destructive bg-destructive/15 border-destructive/30" };
    case "stage": return { Icon: ArrowRightCircle, tone: "text-primary bg-primary/15 border-primary/30" };
    case "objection": return { Icon: MessageSquareWarning, tone: "text-warning bg-warning/15 border-warning/30" };
    case "followup_done": return { Icon: Mail, tone: "text-accent bg-accent/15 border-accent/30" };
    case "followup_overdue": return { Icon: Clock4, tone: "text-destructive bg-destructive/10 border-destructive/30" };
  }
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yest = new Date(today.getTime() - 864e5);
  const dStart = new Date(d); dStart.setHours(0, 0, 0, 0);
  if (dStart.getTime() === today.getTime()) return "Today";
  if (dStart.getTime() === yest.getTime()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function ActivityTimelineBase({ events, isLoading }: { events: TimelineEvent[]; isLoading?: boolean }) {
  const [filter, setFilter] = useState<"all" | TimelineKind>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return events.filter((e) => {
      if (filter !== "all" && e.kind !== filter) return false;
      if (ql && !e.homeowner.toLowerCase().includes(ql) && !e.title.toLowerCase().includes(ql)) return false;
      return true;
    });
  }, [events, filter, q]);

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: TimelineEvent[] }>();
    for (const e of filtered) {
      const k = dayKey(e.at);
      if (!map.has(k)) map.set(k, { label: dayLabel(e.at), items: [] });
      map.get(k)!.items.push(e);
    }
    return Array.from(map.values());
  }, [filtered]);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 lg:p-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary/15 grid place-items-center border border-border">
            <History className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Activity timeline</h3>
            <p className="text-[11px] text-muted-foreground">The last 14 days of meaningful events across your book.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search homeowner…"
              className="pl-7 pr-2 py-1.5 text-xs rounded-lg border border-border bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/40 w-44" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-full border transition-colors ${
              filter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background/40 text-muted-foreground border-border hover:text-foreground"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground italic">Loading…</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No activity matches this view yet.</p>
      ) : (
        <div className="space-y-6 max-h-[560px] overflow-y-auto pr-1">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{g.label}</p>
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground">{g.items.length}</span>
              </div>
              <ul className="relative space-y-2 pl-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-border">
                {g.items.map((e) => {
                  const { Icon, tone } = iconFor(e.kind);
                  return (
                    <li key={e.id} className="relative">
                      <span className={`absolute -left-6 top-1.5 h-6 w-6 rounded-full grid place-items-center border ${tone}`}>
                        <Icon className="h-3 w-3" />
                      </span>
                      <Link to="/deals" className="block rounded-lg border border-border bg-background/40 hover:bg-background/70 px-3 py-2 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-foreground truncate">{e.title}</p>
                          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{timeLabel(e.at)}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {e.homeowner}{e.detail ? ` · ${e.detail}` : ""}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export const ActivityTimeline = memo(ActivityTimelineBase);
