import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BellRing, CalendarClock, MapPin, StickyNote } from "lucide-react";
import { useDeals } from "@/hooks/useDeals";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import type { Deal } from "@/types/deal";

const DEFAULT_MILESTONES = [5, 3, 1] as const;

function dealMilestones(d: Deal): number[] {
  const raw = (d.engine_state as { install_alert_days?: number[] } | null)?.install_alert_days;
  return Array.isArray(raw) && raw.length ? raw : [...DEFAULT_MILESTONES];
}


function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function dealName(d: Deal) {
  return `${d.homeowner1 || "Untitled"}${d.homeowner2 ? ` & ${d.homeowner2}` : ""}`;
}

type Bucket = {
  label: string;
  sub: string;
  tone: "danger" | "warn" | "info";
  deals: (Deal & { _days: number })[];
};

interface Props {
  compact?: boolean;
}

export default function InstallAlerts({ compact = false }: Props) {
  const { data: deals = [] } = useDeals();
  const { setActiveDealId } = useActiveDeal();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets = useMemo<Bucket[]>(() => {
    const scheduled = deals
      .filter((d) => !!d.install_date && d.stage !== "lost" && d.stage !== "disqualified")
      .map((d) => {
        const dt = parseYmd(d.install_date!);
        const days = Math.round((dt.getTime() - today.getTime()) / 86400000);
        return { ...d, _days: days };
      });

    const overdue = scheduled.filter((d) => d._days < 0);
    const todayList = scheduled.filter((d) => d._days === 0);
    const milestoneLists = MILESTONES.map((m) => ({
      m,
      list: scheduled.filter((d) => d._days === m),
    }));

    const out: Bucket[] = [];
    if (overdue.length) out.push({ label: "Past install date", sub: "Confirm completion or reschedule", tone: "danger", deals: overdue });
    if (todayList.length) out.push({ label: "Installing today", sub: "Crews on site — confirm homeowner is ready", tone: "danger", deals: todayList });
    for (const { m, list } of milestoneLists) {
      if (!list.length) continue;
      out.push({
        label: m === 1 ? "1 day out" : `${m} days out`,
        sub: m === 5 ? "Pre-install confirmation call" : m === 3 ? "Materials & crew lock-in" : "Final walkthrough & reminder",
        tone: m === 1 ? "warn" : "info",
        deals: list,
      });
    }
    return out;
  }, [deals, today]);

  if (buckets.length === 0) {
    if (compact) return null;
    return (
      <div className="rounded-2xl border border-hairline bg-card p-4 shadow-[var(--shadow-sm)] flex items-center gap-3">
        <BellRing className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          No install alerts in the next 5 days. You're clear.
        </p>
      </div>
    );
  }

  const toneClass = (t: Bucket["tone"]) =>
    t === "danger"
      ? "border-destructive/40 bg-destructive/5"
      : t === "warn"
        ? "border-warning/40 bg-warning/5"
        : "border-primary/30 bg-primary/5";

  const toneChip = (t: Bucket["tone"]) =>
    t === "danger"
      ? "bg-destructive/15 text-destructive"
      : t === "warn"
        ? "bg-warning/15 text-warning"
        : "bg-primary/15 text-primary";

  const toneIcon = (t: Bucket["tone"]) =>
    t === "danger" ? AlertTriangle : t === "warn" ? BellRing : CalendarClock;

  return (
    <section className="rounded-2xl border border-hairline bg-card p-4 sm:p-5 shadow-[var(--shadow-md)]">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning/60 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-warning" />
          </span>
          <h2 className="text-sm font-bold text-foreground">Install alerts</h2>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            5 · 3 · 1 day heads-up
          </span>
        </div>
        <Link to="/installs" className="text-xs font-semibold text-primary hover:underline">
          Open calendar →
        </Link>
      </div>

      <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {buckets.map((b) => {
          const Icon = toneIcon(b.tone);
          return (
            <div key={b.label} className={`rounded-xl border p-3 ${toneClass(b.tone)}`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`h-4 w-4 shrink-0 ${b.tone === "danger" ? "text-destructive" : b.tone === "warn" ? "text-warning" : "text-primary"}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{b.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{b.sub}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${toneChip(b.tone)}`}>
                  {b.deals.length}
                </span>
              </div>
              <ul className="space-y-1.5">
                {b.deals.slice(0, compact ? 2 : 4).map((d) => {
                  const dt = parseYmd(d.install_date!);
                  return (
                    <li key={d.id}>
                      <Link
                        to="/"
                        onClick={() => setActiveDealId(d.id)}
                        className="block rounded-md px-2 py-1.5 hover:bg-background/60 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-foreground truncate">{dealName(d)}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {dt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        {d.address && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" /> {d.address}
                          </p>
                        )}
                        {d.install_notes && !compact && (
                          <p className="text-[10px] text-muted-foreground flex items-start gap-1 mt-0.5">
                            <StickyNote className="h-3 w-3 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{d.install_notes}</span>
                          </p>
                        )}
                      </Link>
                    </li>
                  );
                })}
                {b.deals.length > (compact ? 2 : 4) && (
                  <li className="text-[10px] text-muted-foreground px-2">
                    +{b.deals.length - (compact ? 2 : 4)} more
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
