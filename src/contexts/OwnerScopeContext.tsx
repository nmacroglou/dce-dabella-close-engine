import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRole";

/**
 * Controls which rep's data the metrics-driven views (Dashboard, Ledger,
 * Manage Up, etc.) show.
 *
 * - Non-admins are always pinned to their own user id.
 * - Admins can choose:
 *     • "me"           → just their own deals (default — safest)
 *     • "all"          → every rep's deals (team-wide view)
 *     • "<repUserId>"  → a specific rep's deals
 */
export type OwnerScope = "me" | "all" | string;

interface OwnerScopeContextValue {
  /** Raw scope value (admin choice). For non-admins, always "me". */
  scope: OwnerScope;
  setScope: (s: OwnerScope) => void;
  /**
   * The rep id to filter queries by, or `null` when the admin chose "all".
   * Non-admins always get their own user id (never null).
   */
  effectiveRepId: string | null;
  isAdmin: boolean;
}

const OwnerScopeContext = createContext<OwnerScopeContextValue | undefined>(undefined);

const STORAGE_KEY = "owner-scope";

export function OwnerScopeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();

  const [scope, setScopeState] = useState<OwnerScope>(() => {
    if (typeof window === "undefined") return "me";
    return (localStorage.getItem(STORAGE_KEY) as OwnerScope) || "me";
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, scope);
    } catch { /* ignore */ }
  }, [scope]);

  const effectiveRepId = useMemo(() => {
    if (!user) return null;
    if (!isAdmin) return user.id; // hard-pin reps to their own data
    if (scope === "all") return null;
    if (scope === "me") return user.id;
    return scope; // specific rep id
  }, [user, isAdmin, scope]);

  const value: OwnerScopeContextValue = {
    scope: isAdmin ? scope : "me",
    setScope: setScopeState,
    effectiveRepId,
    isAdmin,
  };

  return <OwnerScopeContext.Provider value={value}>{children}</OwnerScopeContext.Provider>;
}

export function useOwnerScope() {
  const ctx = useContext(OwnerScopeContext);
  if (!ctx) throw new Error("useOwnerScope must be used within OwnerScopeProvider");
  return ctx;
}
