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

  const StatChip = ({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent: string }) => (
    <div className="flex items-center gap-2 rounded-full border border-hairline bg-card/70 backdrop-blur px-3 py-1.5">
      <Icon className={`h-3.5 w-3.5 ${accent}`} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`text-sm font-extrabold font-display ${accent}`}>{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen surface-premium">
      <AppHeader />
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Title + inline KPIs */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-display font-extrabold text-foreground">My Pipeline</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Every deal, every follow-up, every SLA you owe — at a glance.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatChip icon={AlertCircle} label="Overdue" value={String(stats.overdue.length)}
              accent={stats.overdue.length > 0 ? "text-destructive" : "text-success"} />
            <StatChip icon={Calendar} label="Due today" value={String(stats.today.length)} accent="text-warning" />
            <StatChip icon={CheckCircle2} label="Open" value={String(stats.open.length)} accent="text-primary" />
            <StatChip icon={TrendingUp} label="SLA 7d" value={pct(stats.compliance)} accent="text-success" />
          </div>
        </div>

        {/* Main: Pipeline kanban (wide) + Action queue (side) */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">
          {/* Pipeline columns */}
          <section className="card-elevated-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Pipeline</h3>
              <span className="text-[11px] text-muted-foreground">{deals.length} deals</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {grouped.map(({ stage, deals: ds }) => (
                <div key={stage} className="rounded-xl border border-hairline bg-background/40 p-2">
                  <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STAGE_COLORS[stage]}`}>
                      {STAGE_LABELS[stage]}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">{ds.length}</span>
                  </div>
                  <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
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
                          className="w-full text-left rounded-lg border border-hairline bg-card p-2.5 hover:border-primary/50 hover:shadow-[var(--shadow-sm)] transition-all pressable">
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

          {/* Action queue — overdue first, then due today */}
          <aside className="card-elevated-lg p-4 xl:sticky xl:top-4">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 text-foreground">
              <AlertCircle className="h-4 w-4 text-destructive" /> Action queue
            </h3>
            {stats.overdue.length === 0 && stats.today.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">All caught up</p>
                <p className="text-xs text-muted-foreground mt-1">No SLA breaches or due touchpoints.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                {[...stats.overdue, ...stats.today].map((f) => {
                  const d = dealById.get(f.deal_id);
                  const isOverdue = followUpStatus(f) === "overdue";
                  return (
                    <div key={f.id} className={`rounded-lg border p-2.5 bg-card transition-all hover:shadow-[var(--shadow-sm)] ${isOverdue ? "border-destructive/40 hover:border-destructive/60" : "border-warning/40 hover:border-warning/60"}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-foreground">{d?.homeowner1 || "Untitled"}</p>
                          <p className="text-[10px] text-muted-foreground">
                            #{f.touchpoint_number} · {isOverdue ? "overdue" : "today"} · {new Date(f.due_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isOverdue ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}`}>
                          {isOverdue ? "SLA" : "Due"}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => setComposer({ dealId: f.deal_id, followUpId: f.id })} className="gap-1 h-7 px-2 text-[11px] flex-1">
                          <Sparkles className="h-3 w-3" /> {f.ai_email_body ? "Edit" : "Draft"}
                        </Button>
                        <Button size="sm" onClick={() => openDeal(f.deal_id)} className="h-7 px-2 text-[11px] flex-1">Open</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        </div>

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

