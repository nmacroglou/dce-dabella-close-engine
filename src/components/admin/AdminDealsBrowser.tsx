import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Search, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDeals, useDeleteDeal } from "@/hooks/useDeals";
import { useAllProfiles, buildProfileMap } from "@/hooks/useProfiles";
import { useOwnerScope } from "@/contexts/OwnerScopeContext";
import { useAuth } from "@/contexts/AuthContext";
import { STAGE_LABELS, STAGE_COLORS, type DealStage } from "@/types/deal";
import { formatCurrency } from "@/lib/format";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Admin-only browser for every rep's deals. Honors the OwnerScopeFilter in the
 * header (when admin picks "All reps" they see everything; otherwise scoped).
 * Lets admins delete a deal outright.
 */
export default function AdminDealsBrowser() {
  const { user } = useAuth();
  const { scope, setScope } = useOwnerScope();
  const { data: deals = [], isLoading } = useDeals();
  const { data: profiles = [] } = useAllProfiles(true);
  const deleteDeal = useDeleteDeal();
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState<DealStage | "all">("all");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; label: string } | null>(null);

  const profileMap = useMemo(() => buildProfileMap(profiles), [profiles]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return deals.filter((d) => {
      if (stageFilter !== "all" && d.stage !== stageFilter) return false;
      if (!needle) return true;
      const rep = profileMap.get(d.rep_id);
      const hay = [
        d.homeowner1, d.homeowner2, d.address, d.homeowner_email,
        rep?.display_name, rep?.email,
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }, [deals, q, stageFilter, profileMap]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setScope("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              scope === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >All reps</button>
          <button
            onClick={() => setScope("me")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              scope === "me" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >Only mine</button>
          <select
            value={scope !== "all" && scope !== "me" ? scope : ""}
            onChange={(e) => e.target.value && setScope(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted text-foreground border border-hairline focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Pick a rep…</option>
            {profiles
              .slice()
              .sort((a, b) => (a.display_name ?? a.email ?? "").localeCompare(b.display_name ?? b.email ?? ""))
              .map((p) => (
                <option key={p.user_id} value={p.user_id}>
                  {p.display_name || p.email || p.user_id.slice(0, 8)}
                  {p.user_id === user?.id ? " (me)" : ""}
                </option>
              ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as DealStage | "all")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted text-foreground border border-hairline focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">All stages</option>
            {(Object.keys(STAGE_LABELS) as DealStage[]).map((s) => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search homeowner, address, rep…"
              className="pl-8 pr-3 py-1.5 rounded-lg bg-background border border-hairline text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-56"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-xs text-muted-foreground">
          <Briefcase className="h-6 w-6 mx-auto mb-2 opacity-50" />
          No deals match.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-2 py-2 font-semibold">Homeowner</th>
                <th className="text-left px-2 py-2 font-semibold">Rep</th>
                <th className="text-left px-2 py-2 font-semibold">Stage</th>
                <th className="text-right px-2 py-2 font-semibold">Value</th>
                <th className="text-left px-2 py-2 font-semibold">Updated</th>
                <th className="text-right px-2 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((d) => {
                const rep = profileMap.get(d.rep_id);
                const value = d.closed_amount ?? d.price_a ?? d.price_b ?? d.price_c ?? 0;
                return (
                  <tr key={d.id} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="px-2 py-2">
                      <div className="font-semibold text-foreground truncate max-w-[220px]">
                        {d.homeowner1 || "—"}{d.homeowner2 ? ` & ${d.homeowner2}` : ""}
                      </div>
                      {d.address && <div className="text-[11px] text-muted-foreground truncate max-w-[220px]">{d.address}</div>}
                    </td>
                    <td className="px-2 py-2 text-xs text-muted-foreground truncate max-w-[160px]">
                      {rep?.display_name || rep?.email || d.rep_id.slice(0, 8)}
                    </td>
                    <td className="px-2 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${STAGE_COLORS[d.stage]}`}>
                        {STAGE_LABELS[d.stage]}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums font-semibold">
                      {value ? formatCurrency(value) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-2 py-2 text-[11px] text-muted-foreground tabular-nums">
                      {new Date(d.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        onClick={() => setPendingDelete({
                          id: d.id,
                          label: `${d.homeowner1 || "Untitled"} (${rep?.display_name || rep?.email || "rep"})`,
                        })}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length > 100 && (
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              Showing first 100 of {filtered.length}. Refine your search to see more.
            </p>
          )}
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete deal?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <span className="font-semibold text-foreground">{pendingDelete?.label}</span> for everyone.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!pendingDelete) return;
                try {
                  await deleteDeal.mutateAsync(pendingDelete.id);
                  qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
                } finally {
                  setPendingDelete(null);
                }
              }}
            >
              Delete deal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
