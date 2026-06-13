import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck, User as UserIcon, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errMsg } from "@/lib/errors";
import { useAuth } from "@/contexts/AuthContext";
import type { AppRole } from "@/hooks/useUserRole";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProfileRow {
  user_id: string;
  email: string | null;
  display_name: string | null;
}
interface RoleRow {
  user_id: string;
  role: AppRole;
}

function useAllProfilesAndRoles() {
  return useQuery({
    queryKey: ["admin-users-roles"],
    staleTime: 30_000,
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("user_id,email,display_name"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      if (profiles.error) throw profiles.error;
      if (roles.error) throw roles.error;
      return {
        profiles: (profiles.data ?? []) as ProfileRow[],
        roles: (roles.data ?? []) as RoleRow[],
      };
    },
  });
}

export default function RoleManager() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading, error } = useAllProfilesAndRoles();
  const [q, setQ] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ user_id: string; label: string } | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const setRole = useMutation({
    mutationFn: async ({ user_id, role, enable }: { user_id: string; role: AppRole; enable: boolean }) => {
      if (enable) {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id, role });
        // ignore unique-violation (already has role)
        if (error && !/duplicate|unique/i.test(error.message)) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", user_id)
          .eq("role", role);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users-roles"] });
      qc.invalidateQueries({ queryKey: ["user-roles"] });
      toast.success("Role updated");
    },
    onError: (e) => toast.error(errMsg(e, "Failed to update role")),
  });

  const deleteRep = useMutation({
    mutationFn: async (target_user_id: string) => {
      const { data, error } = await supabase.functions.invoke("delete-rep", {
        body: { target_user_id },
      });
      if (error) throw error;
      if (data && (data as { error?: string }).error) throw new Error((data as { error: string }).error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users-roles"] });
      qc.invalidateQueries({ queryKey: ["all-profiles"] });
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["admin-metrics"] });
      toast.success("Rep deleted");
      setPendingDelete(null);
      setConfirmText("");
    },
    onError: (e) => toast.error(errMsg(e, "Failed to delete rep")),
  });

  const rolesByUser = useMemo(() => {
    const map = new Map<string, Set<AppRole>>();
    data?.roles.forEach((r) => {
      const s = map.get(r.user_id) ?? new Set<AppRole>();
      s.add(r.role);
      map.set(r.user_id, s);
    });
    return map;
  }, [data]);

  const filtered = useMemo(() => {
    const list = data?.profiles ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((p) =>
      (p.email ?? "").toLowerCase().includes(needle) ||
      (p.display_name ?? "").toLowerCase().includes(needle)
    );
  }, [data, q]);

  if (isLoading) {
    return (
      <div className="grid place-items-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }
  if (error) {
    return <p className="text-destructive text-sm">Failed to load users: {String(error)}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left px-2 py-2 font-semibold">User</th>
              <th className="text-center px-2 py-2 font-semibold">Rep</th>
              <th className="text-center px-2 py-2 font-semibold">Admin</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={3} className="text-center py-6 text-muted-foreground text-xs">No users found.</td></tr>
            )}
            {filtered.map((p) => {
              const has = rolesByUser.get(p.user_id) ?? new Set<AppRole>();
              const isAdmin = has.has("admin");
              const isRep = has.has("rep");
              const pending = setRole.isPending && setRole.variables?.user_id === p.user_id;
              return (
                <tr key={p.user_id} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="px-2 py-2">
                    <div className="font-semibold text-foreground truncate max-w-[280px]">
                      {p.display_name || p.email || p.user_id.slice(0, 8)}
                    </div>
                    {p.email && <div className="text-[11px] text-muted-foreground truncate max-w-[280px]">{p.email}</div>}
                  </td>
                  <RoleCell
                    active={isRep}
                    disabled={pending}
                    icon={<UserIcon className="h-3.5 w-3.5" />}
                    label="Rep"
                    activeClass="bg-primary/15 text-primary border-primary/30"
                    onToggle={() => setRole.mutate({ user_id: p.user_id, role: "rep", enable: !isRep })}
                  />
                  <RoleCell
                    active={isAdmin}
                    disabled={pending}
                    icon={<ShieldCheck className="h-3.5 w-3.5" />}
                    label="Admin"
                    activeClass="bg-success/15 text-success border-success/30"
                    onToggle={() => setRole.mutate({ user_id: p.user_id, role: "admin", enable: !isAdmin })}
                  />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Reps see only their own data. Admins see all reps and the Admin Console.
      </p>
    </div>
  );
}

function RoleCell({
  active, disabled, icon, label, activeClass, onToggle,
}: {
  active: boolean; disabled: boolean; icon: React.ReactNode; label: string; activeClass: string; onToggle: () => void;
}) {
  return (
    <td className="px-2 py-2 text-center">
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold transition-colors disabled:opacity-50 ${
          active ? activeClass : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
        }`}
        aria-pressed={active}
      >
        {icon}
        {active ? label : `+ ${label}`}
      </button>
    </td>
  );
}
