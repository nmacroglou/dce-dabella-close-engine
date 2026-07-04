import { useEffect, useState } from "react";
import { Loader2, Trash2, ExternalLink, BellRing, CalendarDays, StickyNote } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUpdateDeal } from "@/hooks/useDeals";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import type { Deal } from "@/types/deal";
import { toast } from "sonner";

interface Props {
  deal: Deal | null;
  open: boolean;
  onClose: () => void;
}

const DEFAULT_LEADS = [5, 3, 1];
const LEAD_OPTIONS = [7, 5, 3, 2, 1, 0];

function getLeadDays(deal: Deal): number[] {
  const raw = (deal.engine_state as { install_alert_days?: number[] } | null)?.install_alert_days;
  return Array.isArray(raw) ? raw : DEFAULT_LEADS;
}

export default function InstallEditDialog({ deal, open, onClose }: Props) {
  const update = useUpdateDeal();
  const { setActiveDealId } = useActiveDeal();
  const [installDate, setInstallDate] = useState("");
  const [installNotes, setInstallNotes] = useState("");
  const [leads, setLeads] = useState<number[]>(DEFAULT_LEADS);

  useEffect(() => {
    if (!deal) return;
    setInstallDate(deal.install_date ?? "");
    setInstallNotes(deal.install_notes ?? "");
    setLeads(getLeadDays(deal));
  }, [deal]);

  if (!deal) return null;

  const homeowner = `${deal.homeowner1 || "Untitled"}${deal.homeowner2 ? ` & ${deal.homeowner2}` : ""}`;

  const toggleLead = (n: number) => {
    setLeads((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort((a, b) => b - a)));
  };

  const save = async () => {
    try {
      await update.mutateAsync({
        id: deal.id,
        updates: {
          install_date: installDate || null,
          install_notes: installNotes.trim() || null,
          engine_state: { ...(deal.engine_state ?? {}), install_alert_days: leads },
        },
      });
      toast.success("Install updated");
      onClose();
    } catch {
      // hook toasts
    }
  };

  const clearDate = async () => {
    try {
      await update.mutateAsync({ id: deal.id, updates: { install_date: null } });
      toast.success("Install date cleared");
      onClose();
    } catch { /* hook toasts */ }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Edit install
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between gap-2">
            <span className="truncate">
              {homeowner}
              {deal.address && <span className="text-muted-foreground"> · {deal.address}</span>}
            </span>
            <Link
              to="/"
              onClick={() => setActiveDealId(deal.id)}
              className="shrink-0 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              Open deal <ExternalLink className="h-3 w-3" />
            </Link>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Install date</Label>
            <Input type="date" value={installDate} onChange={(e) => setInstallDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><StickyNote className="h-3.5 w-3.5" /> Install notes</Label>
            <Textarea
              rows={3}
              value={installNotes}
              onChange={(e) => setInstallNotes(e.target.value)}
              placeholder="Crew, gate code, prep, materials, homeowner requests…"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><BellRing className="h-3.5 w-3.5" /> Alert lead times</Label>
            <div className="flex flex-wrap gap-2">
              {LEAD_OPTIONS.map((n) => {
                const active = leads.includes(n);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => toggleLead(n)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-hairline hover:border-primary/40"
                    }`}
                  >
                    {n === 0 ? "Day of" : `${n}d before`}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Days out from the install date that trigger heads-up alerts on your dashboard.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" size="sm" onClick={clearDate} disabled={!installDate || update.isPending}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear date
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={update.isPending}>
              {update.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
