import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import { useDeal, useUpdateDealStage } from "@/hooks/useDeals";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Briefcase, X, ChevronDown, History } from "lucide-react";
import { STAGE_LABELS, STAGE_COLORS, type DealStage } from "@/types/deal";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StageHistoryTimeline from "@/components/StageHistoryTimeline";

export default function ActiveDealBanner() {
  const navigate = useNavigate();
  const { activeDealId, setActiveDealId } = useActiveDeal();
  const { data: deal } = useDeal(activeDealId);
  const updateStage = useUpdateDealStage();

  const [winOpen, setWinOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [winAmount, setWinAmount] = useState("");
  const [lostReason, setLostReason] = useState("");

  if (!activeDealId) {
    return (
      <div className="card-elevated p-4 mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-lg bg-warning/10 p-2 flex-shrink-0">
            <Briefcase className="h-4 w-4 text-warning" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">No active deal selected</p>
            <p className="text-xs text-muted-foreground">
              Your edits won't be saved. Open a deal to track this conversation.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => navigate("/deals")}>
          Pick a deal
        </Button>
      </div>
    );
  }

  if (!deal) return null;

  const handleStage = (next: DealStage) => {
    if (next === "won") {
      setWinAmount(
        deal.selected_option === "A" ? String(deal.price_a ?? "") :
        deal.selected_option === "B" ? String(deal.price_b ?? "") :
        deal.selected_option === "C" ? String(deal.price_c ?? "") :
        String(deal.price_a ?? "")
      );
      setWinOpen(true);
      return;
    }
    if (next === "lost") {
      setLostOpen(true);
      return;
    }
    updateStage.mutate({ id: deal.id, stage: next });
  };

  const confirmWin = () => {
    updateStage.mutate({
      id: deal.id,
      stage: "won",
      closed_amount: parseFloat(winAmount) || 0,
      selected_option: deal.selected_option,
    });
    setWinOpen(false);
  };

  const confirmLost = () => {
    updateStage.mutate({
      id: deal.id,
      stage: "lost",
      lost_reason: lostReason.trim() || null,
    });
    setLostOpen(false);
    setLostReason("");
  };

  return (
    <>
      <div className="card-elevated p-4 mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-lg bg-primary/10 p-2 flex-shrink-0">
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {deal.homeowner1 || "Untitled"}
              {deal.homeowner2 ? ` & ${deal.homeowner2}` : ""}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Auto-saving · Updated {new Date(deal.updated_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${STAGE_COLORS[deal.stage]}`}>
            {STAGE_LABELS[deal.stage]}
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 px-2 gap-1"
                aria-label="View stage history"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-semibold">History</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 max-h-96 overflow-y-auto">
              <StageHistoryTimeline deal={deal} />
            </PopoverContent>
          </Popover>
          <Select value={deal.stage} onValueChange={(v) => handleStage(v as DealStage)}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STAGE_LABELS) as DealStage[]).map((s) => (
                <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setActiveDealId(null)}
            aria-label="Close active deal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={winOpen} onOpenChange={setWinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark deal as won 🎉</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Closed amount</Label>
              <Input
                type="number"
                value={winAmount}
                onChange={(e) => setWinAmount(e.target.value)}
                placeholder="42000"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">Selected option: <span className="font-semibold">{deal.selected_option ?? "—"}</span></p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmWin}>Confirm win</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lostOpen} onOpenChange={setLostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark deal as lost</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>What was the main reason?</Label>
              <Input
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="Price, timing, went with competitor..."
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmLost}>Confirm loss</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
