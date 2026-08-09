import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import { useDeal, useUpdateDealStage } from "@/hooks/useDeals";
import { attachNoteToLatestStageEntry } from "@/hooks/useStageHistory";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCommissionGrid } from "@/hooks/useCommissionGrid";
import { scheduleSLAFollowUps } from "@/lib/scheduleFollowUps";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Briefcase, X, History, Sparkles, Pencil } from "lucide-react";
import { STAGE_LABELS, STAGE_LABELS_ES, STAGE_COLORS, DISQUALIFIED_REASON_LABELS, DISQUALIFIED_REASON_LABELS_ES, type DealStage, type DisqualifiedReason } from "@/types/deal";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StageHistoryTimeline from "@/components/StageHistoryTimeline";
import FollowUpComposer from "@/components/followups/FollowUpComposer";
import DealEditDialog from "@/components/deals/DealEditDialog";

export default function ActiveDealBanner() {
  const navigate = useNavigate();
  const { activeDealId, setActiveDealId } = useActiveDeal();
  const { data: deal } = useDeal(activeDealId);
  const updateStage = useUpdateDealStage();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: grid } = useCommissionGrid();
  const { lang, t } = useLanguage();
  const stageLabels = lang === "es" ? STAGE_LABELS_ES : STAGE_LABELS;
  const dqLabels = lang === "es" ? DISQUALIFIED_REASON_LABELS_ES : DISQUALIFIED_REASON_LABELS;

  const [winOpen, setWinOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [dqOpen, setDqOpen] = useState(false);
  const [stageNoteOpen, setStageNoteOpen] = useState(false);
  const [pendingStage, setPendingStage] = useState<DealStage | null>(null);
  const [winAmount, setWinAmount] = useState("");
  const [winNote, setWinNote] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [lostNote, setLostNote] = useState("");
  const [dqReason, setDqReason] = useState<DisqualifiedReason | "">("");
  const [dqNote, setDqNote] = useState("");
  const [stageNote, setStageNote] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (!activeDealId) {
    return (
      <div className="card-elevated p-4 mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-lg bg-warning/10 p-2 flex-shrink-0">
            <Briefcase className="h-4 w-4 text-warning" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">{t("No active deal selected", "Ningún deal activo seleccionado")}</p>
            <p className="text-xs text-muted-foreground">
              {t("Your edits won't be saved. Open a deal to track this conversation.", "Tus cambios no se guardarán. Abre un deal para rastrear esta conversación.")}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => navigate("/deals")}>
          {t("Pick a deal", "Elegir un deal")}
        </Button>
      </div>
    );
  }

  if (!deal) return null;

  const handleStage = (next: DealStage) => {
    if (next === deal.stage) return;
    if (next === "won") {
      setWinAmount(
        deal.selected_option === "A" ? String(deal.price_a ?? "") :
        deal.selected_option === "B" ? String(deal.price_b ?? "") :
        deal.selected_option === "C" ? String(deal.price_c ?? "") :
        String(deal.price_a ?? "")
      );
      setWinNote("");
      setWinOpen(true);
      return;
    }
    if (next === "lost") {
      setLostReason("");
      setLostNote("");
      setLostOpen(true);
      return;
    }
    if (next === "disqualified") {
      setDqReason("");
      setDqNote("");
      setDqOpen(true);
      return;
    }
    setPendingStage(next);
    setStageNote("");
    setStageNoteOpen(true);
  };

  const persistStageNote = async (stage: DealStage, note: string) => {
    if (!note.trim()) return;
    await attachNoteToLatestStageEntry(deal.id, stage, note);
    qc.invalidateQueries({ queryKey: ["stage-history", deal.id] });
  };

  const confirmStageChange = () => {
    if (!pendingStage) return;
    const stage = pendingStage;
    const note = stageNote;
    updateStage.mutate(
      { id: deal.id, stage },
      {
        onSuccess: async () => {
          await persistStageNote(stage, note);
          if (stage === "follow_up" && user && grid) {
            try {
              const n = await scheduleSLAFollowUps(deal.id, user.id, grid.follow_up_sla);
              if (n > 0) {
                toast.success(`${n} ${t("follow-up touchpoints scheduled", "puntos de seguimiento programados")}`);
                qc.invalidateQueries({ queryKey: ["follow-ups"] });
                setComposerOpen(true);
              }
            } catch (e) {
              console.error(e);
            }
          }
        },
      }
    );
    setStageNoteOpen(false);
    setPendingStage(null);
    setStageNote("");
  };

  const confirmWin = () => {
    const note = winNote;
    updateStage.mutate(
      {
        id: deal.id,
        stage: "won",
        closed_amount: parseFloat(winAmount) || 0,
        selected_option: deal.selected_option,
      },
      { onSuccess: () => persistStageNote("won", note) }
    );
    setWinOpen(false);
  };

  const confirmLost = () => {
    const note = lostNote;
    updateStage.mutate(
      {
        id: deal.id,
        stage: "lost",
        lost_reason: lostReason.trim() || null,
      },
      { onSuccess: () => persistStageNote("lost", note) }
    );
    setLostOpen(false);
    setLostReason("");
    setLostNote("");
  };

  const confirmDq = () => {
    if (!dqReason) return;
    const note = dqNote;
    updateStage.mutate(
      {
        id: deal.id,
        stage: "disqualified",
        disqualified_reason: dqReason,
      },
      { onSuccess: () => persistStageNote("disqualified", note) }
    );
    setDqOpen(false);
    setDqReason("");
    setDqNote("");
  };




  return (
    <>
      <div className="card-elevated p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1 basis-64">
          <div className="rounded-lg bg-primary/10 p-2 flex-shrink-0">
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="block max-w-full truncate text-sm font-bold text-foreground hover:underline text-left"
            >
              {deal.homeowner1 || t("Untitled", "Sin título")}
              {deal.homeowner2 ? ` & ${deal.homeowner2}` : ""}
            </button>
            <p className="text-xs text-muted-foreground truncate">
              {[deal.address, deal.homeowner_phone, deal.homeowner_email].filter(Boolean).join(" · ") ||
                t("No contact info yet — tap edit to add", "Sin datos de contacto — toca editar para añadir")}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {t("Auto-saving", "Guardando automáticamente")} · {t("Updated", "Actualizado")} {new Date(deal.updated_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center flex-wrap justify-end gap-1.5 sm:gap-2 min-w-0">

          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${STAGE_COLORS[deal.stage]}`}>
            {stageLabels[deal.stage]}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-9 px-2 gap-1"
            onClick={() => setEditOpen(true)}
            aria-label={t("Edit customer info", "Editar información del cliente")}
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline text-xs font-semibold">{t("Edit", "Editar")}</span>
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 px-2 gap-1"
                aria-label={t("View stage history", "Ver historial de etapas")}
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-semibold">{t("History", "Historial")}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 max-h-96 overflow-y-auto">
              <StageHistoryTimeline deal={deal} />
            </PopoverContent>
          </Popover>
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5"
            onClick={() => setComposerOpen(true)}
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline text-xs font-semibold">{t("Follow-up", "Seguimiento")}</span>
          </Button>
          <Select value={deal.stage} onValueChange={(v) => handleStage(v as DealStage)}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(stageLabels) as DealStage[]).map((s) => (
                <SelectItem key={s} value={s}>{stageLabels[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setActiveDealId(null)}
            aria-label={t("Close active deal", "Cerrar deal activo")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={winOpen} onOpenChange={setWinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Mark deal as won 🎉", "Marcar deal como ganado 🎉")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>{t("Closed amount", "Monto cerrado")}</Label>
              <Input
                type="number"
                value={winAmount}
                onChange={(e) => setWinAmount(e.target.value)}
                placeholder="42000"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">{t("Selected option:", "Opción seleccionada:")} <span className="font-semibold">{deal.selected_option ?? "—"}</span></p>
            </div>
            <div className="space-y-1.5">
              <Label>{t("Note (optional)", "Nota (opcional)")}</Label>
              <Textarea
                value={winNote}
                onChange={(e) => setWinNote(e.target.value)}
                placeholder={t("What sealed it? Hot button, financing tier, who said yes…", "¿Qué lo selló? Hot button, tier de financiamiento, quién dijo sí…")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmWin}>{t("Confirm win", "Confirmar victoria")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lostOpen} onOpenChange={setLostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Mark deal as lost", "Marcar deal como perdido")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>{t("What was the main reason?", "¿Cuál fue la razón principal?")}</Label>
              <Input
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder={t("Price, timing, went with competitor...", "Precio, timing, se fueron con la competencia...")}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Note (optional)", "Nota (opcional)")}</Label>
              <Textarea
                value={lostNote}
                onChange={(e) => setLostNote(e.target.value)}
                placeholder={t("What did they say? Any objection you couldn't overcome?", "¿Qué dijeron? ¿Alguna objeción que no pudiste superar?")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmLost}>{t("Confirm loss", "Confirmar pérdida")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dqOpen} onOpenChange={setDqOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Mark deal as disqualified", "Marcar deal como descalificado")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>{t("Reason", "Razón")}</Label>
              <Select value={dqReason} onValueChange={(v) => setDqReason(v as DisqualifiedReason)}>
                <SelectTrigger autoFocus>
                  <SelectValue placeholder={t("Pick a disqualification reason…", "Elige una razón de descalificación…")} />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(dqLabels) as DisqualifiedReason[]).map((k) => (
                    <SelectItem key={k} value={k}>{dqLabels[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("Note (optional)", "Nota (opcional)")}</Label>
              <Textarea
                value={dqNote}
                onChange={(e) => setDqNote(e.target.value)}
                placeholder={t("Specifics — DTE %, credit score band, missing co-app, etc.", "Detalles — DTE %, banda de crédito, sin co-solicitante, etc.")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmDq} disabled={!dqReason}>{t("Confirm", "Confirmar")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      <Dialog open={stageNoteOpen} onOpenChange={setStageNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("Move to", "Mover a")} {pendingStage ? stageLabels[pendingStage] : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>{t("Note (optional)", "Nota (opcional)")}</Label>
              <Textarea
                value={stageNote}
                onChange={(e) => setStageNote(e.target.value)}
                placeholder={t("What did you say or observe? Hot button, next step, scheduled callback…", "¿Qué dijiste u observaste? Hot button, siguiente paso, callback programado…")}
                rows={4}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {t("Saved to the stage timeline. Skip to move without a note.", "Guardado en la línea de tiempo. Omite para mover sin nota.")}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={confirmStageChange}>
              {t("Skip", "Omitir")}
            </Button>
            <Button onClick={confirmStageChange}>
              {t("Save & move", "Guardar y mover")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FollowUpComposer
        dealId={activeDealId}
        open={composerOpen}
        onOpenChange={setComposerOpen}
      />

      <DealEditDialog
        deal={editOpen ? deal : null}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

    </>
  );
}
