import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  DEFAULT_TIERS,
  DEFAULT_MONTHLY_BONUS_TIERS,
  type CommissionGrid,
  type CommissionGridTier,
  type MonthlyPromo,
  type MonthlyBonusTier,
} from "@/types/commission";
import { DEFAULT_FOLLOW_UP_SLA, type FollowUpSLA } from "@/types/followUp";
import { toast } from "sonner";
import { errMsg } from "@/lib/errors";
import type { Json } from "@/integrations/supabase/types";

export function useCommissionGrid() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["commission-grid", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
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
          promos: [],
          monthly_bonus_tiers: DEFAULT_MONTHLY_BONUS_TIERS,
          follow_up_sla: DEFAULT_FOLLOW_UP_SLA,
        };
      }
      const row = data as typeof data & {
        promos?: unknown;
        monthly_bonus_tiers?: unknown;
        follow_up_sla?: unknown;
      };
      return {
        id: data.id,
        rep_id: data.rep_id,
        tiers: (data.tiers as unknown as CommissionGridTier[]) ?? DEFAULT_TIERS,
        front_end_pct: Number(data.front_end_pct),
        promos: (row.promos as unknown as MonthlyPromo[]) ?? [],
        monthly_bonus_tiers:
          (row.monthly_bonus_tiers as unknown as MonthlyBonusTier[]) ?? DEFAULT_MONTHLY_BONUS_TIERS,
        follow_up_sla:
          (row.follow_up_sla as unknown as FollowUpSLA) ?? DEFAULT_FOLLOW_UP_SLA,
      };
    },
  });
}

export function useSaveCommissionGrid() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      tiers: CommissionGridTier[];
      front_end_pct: number;
      promos?: MonthlyPromo[];
      monthly_bonus_tiers?: MonthlyBonusTier[];
      follow_up_sla?: FollowUpSLA;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const payload: Record<string, unknown> = {
        rep_id: user.id,
        tiers: input.tiers as unknown as Json,
        front_end_pct: input.front_end_pct,
      };
      if (input.promos) payload.promos = input.promos as unknown as Json;
      if (input.monthly_bonus_tiers)
        payload.monthly_bonus_tiers = input.monthly_bonus_tiers as unknown as Json;
      if (input.follow_up_sla)
        payload.follow_up_sla = input.follow_up_sla as unknown as Json;
      const { error } = await supabase
        .from("commission_grids")
        .upsert(payload as never, { onConflict: "rep_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commission-grid"] });
      toast.success("Saved");
    },
    onError: (err) => toast.error(errMsg(err, "Save failed")),
  });
}
