import { useMemo, useState } from "react";
import {
  AlertTriangle, Plus, Search, ShieldAlert, Clock, CheckCircle2,
  Loader2, Briefcase, ExternalLink, MessageSquareText, Filter, Flame,
  LayoutGrid, LayoutList,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import AppHeader from "@/components/AppHeader";
import IncidentDialog from "@/components/incidents/IncidentDialog";
import { useIncidents, useUpdateIncidentStatus, useIncidentNotes, useAddIncidentNote } from "@/hooks/useIncidents";
import {
  INCIDENT_STATUSES, INCIDENT_STATUS_LABELS,
  INCIDENT_TYPE_LABELS, SEVERITY_ORDER,
  type Incident, type IncidentSeverity, type IncidentStatus, type IncidentType,
} from "@/types/incident";
import { formatCount } from "@/lib/format";

/* ---------- helpers ---------- */
const sevTone: Record<IncidentSeverity, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/40",
  high: "bg-warning/15 text-warning border-warning/40",
  medium: "bg-primary/10 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
};
const sevDot: Record<IncidentSeverity, string> = {
  critical: "bg-destructive shadow-[0_0_10px_hsl(var(--destructive))]",
  high: "bg-warning",
  medium: "bg-primary",
  low: "bg-muted-foreground",
};
const statusTone: Record<IncidentStatus, string> = {
  open: "from-destructive/20 to-destructive/5 text-destructive",
  in_progress: "from-warning/20 to-warning/5 text-warning",
  waiting_external: "from-primary/20 to-primary/5 text-primary",
  blocked: "from-destructive/20 to-destructive/5 text-destructive",
  resolved: "from-success/20 to-success/5 text-success",
};
const fmtDue = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso); const now = Date.now(); const diff = d.getTime() - now;
  const day = 86400000;
  const days = Math.round(diff / day);
  if (Math.abs(days) < 1) return diff < 0 ? "Overdue" : "Due today";
  return diff < 0 ? `${Math.abs(days)}d overdue` : `Due in ${days}d`;
};

/* ---------- page ---------- */
export default function Incidents() {
  const { data: incidents = [], isLoading } = useIncidents();
  const updateStatus = useUpdateIncidentStatus();
  const [editing, setEditing] = useState<Incident | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sevFilter, setSevFilter] = useState<IncidentSeverity | "all">("all");
  const [typeFilter, setTypeFilter] = useState<IncidentType | "all">("all");
  const [activeDetail, setActiveDetail] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "tile">("kanban");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return incidents.filter((i) => {
      if (sevFilter !== "all" && i.severity !== sevFilter) return false;
      if (typeFilter !== "all" && i.incident_type !== typeFilter) return false;
      if (!needle) return true;
      return (
        i.title.toLowerCase().includes(needle) ||
        (i.job_number ?? "").toLowerCase().includes(needle) ||
        (i.customer_name ?? "").toLowerCase().includes(needle) ||
        (i.assignee ?? "").toLowerCase().includes(needle)
      );
    });
  }, [incidents, q, sevFilter, typeFilter]);

  const grouped = useMemo(() => {
    const map: Record<IncidentStatus, Incident[]> = {
      open: [], in_progress: [], waiting_external: [], blocked: [], resolved: [],
    };
    filtered.forEach((i) => map[i.status].push(i));
    Object.values(map).forEach((arr) => arr.sort((a, b) =>
      SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] ||
      new Date(a.due_at ?? a.created_at).getTime() - new Date(b.due_at ?? b.created_at).getTime()
    ));
    return map;
  }, [filtered]);

  const kpi = useMemo(() => {
    const open = incidents.filter((i) => i.status !== "resolved");
    const critical = open.filter((i) => i.severity === "critical" || i.severity === "high").length;
    const overdue = open.filter((i) => i.due_at && new Date(i.due_at) < new Date()).length;
    const resolvedThisWeek = incidents.filter((i) => i.status === "resolved" && i.resolved_at &&
      Date.now() - new Date(i.resolved_at).getTime() < 7 * 86400000).length;
    return { totalOpen: open.length, critical, overdue, resolvedThisWeek };
  }, [incidents]);

  const onMove = (id: string, status: IncidentStatus) => updateStatus.mutate({ id, status });
  const onEdit = (i: Incident) => { setEditing(i); setDialogOpen(true); };
  const onNew = () => { setEditing(null); setDialogOpen(true); };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-[1600px] mx-auto px-3 sm:px-6 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold gradient-text flex items-center gap-2">
              <ShieldAlert className="h-7 w-7 text-warning" /> Incidents
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track install issues, paperwork gaps & approvals that affect your back-end commission.
            </p>
          </div>
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 shadow-[var(--shadow-glow)] pressable"
          >
            <Plus className="h-4 w-4" /> New incident
          </button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi icon={AlertTriangle} label="Open incidents" value={kpi.totalOpen} accent="warning" />
          <Kpi icon={Flame} label="Critical / High" value={kpi.critical} accent="destructive" />
          <Kpi icon={Clock} label="Overdue" value={kpi.overdue} accent="destructive" />
          <Kpi icon={CheckCircle2} label="Resolved (7d)" value={kpi.resolvedThisWeek} accent="success" />
        </div>

        {/* Filter bar */}
        <div className="card-elevated p-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, job #, customer, assignee…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as "kanban" | "tile")}
            className="hidden sm:flex"
          >
            <ToggleGroupItem value="kanban" aria-label="Kanban view">
              <LayoutList className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="tile" aria-label="Tile view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <div className="flex items-center gap-1.5 p-1 rounded-xl border border-border bg-muted/40">
            {(["all","critical","high","medium","low"] as const).map((s) => (
              <button key={s} onClick={() => setSevFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  sevFilter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>{s}</button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as IncidentType | "all")}
              className="px-3 py-2 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All types</option>
              {Object.entries(INCIDENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Kanban */}
        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : incidents.length === 0 ? (
          <EmptyState onNew={onNew} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            {INCIDENT_STATUSES.map((status) => (
              <Column
                key={status}
                status={status}
                incidents={grouped[status]}
                onEdit={onEdit}
                onMove={onMove}
                onToggleDetail={(id) => setActiveDetail((cur) => (cur === id ? null : id))}
                activeDetail={activeDetail}
              />
            ))}
          </div>
        )}
      </main>

      <IncidentDialog open={dialogOpen} onClose={() => setDialogOpen(false)} incident={editing} />
    </div>
  );
}

/* ---------- KPI tile ---------- */
function Kpi({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent: "warning" | "destructive" | "success" | "primary" }) {
  const map = {
    warning: "from-warning/20 to-warning/5 text-warning",
    destructive: "from-destructive/20 to-destructive/5 text-destructive",
    success: "from-success/20 to-success/5 text-success",
    primary: "from-primary/20 to-primary/5 text-primary",
  } as const;
  return (
    <div className="card-premium p-4 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] transition-all">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${map[accent]} grid place-items-center shadow-sm`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-extrabold font-display text-foreground num-display">{formatCount(value)}</p>
    </div>
  );
}

/* ---------- Column ---------- */
function Column({
  status, incidents, onEdit, onMove, activeDetail, onToggleDetail,
}: {
  status: IncidentStatus; incidents: Incident[];
  onEdit: (i: Incident) => void;
  onMove: (id: string, s: IncidentStatus) => void;
  activeDetail: string | null;
  onToggleDetail: (id: string) => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-muted/30 border border-hairline overflow-hidden">
      <div className={`px-3 py-2.5 flex items-center justify-between bg-gradient-to-r ${statusTone[status]}`}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider">{INCIDENT_STATUS_LABELS[status]}</span>
          <span className="text-[11px] font-semibold tabular-nums opacity-80">{incidents.length}</span>
        </div>
      </div>
      <div className="flex-1 p-2 space-y-2 max-h-[70vh] overflow-y-auto">
        {incidents.length === 0 && (
          <p className="text-[11px] text-muted-foreground text-center py-6">Nothing here</p>
        )}
        {incidents.map((i) => (
          <IncidentCard
            key={i.id}
            incident={i}
            onEdit={() => onEdit(i)}
            onMove={(s) => onMove(i.id, s)}
            expanded={activeDetail === i.id}
            onToggle={() => onToggleDetail(i.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Card ---------- */
function IncidentCard({
  incident, onEdit, onMove, expanded, onToggle,
}: {
  incident: Incident; onEdit: () => void;
  onMove: (s: IncidentStatus) => void;
  expanded: boolean; onToggle: () => void;
}) {
  const due = fmtDue(incident.due_at);
  const overdue = incident.due_at && new Date(incident.due_at) < new Date() && incident.status !== "resolved";

  return (
    <div className="group rounded-xl border border-hairline bg-card hover:border-hairline-strong hover:shadow-[var(--shadow-sm)] transition-all overflow-hidden">
      <div className="p-3 space-y-2 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-2">
          <span className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${sevDot[incident.severity]}`} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-foreground leading-snug line-clamp-2">{incident.title}</p>
            {(incident.job_number || incident.customer_name) && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {incident.job_number && <span className="font-mono">#{incident.job_number}</span>}
                {incident.job_number && incident.customer_name && <span> · </span>}
                {incident.customer_name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${sevTone[incident.severity]}`}>
            {incident.severity}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-semibold">
            {INCIDENT_TYPE_LABELS[incident.incident_type]}
          </span>
          {due && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
              <Clock className="h-2.5 w-2.5" />{due}
            </span>
          )}
        </div>
        {incident.assignee && (
          <p className="text-[11px] text-muted-foreground truncate">↳ {incident.assignee}</p>
        )}
      </div>

      {expanded && (
        <DetailPanel incident={incident} onEdit={onEdit} onMove={onMove} />
      )}
    </div>
  );
}

/* ---------- Detail / notes panel ---------- */
function DetailPanel({ incident, onEdit, onMove }: { incident: Incident; onEdit: () => void; onMove: (s: IncidentStatus) => void }) {
  const { data: notes = [] } = useIncidentNotes(incident.id);
  const add = useAddIncidentNote();
  const [body, setBody] = useState("");

  return (
    <div className="border-t border-border bg-muted/20 p-3 space-y-3">
      {incident.details && (
        <p className="text-[12px] text-foreground/90 whitespace-pre-wrap leading-relaxed">{incident.details}</p>
      )}
      {incident.email_subject && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <MessageSquareText className="h-3 w-3" />
          <span className="truncate">{incident.email_subject}</span>
          {incident.email_link && (
            <a href={incident.email_link} target="_blank" rel="noreferrer" className="text-primary hover:underline">
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {/* Quick status moves */}
      <div className="flex flex-wrap gap-1">
        {INCIDENT_STATUSES.filter((s) => s !== incident.status).map((s) => (
          <button key={s} onClick={(e) => { e.stopPropagation(); onMove(s); }}
            className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-border bg-card hover:border-primary hover:text-primary transition-colors">
            → {INCIDENT_STATUS_LABELS[s]}
          </button>
        ))}
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="ml-auto px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary/20">
          Edit
        </button>
      </div>

      {/* Notes thread */}
      <div className="space-y-1.5">
        {notes.map((n) => (
          <div key={n.id} className="text-[11px] rounded-lg bg-card border border-hairline px-2 py-1.5">
            <p className="text-foreground/90 whitespace-pre-wrap">{n.body}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
          </div>
        ))}
        <div className="flex gap-1.5">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Add note…"
            className="flex-1 px-2 py-1.5 rounded-md border border-border bg-background text-[11px] focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!body.trim()) return;
              add.mutate({ incident_id: incident.id, body: body.trim() }, { onSuccess: () => setBody("") });
            }}
            className="px-2 py-1.5 rounded-md bg-primary text-primary-foreground text-[11px] font-bold hover:bg-primary/90"
          >Add</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Empty state ---------- */
function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="card-elevated-lg p-12 text-center space-y-3">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-warning/20 to-warning/5 text-warning grid place-items-center">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h2 className="font-display text-xl font-bold text-foreground">No incidents tracked yet</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Log paperwork gaps, audit items, change orders, refunds and approvals here — protect your back-end commission.
      </p>
      <button onClick={onNew} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90">
        <Plus className="h-4 w-4" /> Log first incident
      </button>
    </div>
  );
}
