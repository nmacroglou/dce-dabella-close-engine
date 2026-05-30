import { useState, useEffect } from "react";
import { X, Save, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUpsertIncident, useDeleteIncident } from "@/hooks/useIncidents";
import {
  INCIDENT_TYPES, INCIDENT_TYPE_LABELS,
  INCIDENT_STATUSES, INCIDENT_STATUS_LABELS,
  INCIDENT_SEVERITIES, INCIDENT_SOURCES,
  type Incident,
} from "@/types/incident";

interface Props {
  open: boolean;
  onClose: () => void;
  incident?: Incident | null;
}

const blank: Partial<Incident> = {
  title: "",
  incident_type: "incomplete_paperwork",
  severity: "medium",
  status: "open",
  source: "email",
};

export default function IncidentDialog({ open, onClose, incident }: Props) {
  const upsert = useUpsertIncident();
  const del = useDeleteIncident();
  const [form, setForm] = useState<Partial<Incident>>(incident ?? blank);

  useEffect(() => { setForm(incident ?? blank); }, [incident, open]);

  const set = <K extends keyof Incident>(k: K, v: Incident[K] | null) =>
    setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.title?.trim()) return;
    await upsert.mutateAsync({ ...(form as Incident), title: form.title.trim() });
    onClose();
  };

  const remove = async () => {
    if (!incident?.id) return;
    if (!confirm("Delete this incident? This cannot be undone.")) return;
    await del.mutateAsync(incident.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {incident ? "Edit incident" : "New incident"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <Field label="Title">
            <input
              value={form.title ?? ""}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Missing POI – Lackey 166354"
              className="input"
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Job number">
              <input value={form.job_number ?? ""} onChange={(e) => set("job_number", e.target.value)} className="input" placeholder="166354" />
            </Field>
            <Field label="Customer">
              <input value={form.customer_name ?? ""} onChange={(e) => set("customer_name", e.target.value)} className="input" placeholder="Lackey" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select className="input" value={form.incident_type ?? "other"} onChange={(e) => set("incident_type", e.target.value as Incident["incident_type"])}>
                {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{INCIDENT_TYPE_LABELS[t]}</option>)}
              </select>
            </Field>
            <Field label="Severity">
              <select className="input" value={form.severity ?? "medium"} onChange={(e) => set("severity", e.target.value as Incident["severity"])}>
                {INCIDENT_SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select className="input" value={form.status ?? "open"} onChange={(e) => set("status", e.target.value as Incident["status"])}>
                {INCIDENT_STATUSES.map((s) => <option key={s} value={s}>{INCIDENT_STATUS_LABELS[s]}</option>)}
              </select>
            </Field>
            <Field label="Source">
              <select className="input" value={form.source ?? "email"} onChange={(e) => set("source", e.target.value as Incident["source"])}>
                {INCIDENT_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Assignee">
              <input value={form.assignee ?? ""} onChange={(e) => set("assignee", e.target.value)} className="input" placeholder="@Niko / Brandy / ops" />
            </Field>
            <Field label="Due">
              <input
                type="datetime-local"
                value={form.due_at ? form.due_at.slice(0, 16) : ""}
                onChange={(e) => set("due_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="input"
              />
            </Field>
          </div>

          <Field label="Email subject (optional)">
            <input value={form.email_subject ?? ""} onChange={(e) => set("email_subject", e.target.value)} className="input" placeholder="Incomplete paperwork 166354 Lackey" />
          </Field>

          <Field label="Details / next steps">
            <textarea
              value={form.details ?? ""}
              onChange={(e) => set("details", e.target.value)}
              rows={4}
              className="input resize-none"
              placeholder="What's missing, who owns it, what's blocking…"
            />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
          {incident ? (
            <button onClick={remove} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-destructive hover:bg-destructive/10">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-2 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted">
              <X className="h-3.5 w-3.5 inline mr-1" />Cancel
            </button>
            <button onClick={save} disabled={upsert.isPending || !form.title?.trim()} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              <Save className="h-3.5 w-3.5" /> Save incident
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
