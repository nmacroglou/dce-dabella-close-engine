import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Sparkles, Pencil, Trash2, Paperclip, Check } from "lucide-react";
import { followUpStatus, type FollowUp } from "@/types/followUp";
import type { useDeals } from "@/hooks/useDeals";

export type FollowUpFilter = "open" | "drafts" | "completed" | "all";

interface FollowUpAdminProps {
  followUps: FollowUp[];
  dealById: Map<string, ReturnType<typeof useDeals>["data"] extends (infer U)[] | undefined ? U : never>;
  filter: FollowUpFilter;
  onFilterChange: (f: FollowUpFilter) => void;
  onEdit: (f: FollowUp) => void;
  onComplete: (f: FollowUp) => void;
  onDelete: (f: FollowUp) => void;
  onOpenDeal: (id: string) => void;
}

export function FollowUpAdmin({
  followUps, dealById, filter, onFilterChange, onEdit, onComplete, onDelete, onOpenDeal,
}: FollowUpAdminProps) {
  const filtered = useMemo(() => {
    const list = [...followUps].sort((a, b) => +new Date(a.due_at) - +new Date(b.due_at));
    if (filter === "open") return list.filter((f) => !f.completed_at);
    if (filter === "drafts") return list.filter((f) => !!f.ai_email_body);
    if (filter === "completed") return list.filter((f) => !!f.completed_at);
    return list;
  }, [followUps, filter]);

  const counts = useMemo(() => ({
    open: followUps.filter((f) => !f.completed_at).length,
    drafts: followUps.filter((f) => !!f.ai_email_body).length,
    completed: followUps.filter((f) => !!f.completed_at).length,
    all: followUps.length,
  }), [followUps]);

  const tabs: { key: FollowUpFilter; label: string }[] = [
    { key: "open", label: `Open (${counts.open})` },
    { key: "drafts", label: `With drafts (${counts.drafts})` },
    { key: "completed", label: `Completed (${counts.completed})` },
    { key: "all", label: `All (${counts.all})` },
  ];

  return (
    <section className="card-elevated-lg p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-primary" /> Follow-ups & email drafts
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every scheduled touchpoint and AI draft. Edit, send, complete, or delete.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onFilterChange(t.key)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors ${
                filter === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-6">No follow-ups in this view.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => {
            const d = dealById.get(f.deal_id);
            const status = followUpStatus(f);
            const tone =
              f.completed_at ? "border-success/30 bg-success/5" :
              status === "overdue" ? "border-destructive/30 bg-destructive/5" :
              status === "due_today" ? "border-warning/30 bg-warning/5" :
              "border-border bg-card";
            return (
              <div key={f.id} className={`rounded-lg border p-3 ${tone}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onOpenDeal(f.deal_id)}
                        className="text-sm font-bold text-foreground hover:text-primary truncate"
                      >
                        {d?.homeowner1 || "Untitled deal"}
                      </button>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Touch #{f.touchpoint_number}
                      </span>
                      {f.completed_at ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/15 text-success">Completed</span>
                      ) : (
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          status === "overdue" ? "bg-destructive/15 text-destructive" :
                          status === "due_today" ? "bg-warning/15 text-warning" :
                          "bg-primary/10 text-primary"
                        }`}>
                          {status === "overdue" ? "Overdue" : status === "due_today" ? "Due today" : "Upcoming"}
                        </span>
                      )}
                      {f.ai_email_body && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5" /> Draft saved
                        </span>
                      )}
                      {f.attachments?.length ? (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Paperclip className="h-2.5 w-2.5" /> {f.attachments.length}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Due {new Date(f.due_at).toLocaleString()}
                      {f.completed_at && ` · completed ${new Date(f.completed_at).toLocaleString()}`}
                    </p>
                    {f.ai_email_subject && (
                      <p className="text-xs font-semibold text-foreground mt-2 truncate">
                        Subject: {f.ai_email_subject}
                      </p>
                    )}
                    {f.ai_email_body && (
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 whitespace-pre-line">
                        {f.ai_email_body}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={() => onEdit(f)} className="gap-1.5 h-8">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    {!f.completed_at && (
                      <Button size="sm" variant="outline" onClick={() => onComplete(f)} className="gap-1.5 h-8">
                        <Check className="h-3.5 w-3.5" /> Complete
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => onDelete(f)} className="gap-1.5 h-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
