import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { DealStage } from "@/types/deal";

export interface StageHistoryEntry {
  id: string;
  deal_id: string;
  rep_id: string;
  from_stage: DealStage | null;
  to_stage: DealStage;
  changed_at: string;
}

export function useStageHistory(dealId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["stage-history", dealId],
    enabled: !!user && !!dealId,
    queryFn: async (): Promise<StageHistoryEntry[]> => {
      if (!dealId) return [];
      const { data, error } = await supabase
        .from("deal_stage_history")
        .select("*")
        .eq("deal_id", dealId)
        .order("changed_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as StageHistoryEntry[];
    },
  });
}
