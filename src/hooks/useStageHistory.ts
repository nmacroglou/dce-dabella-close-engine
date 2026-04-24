import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { DealStage } from "@/types/deal";
import { toast } from "sonner";

export interface StageHistoryEntry {
  id: string;
  deal_id: string;
  rep_id: string;
  from_stage: DealStage | null;
  to_stage: DealStage;
  changed_at: string;
  note: string | null;
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

/** Update a note on an existing stage history entry */
export function useUpdateStageNote() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string | null }) => {
      const { error } = await supabase
        .from("deal_stage_history")
        .update({ note: note?.trim() || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["stage-history"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save note");
    },
  });
}

/** Attach a note to the most recent stage history row for a deal (called right after stage change) */
export async function attachNoteToLatestStageEntry(
  dealId: string,
  toStage: DealStage,
  note: string,
) {
  const trimmed = note.trim();
  if (!trimmed) return;
  const { data, error } = await supabase
    .from("deal_stage_history")
    .select("id")
    .eq("deal_id", dealId)
    .eq("to_stage", toStage)
    .order("changed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return;
  await supabase
    .from("deal_stage_history")
    .update({ note: trimmed })
    .eq("id", data.id);
}

