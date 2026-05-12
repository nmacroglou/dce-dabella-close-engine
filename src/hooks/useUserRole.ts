import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "rep";

/** Fetches the current user's roles from `user_roles`. */
export function useUserRoles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-roles", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<AppRole[]> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });
}

export function useIsAdmin() {
  const { data: roles = [], isLoading } = useUserRoles();
  return { isAdmin: roles.includes("admin"), isLoading };
}
