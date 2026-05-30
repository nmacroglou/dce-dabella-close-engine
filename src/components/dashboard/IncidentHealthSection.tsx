import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, AlertTriangle, Timer, CheckCircle2, ArrowUpRight, Flame } from "lucide-react";
import { useIncidents } from "@/hooks/useIncidents";
import { useDeals } from "@/hooks/useDeals";
import { INCIDENT_TYPE_LABELS, type IncidentType } from "@/types/incident";
import { formatCurrency, formatCount } from "@/lib/format";

const SEVERITY_TONE: Record<string, string> = {
  critical: "text-destructive",
  high: "text-warning",
  medium: "text-primary",
  low: "text-muted-foreground",
};

export default function IncidentHealthSection() {
  const { data: incidents = [], isLoading } = useIncidents();
  const { data: deals = [] } = useDeals();

  const k = useMemo(() => {
    const now = Date.now();
    const thirtyAgo = now - 30 * 864e5;
    const sevenAgo = now - 7 * 864e5;

    const open = incidents.filter((i) => i.status !== "resolved");
    const resolved = incidents.filter((i) => i.status === "resolved");
    const critical = open.filter((i) => i.severity === "critical" || i.severity === "high");
    const overdue = open.filter((i) => i.due_at && new Date(i.due_at).getTime() < now);
    const newThisWeek = incidents.filter((i) => new Date(i.created_at).getTime() >= sevenAgo).length;
    const resolved30 = resolved.filter((i) => i.resolved_at && new Date(i.resolved_at).getTime() >= thirtyAgo);

    // Avg resolution time (hours) over the last 30 days
    const resoHours = resolved30
      .map((i) => (new Date(i.resolved_at!).getTime() - new Date(i.created_at).getTime()) / 36e5)
      .filter((h) => Number.isFinite(h) && h >= 0);
    const avgResHours = resoHours.length > 0 ? resoHours.reduce((a, b) => a + b, 0) / resoHours.length : 0;

    // Oldest open incident age (days)
    const oldestAgeDays = open.length
      ? Math.max(...open.map((i) => Math.floor((now - new Date(i.created_at).getTime()) / 864e5)))
      : 0;

    // Backend $ at risk — sum closed_amount of deals attached to open incidents
    const dealById = new Map(deals.map((d) => [d.id, d]));
    const atRiskDealIds = new Set(open.map((i) => i.deal_id).filter(Boolean) as string[]);
    let atRisk = 0;
    for (const id of atRiskDealIds) {
      const d = dealById.get(id);
      if (d?.closed_amount) atRisk += d.closed_amount;
    }

    // Resolution rate (30d cohort: created in 30d → % resolved)
    const cohort = incidents.filter((i) => new Date(i.created_at).getTime() >= thirtyAgo);
    const cohortResolved = cohort.filter((i) => i.status === "resolved").length;
    const resolutionRate = cohort.length > 0 ? cohortResolved / cohort.length : 0;

    // Top incident types (open only)
    const typeCounts = new Map<IncidentType, number>();
    for (const i of open) typeCounts.set(i.incident_type, (typeCounts.get(i.incident_type) ?? 0) + 1);
    const topTypes = [...typeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const topTypesMax = topTypes[0]?.[1] ?? 1;

    // Hot list — critical/high open, oldest first
    const hot = [...critical]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, 4);

    return {
      openCount: open.length,
      criticalCount: critical.length,
      overdueCount: overdue.length,
      newThisWeek,
      avgResHours,
      oldestAgeDays,
      atRisk,
      resolutionRate,
      resolvedCount30: resolved30.length,
      topTypes,
      topTypesMax,
      hot,
    };
  }, [incidents, deals]);

  if (isLoading) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-destructive/15 grid place-items-center">
            <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
          </div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Incident Health</h3>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            — protect your backends · resolve faster · get paid
          </span>
        </div>
        <Link to="/incidents" className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline">
          Open tracker <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPITile
          icon={AlertTriangle}
          accent="destructive"
          label="Open Incidents"
          value={formatCount(k.openCount)}
          sub={
            k.openCount === 0
              ? "All clear — nothing on your plate"
              : `${k.criticalCount} critical · oldest ${k.oldestAgeDays}d`
          }
          footer={
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">New this week</span>
              <span className="font-bold text-foreground">{formatCount(k.newThisWeek)}</span>
            </div>
          }
        />
        <KPITile
          icon={Flame}
          accent="warning"
          label="Backend $ at Risk"
          value={formatCurrency(k.atRisk)}
          sub={
            k.atRisk === 0
              ? "No closed deals tied to open incidents"
              : "Tied to deals with unresolved issues"
          }
          footer={
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Overdue items</span>
              <span className={`font-bold ${k.overdueCount > 0 ? "text-destructive" : "text-foreground"}`}>
                {formatCount(k.overdueCount)}
              </span>
            </div>
          }
        />
        <KPITile
          icon={Timer}
          accent="primary"
          label="Avg Resolution"
          value={formatHours(k.avgResHours)}
          sub={`Across ${formatCount(k.resolvedCount30)} resolved in 30d`}
          footer={
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Goal</span>
              <span className="font-bold text-primary">&lt; 48h</span>
            </div>
          }
        />
        <KPITile
          icon={CheckCircle2}
          accent="success"
          label="Resolution Rate"
          value={`${Math.round(k.resolutionRate * 100)}%`}
          sub="30-day cohort closeout"
          footer={
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-success transition-all"
                style={{ width: `${Math.min(100, k.resolutionRate * 100)}%` }}
              />
            </div>
          }
        />
      </div>

      {/* Detail row — type breakdown + hot list */}
      {(k.topTypes.length > 0 || k.hot.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* Type breakdown */}
          <div className="card-elevated-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Top Open Types</h4>
              <span className="text-[10px] text-muted-foreground">Where issues stack up</span>
            </div>
            {k.topTypes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No open incidents.</p>
            ) : (
              <ul className="space-y-3">
                {k.topTypes.map(([t, n]) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-xs font-semibold text-foreground truncate">
                      {INCIDENT_TYPE_LABELS[t]}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full gradient-brand transition-all"
                        style={{ width: `${(n / k.topTypesMax) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-bold text-foreground tabular-nums">{n}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Hot list */}
          <div className="card-elevated-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Hot List</h4>
              <span className="text-[10px] text-muted-foreground">High / critical · oldest first</span>
            </div>
            {k.hot.length === 0 ? (
              <p className="text-xs text-muted-foreground">No high-severity incidents open.</p>
            ) : (
              <ul className="space-y-2">
                {k.hot.map((i) => {
                  const ageDays = Math.floor((Date.now() - new Date(i.created_at).getTime()) / 864e5);
                  return (
                    <li key={i.id}>
                      <Link
                        to="/incidents"
                        className="group flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3 hover:border-destructive/40 transition-colors"
                      >
                        <span className={`shrink-0 h-2 w-2 rounded-full ${
                          i.severity === "critical" ? "bg-destructive" : "bg-warning"
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground truncate">
                            {i.title || INCIDENT_TYPE_LABELS[i.incident_type]}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {i.customer_name || i.job_number || INCIDENT_TYPE_LABELS[i.incident_type]}
                          </p>
                        </div>
                        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${SEVERITY_TONE[i.severity]}`}>
                          {i.severity}
                        </span>
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {ageDays}d
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function formatHours(h: number): string {
  if (h <= 0) return "—";
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 48) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

interface KPITileProps {
  icon: React.ComponentType<{ className?: string }>;
  accent: "destructive" | "warning" | "primary" | "success";
  label: string;
  value: string;
  sub: string;
  footer: React.ReactNode;
}

function KPITile({ icon: Icon, accent, label, value, sub, footer }: KPITileProps) {
  const accentMap = {
    destructive: "bg-destructive/15 text-destructive",
    warning: "bg-warning/15 text-warning",
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
  } as const;
  return (
    <div className="card-elevated-lg p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className={`h-8 w-8 rounded-lg grid place-items-center ${accentMap[accent]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div>
        <p className="text-3xl font-display font-extrabold text-foreground leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>
      </div>
      <div className="pt-2 border-t border-hairline">{footer}</div>
    </div>
  );
}
