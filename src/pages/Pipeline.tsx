import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { useDeals, useUpdateDealStage } from "@/hooks/useDeals";
import { useAllProfiles, buildProfileMap } from "@/hooks/useProfiles";
import { useIsAdmin } from "@/hooks/useUserRole";
import { useFollowUps, useUpdateFollowUp, useDeleteFollowUp } from "@/hooks/useFollowUps";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import { followUpStatus } from "@/types/followUp";
import { STAGE_LABELS, STAGE_COLORS, type DealStage } from "@/types/deal";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  GripVertical,
  Sparkles,
  TrendingUp,
  User,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FollowUpComposer from "@/components/followups/FollowUpComposer";
import { toast } from "sonner";
import { pct, formatCurrencyShort } from "@/lib/format";
import { useT } from "@/contexts/LanguageContext";
import { FollowUpAdmin, type FollowUpFilter } from "@/components/pipeline/FollowUpAdmin";
import LeadsMap from "@/components/pipeline/LeadsMap";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LayoutList, Map as MapIcon } from "lucide-react";

// Stages we allow drag-and-drop into. Won/lost are excluded because they
// require additional info (closed_amount / lost_reason) collected elsewhere.
const DRAGGABLE_TARGETS: DealStage[] = ["inspecting", "presented", "follow_up", "won", "lost", "disqualified"];

type RangeDays = 7 | 30 | 90 | "all";
const RANGE_OPTIONS: RangeDays[] = [7, 30, 90, "all"];

const dealValue = (d: { closed_amount: number | null; price_c: number | null; price_b: number | null; price_a: number | null }) =>
  d.closed_amount ?? d.price_c ?? d.price_b ?? d.price_a ?? null;

const daysSince = (iso: string | null | undefined) => {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
};

export default function Pipeline() {
  const t = useT();

  const { data: deals = [] } = useDeals();
  const { isAdmin } = useIsAdmin();
  const { data: profiles = [] } = useAllProfiles(isAdmin);
  const profileMap = buildProfileMap(profiles);
  const { data: followUps = [] } = useFollowUps();
  const updateFollowUp = useUpdateFollowUp();
  const deleteFollowUp = useDeleteFollowUp();
  const updateStage = useUpdateDealStage();
  const { setActiveDealId } = useActiveDeal();
  const navigate = useNavigate();
  const [composer, setComposer] = useState<{ dealId: string; followUpId?: string } | null>(null);
  const [filter, setFilter] = useState<FollowUpFilter>("open");
  const [dragging, setDragging] = useState<{ id: string; from: DealStage } | null>(null);
  const [dropTarget, setDropTarget] = useState<DealStage | null>(null);
  const [actionDrawerOpen, setActionDrawerOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [rangeDays, setRangeDays] = useState<RangeDays>(30);

  const filteredDeals = useMemo(() => {
    if (rangeDays === "all") return deals;
    const cutoff = Date.now() - rangeDays * 864e5;
    return deals.filter((d) => {
      const ts = new Date(
        d.stage === "won" || d.stage === "lost" || d.stage === "disqualified"
          ? d.closed_at ?? d.stage_changed_at ?? d.updated_at
          : d.stage_changed_at ?? d.updated_at ?? d.created_at
      ).getTime();
      return ts >= cutoff;
    });
  }, [deals, rangeDays]);

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

  const stages: DealStage[] = ["inspecting", "presented", "follow_up", "won", "lost", "disqualified"];
  const grouped = stages.map((s) => {
    const ds = filteredDeals.filter((d) => d.stage === s);
    const value = ds.reduce((acc, d) => acc + (dealValue(d) ?? 0), 0);
    return { stage: s, deals: ds, value };
  });

  const openDeal = (id: string) => {
    setActiveDealId(id);
    navigate("/");
  };

  function handleDrop(target: DealStage) {
    const dragged = dragging;
    setDropTarget(null);
    setDragging(null);
    if (!dragged) return;
    if (dragged.from === target) return;
    updateStage.mutate(
      { id: dragged.id, stage: target },
      {
        onSuccess: () => {
          if (target === "won") {
            toast.success(t(`Moved to Won — add closed amount on the deal page`, `Movido a Ganado — agrega el monto en la página del trato`));
          } else if (target === "lost" || target === "disqualified") {
            toast.success(t(`Moved to ${STAGE_LABELS[target]} — add a reason on the deal page`, `Movido a ${STAGE_LABELS[target]} — agrega un motivo en la página del trato`));
          } else {
            toast.success(t(`Moved to ${STAGE_LABELS[target]}`, `Movido a ${STAGE_LABELS[target]}`));
          }
        },
      },
    );
  }

  const StatChip = ({
    icon: Icon,
    label,
    value,
    accent,
    onClick,
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    accent: string;
    onClick?: () => void;
  }) => {
    const cls = `flex items-center gap-2 rounded-full border border-hairline bg-card/70 backdrop-blur px-3 py-1.5 ${
      onClick ? "hover:border-primary/50 hover:bg-card cursor-pointer pressable transition-colors" : ""
    }`;
    const content = (
      <>
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className={`text-sm font-extrabold font-display ${accent}`}>{value}</span>
      </>
    );
    return onClick ? (
      <button onClick={onClick} className={cls}>{content}</button>
    ) : (
      <div className={cls}>{content}</div>
    );
  };

  const RepBadge = ({ repId }: { repId: string }) => {
    const p = profileMap.get(repId);
    const label = p?.display_name || p?.email || repId.slice(0, 8);
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
        <User className="h-2.5 w-2.5" />
        {label}
      </span>
    );
  };

  const totalPipelineValue = grouped
    .filter((g) => g.stage !== "lost" && g.stage !== "disqualified")
    .reduce((a, g) => a + g.value, 0);

  return (
    <div className="min-h-screen surface-premium">
      <AppHeader />
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header + KPI strip */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-display font-extrabold text-foreground">
              {isAdmin ? t("All Pipeline", "Embudo Total") : t("My Pipeline", "Mi Embudo")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t(
                "Drag cards between any stage. Tap a stat to see the action queue.",
                "Arrastra tarjetas entre cualquier etapa. Toca una métrica para ver la cola de acciones.",
              )}
            </p>
            <div className="inline-flex items-center gap-0.5 p-0.5 mt-2 rounded-lg border border-hairline bg-background/40">
              {RANGE_OPTIONS.map((d) => (
                <button
                  key={String(d)}
                  onClick={() => setRangeDays(d)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                    rangeDays === d
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d === "all" ? t("All", "Todo") : `${d}d`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatChip
              icon={DollarSign}
              label={t("Pipeline", "Embudo")}
              value={formatCurrencyShort(totalPipelineValue)}
              accent="text-foreground"
            />
            <StatChip
              icon={AlertCircle}
              label={t("Overdue", "Atrasados")}
              value={String(stats.overdue.length)}
              accent={stats.overdue.length > 0 ? "text-destructive" : "text-success"}
              onClick={() => setActionDrawerOpen(true)}
            />
            <StatChip
              icon={Calendar}
              label={t("Due today", "Hoy")}
              value={String(stats.today.length)}
              accent="text-warning"
              onClick={() => setActionDrawerOpen(true)}
            />
            <StatChip
              icon={CheckCircle2}
              label={t("Open", "Abiertos")}
              value={String(stats.open.length)}
              accent="text-primary"
              onClick={() => setActionDrawerOpen(true)}
            />
            <StatChip icon={TrendingUp} label={t("SLA 7d", "SLA 7d")} value={pct(stats.compliance)} accent="text-success" />
          </div>
        </div>

        <Tabs defaultValue="pipeline" className="w-full">
          <TabsList>
            <TabsTrigger value="pipeline" className="gap-1.5">
              <LayoutList className="h-3.5 w-3.5" />
              {t("Pipeline", "Embudo")}
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-1.5">
              <MapIcon className="h-3.5 w-3.5" />
              {t("Map (3D)", "Mapa (3D)")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="mt-4 space-y-5">
            <section className="card-elevated-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {grouped.map(({ stage, deals: ds, value }) => {
                  const canDrop = DRAGGABLE_TARGETS.includes(stage);
                  const isDropTarget = dropTarget === stage;
                  const isDragSource = dragging?.from === stage;
                  return (
                    <div
                      key={stage}
                      onDragOver={(e) => {
                        if (!dragging) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = canDrop && stage !== dragging.from ? "move" : "none";
                        if (dropTarget !== stage) setDropTarget(stage);
                      }}
                      onDragLeave={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                        if (dropTarget === stage) setDropTarget(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(stage);
                      }}
                      className={`rounded-xl border bg-background/40 p-2 transition-all duration-200 ${
                        isDropTarget && canDrop && !isDragSource
                          ? "border-primary/60 bg-primary/5 ring-2 ring-primary/40 scale-[1.01]"
                          : isDropTarget && !canDrop
                          ? "border-destructive/40 bg-destructive/5"
                          : isDragSource
                          ? "border-dashed border-muted-foreground/30 opacity-70"
                          : "border-hairline"
                      }`}
                    >
                      {/* Column header */}
                      <div className="px-2 py-1.5 mb-2 border-b border-hairline/60">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STAGE_COLORS[stage]}`}>
                            {STAGE_LABELS[stage]}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground tabular-nums">{ds.length}</span>
                        </div>
                        {value > 0 && (
                          <div className="mt-1 text-[10px] text-muted-foreground tabular-nums">
                            {formatCurrencyShort(value)}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
                        {ds.map((d) => {
                          const open = followUps.filter((f) => f.deal_id === d.id && !f.completed_at);
                          const next = open.sort((a, b) => +new Date(a.due_at) - +new Date(b.due_at))[0];
                          const status = next ? followUpStatus(next) : null;
                          const dot =
                            status === "overdue"
                              ? "bg-destructive"
                              : status === "due_today"
                              ? "bg-warning"
                              : status === "upcoming"
                              ? "bg-primary"
                              : "bg-muted-foreground/30";
                          const beingDragged = dragging?.id === d.id;
                          const val = dealValue(d);
                          const days =
                            stage === "won" || stage === "lost" || stage === "disqualified"
                              ? daysSince(d.closed_at)
                              : daysSince(d.stage_changed_at);
                          return (
                            <div
                              key={d.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", d.id);
                                setDragging({ id: d.id, from: stage });
                              }}
                              onDragEnd={() => {
                                setDragging(null);
                                setDropTarget(null);
                              }}
                              className={`group relative w-full rounded-lg border border-hairline bg-card transition-all ${
                                beingDragged ? "opacity-40 scale-95" : "hover:border-primary/50 hover:shadow-[var(--shadow-sm)]"
                              }`}
                            >
                              <button onClick={() => openDeal(d.id)} className="w-full text-left p-2.5 pl-6 pressable">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-xs font-bold text-foreground truncate">
                                    {d.homeowner1 || "Untitled"}
                                  </p>
                                  {next && <span className={`h-2 w-2 rounded-full flex-shrink-0 mt-1 ${dot}`} />}
                                </div>

                                {/* Value + days-in-stage */}
                                <div className="mt-1 flex items-center justify-between gap-2 text-[10px] tabular-nums">
                                  <span className="font-bold text-foreground">
                                    {val ? formatCurrencyShort(val) : <span className="text-muted-foreground/60">—</span>}
                                  </span>
                                  {days !== null && (
                                    <span
                                      className={`text-muted-foreground ${
                                        days >= 14 && (stage === "inspecting" || stage === "presented" || stage === "follow_up")
                                          ? "text-warning"
                                          : ""
                                      }`}
                                    >
                                      {days}d
                                    </span>
                                  )}
                                </div>

                                {isAdmin && (
                                  <div className="mt-1">
                                    <RepBadge repId={d.rep_id} />
                                  </div>
                                )}

                                {next ? (
                                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                    <Clock className="h-2.5 w-2.5" />#{next.touchpoint_number} ·{" "}
                                    {new Date(next.due_at).toLocaleDateString()}
                                  </p>
                                ) : null}

                                {d.products.length > 0 && (
                                  <p className="text-[10px] text-muted-foreground/80 mt-1 truncate">
                                    {d.products.join(" · ")}
                                  </p>
                                )}
                              </button>
                              <span
                                aria-hidden
                                className="absolute left-1 top-1/2 -translate-y-1/2 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                              >
                                <GripVertical className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          );
                        })}
                        {ds.length === 0 && (
                          <p className="text-[11px] text-muted-foreground italic px-2 py-3 text-center">
                            {dragging && canDrop ? t("Drop here", "Suelta aquí") : t("Empty", "Vacío")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Collapsible follow-up admin table */}
            <Collapsible open={adminOpen} onOpenChange={setAdminOpen} className="card-elevated-lg">
              <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 pressable hover:bg-muted/30 rounded-xl transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                    {t("All follow-ups", "Todos los seguimientos")}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                    {followUps.length}
                  </span>
                </div>
                {adminOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <FollowUpAdmin
                  followUps={followUps}
                  dealById={dealById}
                  filter={filter}
                  onFilterChange={setFilter}
                  onEdit={(f) => setComposer({ dealId: f.deal_id, followUpId: f.id })}
                  onComplete={async (f) => {
                    await updateFollowUp.mutateAsync({ id: f.id, updates: { completed_at: new Date().toISOString() } });
                    toast.success(t("Marked complete", "Marcado como completado"));
                  }}
                  onDelete={async (f) => {
                    if (!confirm(t("Delete this follow-up and its draft?", "¿Eliminar este seguimiento y su borrador?"))) return;
                    await deleteFollowUp.mutateAsync(f.id);
                    toast.success(t("Follow-up deleted", "Seguimiento eliminado"));
                  }}
                  onOpenDeal={openDeal}
                />
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>

          <TabsContent value="map" className="mt-4">
            <LeadsMap
              onAction={(a) => {
                if (a.type === "open") openDeal(a.dealId);
                else setComposer({ dealId: a.dealId, followUpId: a.followUpId });
              }}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Action queue drawer */}
      <Sheet open={actionDrawerOpen} onOpenChange={setActionDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              {t("Action queue", "Cola de acciones")}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {stats.overdue.length === 0 && stats.today.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground">{t("All caught up", "Todo al día")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("No SLA breaches or due touchpoints.", "Sin incumplimientos de SLA ni contactos pendientes.")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...stats.overdue, ...stats.today].map((f) => {
                  const d = dealById.get(f.deal_id);
                  const isOverdue = followUpStatus(f) === "overdue";
                  return (
                    <div
                      key={f.id}
                      className={`rounded-lg border p-3 bg-card transition-all hover:shadow-[var(--shadow-sm)] ${
                        isOverdue ? "border-destructive/40 hover:border-destructive/60" : "border-warning/40 hover:border-warning/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate text-foreground">{d?.homeowner1 || "Untitled"}</p>
                          <p className="text-[10px] text-muted-foreground">
                            #{f.touchpoint_number} · {isOverdue ? t("overdue", "atrasado") : t("today", "hoy")} ·{" "}
                            {new Date(f.due_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isOverdue ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"
                          }`}
                        >
                          {isOverdue ? t("SLA", "SLA") : t("Due", "Vence")}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setComposer({ dealId: f.deal_id, followUpId: f.id });
                            setActionDrawerOpen(false);
                          }}
                          className="gap-1 h-7 px-2 text-[11px] flex-1"
                        >
                          <Sparkles className="h-3 w-3" /> {f.ai_email_body ? t("Edit", "Editar") : t("Draft", "Borrador")}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            openDeal(f.deal_id);
                            setActionDrawerOpen(false);
                          }}
                          className="h-7 px-2 text-[11px] flex-1"
                        >
                          {t("Open", "Abrir")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <FollowUpComposer
        dealId={composer?.dealId ?? null}
        followUpId={composer?.followUpId ?? null}
        open={!!composer}
        onOpenChange={(v) => !v && setComposer(null)}
      />
    </div>
  );
}
