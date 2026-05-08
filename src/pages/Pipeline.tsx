import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { useDeals } from "@/hooks/useDeals";
import { useFollowUps, useUpdateFollowUp, useDeleteFollowUp } from "@/hooks/useFollowUps";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import { followUpStatus } from "@/types/followUp";
import { STAGE_LABELS, STAGE_COLORS, type DealStage } from "@/types/deal";
import { AlertCircle, Calendar, CheckCircle2, Clock, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import FollowUpComposer from "@/components/followups/FollowUpComposer";
import { toast } from "sonner";
import { pct } from "@/lib/format";
import { StatTile } from "@/components/pipeline/StatTile";
import { FollowUpAdmin, type FollowUpFilter } from "@/components/pipeline/FollowUpAdmin";

export default function Pipeline() {
  const { data: deals = [] } = useDeals();
  const { data: followUps = [] } = useFollowUps();
  const updateFollowUp = useUpdateFollowUp();
  const deleteFollowUp = useDeleteFollowUp();
  const { setActiveDealId } = useActiveDeal();
  const navigate = useNavigate();
  const [composer, setComposer] = useState<{ dealId: string; followUpId?: string } | null>(null);
  const [filter, setFilter] = useState<FollowUpFilter>("open");

  const stats = useMemo(() => {
    const open = followUps.filter((f) => !f.completed_at);
    const overdue = open.filter((f) => followUpStatus(f) === "overdue");
    const today = open.filter((f) => followUpStatus(f) === "due_today");
    const completed7d = followUps.filter(
      (f) => f.completed_at && Date.now() - new Date(f.completed_at).getTime() < 7 * 864e5
    );
    const due7dPast = followUps.filter(
      (f) => Date.now() - new Date(f.due_at).getTime() > 0 &&
             Date.now() - new Date(f.due_at).getTime() < 7 * 864e5
    );
    const onTime = completed7d.filter(
      (f) => f.completed_at && new Date(f.completed_at).getTime() <= new Date(f.due_at).getTime() + 4 * 36e5
    );
    const compliance = due7dPast.length > 0 ? onTime.length / due7dPast.length : 1;
    return { open, overdue, today, compliance };
  }, [followUps]);

  const dealById = useMemo(() => new Map(deals.map((d) => [d.id, d])), [deals]);

  // Pipeline grouped by stage
  const stages: DealStage[] = ["inspecting", "presented", "follow_up", "won", "lost"];
  const grouped = stages.map((s) => ({
    stage: s,
    deals: deals.filter((d) => d.stage === s),
  }));

  const openDeal = (id: string) => {
    setActiveDealId(id);
    navigate("/");
  };

  return (
    <div className="min-h-screen surface-premium">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in-up">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-foreground">My Pipeline</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Every deal, every follow-up, every SLA you owe — at a glance.
          </p>
        </div>

        {/* SLA stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatTile icon={AlertCircle} label="Overdue follow-ups" value={String(stats.overdue.length)}
            accent={stats.overdue.length > 0 ? "text-destructive" : "text-success"} />
          <StatTile icon={Calendar} label="Due today" value={String(stats.today.length)} accent="text-warning" />
          <StatTile icon={TrendingUp} label="SLA compliance (7d)" value={pct(stats.compliance)} accent="text-success" />
          <StatTile icon={CheckCircle2} label="Open touchpoints" value={String(stats.open.length)} accent="text-primary" />
        </div>

        {/* Overdue list */}
        {stats.overdue.length > 0 && (
          <section className="card-elevated-lg p-5 border-destructive/30">
            <h3 className="text-sm font-bold text-destructive mb-3 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" /> Past SLA — chase these now
            </h3>
            <div className="space-y-2">
              {stats.overdue.map((f) => {
                const d = dealById.get(f.deal_id);
                return (
                  <div key={f.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 bg-card">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{d?.homeowner1 || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">
                        Touch #{f.touchpoint_number} · due {new Date(f.due_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setComposer({ dealId: f.deal_id, followUpId: f.id })} className="gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" /> {f.ai_email_body ? "Edit draft" : "Draft"}
                      </Button>
                      <Button size="sm" onClick={() => openDeal(f.deal_id)}>Open</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Pipeline columns */}
        <section>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Pipeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {grouped.map(({ stage, deals: ds }) => (
              <div key={stage} className="rounded-xl border border-border bg-card/40 p-2">
                <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STAGE_COLORS[stage]}`}>
                    {STAGE_LABELS[stage]}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">{ds.length}</span>
                </div>
                <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                  {ds.map((d) => {
                    const open = followUps.filter((f) => f.deal_id === d.id && !f.completed_at);
                    const next = open.sort((a, b) => +new Date(a.due_at) - +new Date(b.due_at))[0];
                    const status = next ? followUpStatus(next) : null;
                    const dot =
                      status === "overdue" ? "bg-destructive" :
                      status === "due_today" ? "bg-warning" :
                      status === "upcoming" ? "bg-primary" : "bg-muted-foreground/30";
                    return (
                      <button key={d.id} onClick={() => openDeal(d.id)}
                        className="w-full text-left rounded-lg border border-border bg-background p-2.5 hover:border-primary/40 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-foreground truncate">{d.homeowner1 || "Untitled"}</p>
                          {next && <span className={`h-2 w-2 rounded-full flex-shrink-0 mt-1 ${dot}`} />}
                        </div>
                        {next ? (
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            #{next.touchpoint_number} · {new Date(next.due_at).toLocaleDateString()}
                          </p>
                        ) : d.products.length > 0 ? (
                          <p className="text-[10px] text-muted-foreground mt-1 truncate">{d.products.join(", ")}</p>
                        ) : null}
                      </button>
                    );
                  })}
                  {ds.length === 0 && (
                    <p className="text-[11px] text-muted-foreground italic px-2 py-3 text-center">Empty</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Follow-up administration: every scheduled touchpoint with its draft */}
        <FollowUpAdmin
          followUps={followUps}
          dealById={dealById}
          filter={filter}
          onFilterChange={setFilter}
          onEdit={(f) => setComposer({ dealId: f.deal_id, followUpId: f.id })}
          onComplete={async (f) => {
            await updateFollowUp.mutateAsync({ id: f.id, updates: { completed_at: new Date().toISOString() } });
            toast.success("Marked complete");
          }}
          onDelete={async (f) => {
            if (!confirm("Delete this follow-up and its draft?")) return;
            await deleteFollowUp.mutateAsync(f.id);
            toast.success("Follow-up deleted");
          }}
          onOpenDeal={openDeal}
        />

        <p className="text-xs text-muted-foreground italic">
          Leadership-wide view (all reps) coming in the next pass — admin role required.
        </p>
      </main>

      <FollowUpComposer
        dealId={composer?.dealId ?? null}
        followUpId={composer?.followUpId ?? null}
        open={!!composer}
        onOpenChange={(v) => !v && setComposer(null)}
      />
    </div>
  );
}
/* StatTile and FollowUpAdmin moved to src/components/pipeline/* */

