import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDeals, useCreateDeal, useDeleteDeal } from "@/hooks/useDeals";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Trash2, Briefcase, MapPin, Calendar, ArrowRight } from "lucide-react";
import { STAGE_LABELS, STAGE_COLORS, type DealStage } from "@/types/deal";
import { fmt } from "@/lib/format";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";

export default function DealsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: deals = [], isLoading } = useDeals();
  const create = useCreateDeal();
  const del = useDeleteDeal();
  const { setActiveDealId } = useActiveDeal();

  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [stageFilter, setStageFilter] = useState<DealStage | "all">("all");

  if (authLoading) return null;
  if (!user) {
    navigate("/auth");
    return null;
  }

  const filtered = deals.filter((d) => stageFilter === "all" || d.stage === stageFilter);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Add at least a homeowner name");
      return;
    }
    const deal = await create.mutateAsync({
      homeowner1: newName.trim(),
      address: newAddress.trim(),
    });
    setActiveDealId(deal.id);
    setOpen(false);
    setNewName("");
    setNewAddress("");
    toast.success("Deal created — let's go close it");
    navigate("/");
  };

  const openDeal = (id: string) => {
    setActiveDealId(id);
    navigate("/");
  };

  return (
    <div className="min-h-screen surface-premium">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-extrabold tracking-tight">
              Your <span className="gradient-text">Deals</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Every homeowner you've worked, all in one place.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as DealStage | "all")}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {(Object.keys(STAGE_LABELS) as DealStage[]).map((s) => (
                  <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> New Deal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start a new deal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Homeowner name</Label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="John Smith" autoFocus />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Address (optional)</Label>
                    <Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="123 Main St" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={create.isPending}>
                    {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create & open
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-elevated-lg p-12 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground mb-1">No deals yet</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Click "New Deal" above to start your first one. Everything you enter will save automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((deal) => (
              <div key={deal.id} className="card-premium p-5 flex flex-col hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] transition-all pressable group">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground truncate">
                      {deal.homeowner1 || "Untitled deal"}
                      {deal.homeowner2 ? ` & ${deal.homeowner2}` : ""}
                    </h3>
                    {deal.address && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        {deal.address}
                      </p>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${STAGE_COLORS[deal.stage]}`}>
                    {STAGE_LABELS[deal.stage]}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                  {deal.products.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3" />
                      <span className="truncate">{deal.products.join(", ")}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    <span>Updated {new Date(deal.updated_at).toLocaleDateString()}</span>
                  </div>
                  {deal.stage === "won" && deal.closed_amount ? (
                    <div className="text-success font-semibold pt-1">Won {fmt(deal.closed_amount)}</div>
                  ) : deal.price_a ? (
                    <div className="font-medium text-foreground">Top option: {fmt(deal.price_a)}</div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 mt-auto pt-3 border-t border-hairline">
                  <Button size="sm" className="flex-1" onClick={() => openDeal(deal.id)}>
                    Open <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Delete deal for ${deal.homeowner1 || "this homeowner"}?`)) {
                        del.mutate(deal.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
