import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDeals, useCreateDeal, useDeleteDeal } from "@/hooks/useDeals";
import { useAllProfiles, buildProfileMap } from "@/hooks/useProfiles";
import { useIsAdmin } from "@/hooks/useUserRole";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Plus, Loader2, Trash2, Briefcase, MapPin, Calendar, ArrowRight, Calculator, ChevronDown,
  ShieldAlert, Search, LayoutGrid, LayoutList, User, Pencil,
} from "lucide-react";
import { STAGE_LABELS, STAGE_COLORS, LEAD_SOURCE_LABELS, type DealStage, type LeadSource } from "@/types/deal";
import { fmt } from "@/lib/format";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import DealTagsEditor from "@/components/deals/DealTagsEditor";
import DealContactEditor from "@/components/deals/DealContactEditor";
import PreliminaryEstimateCard from "@/components/deals/PreliminaryEstimateCard";
import ClosedAtEditor from "@/components/deals/ClosedAtEditor";
import IncidentDialog from "@/components/incidents/IncidentDialog";
import DealEditDialog from "@/components/deals/DealEditDialog";
import type { Incident } from "@/types/incident";
import type { Deal } from "@/types/deal";
import { computeEstimate, type PreliminaryEstimateInput } from "@/data/roofingPricing";

type ViewMode = "comfortable" | "compact";

export default function DealsPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { data: profiles = [] } = useAllProfiles(isAdmin);
  const profileMap = buildProfileMap(profiles);
  const navigate = useNavigate();
  const { data: deals = [], isLoading } = useDeals();
  const create = useCreateDeal();
  const del = useDeleteDeal();
  const { setActiveDealId } = useActiveDeal();

  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newLeadSource, setNewLeadSource] = useState<LeadSource | "unset">("unset");
  const [stageFilter, setStageFilter] = useState<DealStage | "all">("all");
  const [expandedEstimate, setExpandedEstimate] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("comfortable");
  const [incidentPrefill, setIncidentPrefill] = useState<Partial<Incident> | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  if (authLoading) return null;
  if (!user) {
    navigate("/auth");
    return null;
  }

  const q = search.trim().toLowerCase();
  const filtered = deals.filter((d) => {
    const stageOk = stageFilter === "all" || d.stage === stageFilter;
    if (!q) return stageOk;
    const hay = [
      d.homeowner1,
      d.homeowner2,
      d.address,
      STAGE_LABELS[d.stage],
      d.lead_source ? LEAD_SOURCE_LABELS[d.lead_source] : "",
      ...d.products,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return stageOk && hay.includes(q);
  });

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Add at least a homeowner name");
      return;
    }
    const deal = await create.mutateAsync({
      homeowner1: newName.trim(),
      address: newAddress.trim(),
      homeowner_email: newEmail.trim() || null,
      homeowner_phone: newPhone.trim() || null,
      lead_source: newLeadSource === "unset" ? null : newLeadSource,
    });
    setActiveDealId(deal.id);
    setOpen(false);
    setNewName("");
    setNewAddress("");
    setNewEmail("");
    setNewPhone("");
    setNewLeadSource("unset");
    toast.success("Deal created — let's go close it");
    navigate("/");
  };

  const openDeal = (id: string) => {
    setActiveDealId(id);
    navigate("/");
  };

  const RepBadge = ({ repId }: { repId: string }) => {
    const p = profileMap.get(repId);
    const label = p?.display_name || p?.email || repId.slice(0, 8);
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
        <User className="h-2.5 w-2.5" />
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen surface-premium">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-display font-extrabold tracking-tight">
                Your <span className="gradient-text">Deals</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Every homeowner you've worked, all in one place.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(v) => v && setViewMode(v as ViewMode)}
                className="hidden sm:flex"
              >
                <ToggleGroupItem value="comfortable" aria-label="Comfortable view">
                  <LayoutList className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="compact" aria-label="Compact view">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
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
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Email</Label>
                        <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="homeowner@email.com" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Phone</Label>
                        <Input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="(555) 555-5555" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Lead source</Label>
                      <Select value={newLeadSource} onValueChange={(v) => setNewLeadSource(v as LeadSource | "unset")}>
                        <SelectTrigger>
                          <SelectValue placeholder="How did this lead come in?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unset">Not set</SelectItem>
                          {(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((k) => (
                            <SelectItem key={k} value={k}>{LEAD_SOURCE_LABELS[k]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deals by name, address, product, stage..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
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
          <div className={`grid gap-4 ${viewMode === "compact" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 lg:grid-cols-2"}`}>
            {filtered.map((deal) => {
              const isExpanded = expandedEstimate === deal.id;
              const prelim = ((deal as unknown as { preliminary_estimate?: PreliminaryEstimateInput }).preliminary_estimate) ?? undefined;
              const hasPrelim = prelim && (prelim.squares || prelim.shingleId);
              const isCompact = viewMode === "compact";

              if (isCompact) {
                return (
                  <div key={deal.id} className="card-premium p-3 flex flex-col group">
                    <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-foreground truncate">
                        {deal.homeowner1 || "Untitled deal"}
                        {deal.homeowner2 ? ` & ${deal.homeowner2}` : ""}
                      </h3>
                      {deal.address && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                          <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                          {deal.address}
                        </p>
                      )}
                      {isAdmin && <div className="mt-1"><RepBadge repId={deal.rep_id} /></div>}
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0 ${STAGE_COLORS[deal.stage]}`}>
                      {STAGE_LABELS[deal.stage]}
                    </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-muted-foreground mb-3">
                      {deal.products.length > 0 && (
                        <div className="truncate">{deal.products.join(", ")}</div>
                      )}
                      {deal.stage === "won" && deal.closed_amount ? (
                        <div className="text-success font-semibold">Won {fmt(deal.closed_amount)}</div>
                    ) : deal.stage === "lost" ? (
                      <div className="text-destructive font-semibold">Lost</div>
                    ) : deal.price_a ? (
                      <div className="font-medium text-foreground">
                        Top option: {fmt(deal.price_a)}
                        {deal.selected_option && (
                          <span className="ml-1 text-[10px] text-primary">· Option {deal.selected_option}</span>
                        )}
                        {(() => {
                          const original = deal.selected_option === "B" ? deal.price_b : deal.selected_option === "C" ? deal.price_c : deal.price_a;
                          if (deal.closed_amount && original && original > deal.closed_amount) {
                            const pct = Math.round((1 - deal.closed_amount / original) * 100);
                            return <span className="ml-1 text-[10px] text-accent">· {pct}% off</span>;
                          }
                          return null;
                        })()}
                      </div>
                    ) : hasPrelim ? (
                      (() => {
                        const b = computeEstimate({
                          squares: prelim!.squares ?? 0,
                          shingleId: prelim!.shingleId ?? null,
                          accessories: prelim!.accessories ?? {},
                          hasSolar: prelim!.hasSolar ?? false,
                          notes: prelim!.notes ?? "",
                        });
                        return (
                          <div className="font-medium text-foreground flex items-center gap-1">
                            <Calculator className="h-2.5 w-2.5 text-primary" />
                            Prelim: {fmt(b.low)} – {fmt(b.high)}
                          </div>
                        );
                      })()
                    ) : null}
                    </div>

                    <div className="mb-3">
                      <DealTagsEditor deal={deal} size="sm" />
                    </div>

                    <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-hairline">
                      <Button size="sm" className="flex-1 pressable h-7 text-[11px]" onClick={() => openDeal(deal.id)}>
                        Open <ArrowRight className="h-2.5 w-2.5 ml-1" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        title="Edit deal details"
                        onClick={() => setEditingDeal(deal)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        title="Log an incident for this deal"
                        onClick={() => setIncidentPrefill({
                          deal_id: deal.id,
                          customer_name: [deal.homeowner1, deal.homeowner2].filter(Boolean).join(" & ") || null,
                          title: `Incident — ${deal.homeowner1 || "deal"}`,
                        })}
                      >
                        <ShieldAlert className="h-3.5 w-3.5 text-warning" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          if (confirm(`Delete deal for ${deal.homeowner1 || "this homeowner"}?`)) {
                            del.mutate(deal.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={deal.id} className="card-premium p-5 flex flex-col group">
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
                      {isAdmin && <div className="mt-1"><RepBadge repId={deal.rep_id} /></div>}
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
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-success font-semibold">Won {fmt(deal.closed_amount)}</span>
                        <ClosedAtEditor dealId={deal.id} closedAt={deal.closed_at} label="Closed" />
                      </div>
                    ) : deal.stage === "lost" ? (
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-destructive font-semibold">Lost</span>
                        <ClosedAtEditor dealId={deal.id} closedAt={deal.closed_at} label="On" />
                      </div>
                    ) : deal.price_a ? (
                      <div className="font-medium text-foreground">Top option: {fmt(deal.price_a)}</div>
                    ) : hasPrelim ? (
                      (() => {
                        const b = computeEstimate({
                          squares: prelim!.squares ?? 0,
                          shingleId: prelim!.shingleId ?? null,
                          accessories: prelim!.accessories ?? {},
                          hasSolar: prelim!.hasSolar ?? false,
                          notes: prelim!.notes ?? "",
                        });
                        return (
                          <div className="font-medium text-foreground flex items-center gap-1">
                            <Calculator className="h-3 w-3 text-primary" />
                            Prelim: {fmt(b.low)} – {fmt(b.high)}
                          </div>
                        );
                      })()
                    ) : null}
                  </div>

                  <div className="mb-3">
                    <DealContactEditor deal={deal} />
                  </div>

                  <div className="mb-3">
                    <DealTagsEditor deal={deal} />
                  </div>

                  <button
                    onClick={() => setExpandedEstimate(isExpanded ? null : deal.id)}
                    className="flex items-center justify-between gap-2 rounded-lg border border-hairline bg-muted/30 px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40 transition-colors mb-3 pressable"
                  >
                    <span className="flex items-center gap-1.5">
                      <Calculator className="h-3.5 w-3.5 text-primary" />
                      Preliminary estimate
                      {hasPrelim && <span className="text-[10px] font-normal text-muted-foreground">· saved</span>}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  {isExpanded && (
                    <div className="mb-3 -mx-1">
                      <PreliminaryEstimateCard dealId={deal.id} initial={prelim} />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-auto pt-3 border-t border-hairline">
                    <Button size="sm" className="flex-1 pressable" onClick={() => openDeal(deal.id)}>
                      Open <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Edit deal details"
                      onClick={() => setEditingDeal(deal)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Log an incident for this deal"
                      onClick={() => setIncidentPrefill({
                        deal_id: deal.id,
                        customer_name: [deal.homeowner1, deal.homeowner2].filter(Boolean).join(" & ") || null,
                        title: `Incident — ${deal.homeowner1 || "deal"}`,
                      })}
                    >
                      <ShieldAlert className="h-4 w-4 text-warning" />
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
              );
            })}
          </div>
        )}
      </main>
      <IncidentDialog
        open={!!incidentPrefill}
        onClose={() => setIncidentPrefill(null)}
        prefill={incidentPrefill}
      />
      <DealEditDialog
        open={!!editingDeal}
        deal={editingDeal}
        onClose={() => setEditingDeal(null)}
      />
    </div>
  );
}
