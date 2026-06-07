import { Users } from "lucide-react";
import { useOwnerScope } from "@/contexts/OwnerScopeContext";
import { useAllProfiles } from "@/hooks/useProfiles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Admin-only owner selector — controls which rep's data feeds the
 * dashboards / ledger / manage-up / etc.
 * Hidden entirely for non-admin reps (they only ever see their own data).
 */
export default function OwnerScopeFilter() {
  const { isAdmin, scope, setScope } = useOwnerScope();
  const { user } = useAuth();
  const { data: profiles = [] } = useAllProfiles(isAdmin);

  if (!isAdmin) return null;

  const sorted = [...profiles].sort((a, b) => {
    const an = (a.display_name || a.email || "").toLowerCase();
    const bn = (b.display_name || b.email || "").toLowerCase();
    return an.localeCompare(bn);
  });

  const currentLabel = (() => {
    if (scope === "all") return "All reps";
    if (scope === "me") return "Only mine";
    const p = profiles.find((x) => x.user_id === scope);
    return p ? p.display_name || p.email || "Rep" : "Rep";
  })();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/60 border border-hairline hover:bg-muted hover:border-hairline-strong transition-colors pressable text-xs font-semibold text-foreground max-w-[180px]"
          aria-label="Filter metrics by rep"
          title="Filter metrics by rep"
        >
          <Users className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span className="truncate">{currentLabel}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
          View metrics for
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => setScope("me")}
          className={scope === "me" ? "font-bold text-primary" : ""}
        >
          Only mine
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setScope("all")}
          className={scope === "all" ? "font-bold text-primary" : ""}
        >
          All reps (team)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
          By rep
        </DropdownMenuLabel>
        {sorted.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">No reps found</div>
        )}
        {sorted.map((p) => {
          const label = p.display_name || p.email || p.user_id.slice(0, 8);
          const isMe = p.user_id === user?.id;
          const active = scope === p.user_id;
          return (
            <DropdownMenuItem
              key={p.user_id}
              onClick={() => setScope(p.user_id)}
              className={active ? "font-bold text-primary" : ""}
            >
              <span className="truncate">
                {label}
                {isMe && <span className="ml-1 text-muted-foreground">(me)</span>}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
