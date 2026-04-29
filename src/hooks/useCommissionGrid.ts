import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_TIERS, type CommissionGrid, type CommissionGridTier } from "@/types/commission";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export function useCommissionGrid() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["commission-grid", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<CommissionGrid> => {
      if (!user) throw new Error("not authed");
      const { data, error } = await supabase
        .from("commission_grids")
        .select("*")
        .eq("rep_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return {
          id: "",
          rep_id: user.id,
          tiers: DEFAULT_TIERS,
          front_end_pct: 50,
        };
      }
      return {
        id: data.id,
        rep_id: data.rep_id,
        tiers: (data.tiers as unknown as CommissionGridTier[]) ?? DEFAULT_TIERS,
        front_end_pct: Number(data.front_end_pct),
      };
    },
  });
}

export function useSaveCommissionGrid() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { tiers: CommissionGridTier[]; front_end_pct: number }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("commission_grids")
        .upsert(
          {
            rep_id: user.id,
            tiers: input.tiers as unknown as Json,
            front_end_pct: input.front_end_pct,
          },
          { onConflict: "rep_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commission-grid"] });
      toast.success("Commission grid saved");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Save failed"),
  });
}
