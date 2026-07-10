import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Plus, Loader2, Briefcase, Search, LayoutGrid, LayoutList,
} from "lucide-react";
import { STAGE_LABELS, LEAD_SOURCE_LABELS, type DealStage, type LeadSource } from "@/types/deal";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import DealListCard from "@/components/deals/DealListCard";
import IncidentDialog from "@/components/incidents/IncidentDialog";
import DealEditDialog from "@/components/deals/DealEditDialog";
import { useT } from "@/contexts/LanguageContext";
import type { Incident } from "@/types/incident";
import type { Deal } from "@/types/deal";


type ViewMode = "comfortable" | "compact";

export default function DealsPage() {
  const t = useT();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { data: profiles = [] } = useAllProfiles(isAdmin);
  const profileMap = useMemo(() => buildProfileMap(profiles), [profiles]);
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
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // debounced
  const [viewMode, setViewMode] = useState<ViewMode>("comfortable");
  const [incidentPrefill, setIncidentPrefill] = useState<Partial<Incident> | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  // Debounce search so each keystroke doesn't refilter + rerender every card.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 150);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter((d) => {
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
  }, [deals, search, stageFilter]);

  const openDeal = useCallback((id: string, tab?: string) => {
    setActiveDealId(id);
    navigate("/", tab ? { state: { tab } } : undefined);
  }, [navigate, setActiveDealId]);

  const handleEdit = useCallback((d: Deal) => setEditingDeal(d), []);
  const handleIncident = useCallback((d: Deal) => {
    setIncidentPrefill({
      deal_id: d.id,
      customer_name: [d.homeowner1, d.homeowner2].filter(Boolean).join(" & ") || null,
      title: `Incident — ${d.homeowner1 || "deal"}`,
    });
  }, []);
  const handleDelete = useCallback((id: string, name: string) => {
    if (confirm(`Delete deal for ${name || "this homeowner"}?`)) {
      del.mutate(id);
    }
  }, [del]);

  if (authLoading) return null;
  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error(t("Add at least a homeowner name", "Añade al menos un nombre de propietario"));
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
    toast.success(t("Deal created — let's go close it", "Trato creado — ¡vamos a cerrarlo!"));
    navigate("/");
  };


  const isCompact = viewMode === "compact";

  return (
    <div className="min-h-screen surface-premium">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-display font-extrabold tracking-tight">
                {t("Your", "Tus")} <span className="gradient-text">{t("Deals", "Tratos")}</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("Every homeowner you've worked, all in one place.", "Cada propietario con el que has trabajado, todo en un solo lugar.")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(v) => v && setViewMode(v as ViewMode)}
                className="hidden sm:flex"
              >
                <ToggleGroupItem value="comfortable" aria-label={t("Comfortable view", "Vista cómoda")}>
                  <LayoutList className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="compact" aria-label={t("Compact view", "Vista compacta")}>
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
              <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as DealStage | "all")}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All stages", "Todas las etapas")}</SelectItem>
                  {(Object.keys(STAGE_LABELS) as DealStage[]).map((s) => (
                    <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" /> {t("New Deal", "Nuevo Trato")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("Start a new deal", "Iniciar un nuevo trato")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label>{t("Homeowner name", "Nombre del propietario")}</Label>
                      <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="John Smith" autoFocus />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("Address (optional)", "Dirección (opcional)")}</Label>
                      <Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="123 Main St" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>{t("Email", "Correo")}</Label>
                        <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="homeowner@email.com" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t("Phone", "Teléfono")}</Label>
                        <Input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="(555) 555-5555" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("Lead source", "Fuente del lead")}</Label>
                      <Select value={newLeadSource} onValueChange={(v) => setNewLeadSource(v as LeadSource | "unset")}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("How did this lead come in?", "¿Cómo llegó este lead?")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unset">{t("Not set", "Sin definir")}</SelectItem>
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
                      {t("Create & open", "Crear y abrir")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Search deals by name, address, product, stage...", "Buscar tratos por nombre, dirección, producto, etapa…")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
            <h3 className="text-lg font-bold text-foreground mb-1">{t("No deals yet", "Aún no hay tratos")}</h3>
            <p className="text-sm text-muted-foreground mb-5">
              {t("Click \"New Deal\" above to start your first one. Everything you enter will save automatically.", "Haz clic en \"Nuevo Trato\" arriba para empezar el primero. Todo lo que ingreses se guarda automáticamente.")}
            </p>
          </div>

        ) : (
          <div className={`grid gap-4 ${isCompact ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 lg:grid-cols-2"}`}>
            {filtered.map((deal) => (
              <DealListCard
                key={deal.id}
                deal={deal}
                compact={isCompact}
                isAdmin={isAdmin}
                repProfile={profileMap.get(deal.rep_id)}
                onOpen={openDeal}
                onEdit={handleEdit}
                onIncident={handleIncident}
                onDelete={handleDelete}
              />
            ))}
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
