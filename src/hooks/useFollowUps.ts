import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnerScope } from "@/contexts/OwnerScopeContext";
import type { FollowUp } from "@/types/followUp";
import { toast } from "sonner";
import { errMsg } from "@/lib/errors";

export function useFollowUps(dealId?: string) {
  const { user } = useAuth();
  const { effectiveRepId, scope } = useOwnerScope();
  return useQuery({
    queryKey: ["follow-ups", user?.id, scope, effectiveRepId, dealId ?? "all"],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async (): Promise<FollowUp[]> => {
      let q = supabase.from("follow_ups").select("*").order("due_at", { ascending: true });
      if (dealId) q = q.eq("deal_id", dealId);
      if (effectiveRepId) q = q.eq("rep_id", effectiveRepId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as FollowUp[];
    },
  });
}

export function useCreateFollowUp() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<FollowUp, "id" | "rep_id" | "created_at" | "updated_at" | "completed_at"> & { completed_at?: string | null }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("follow_ups")
        .insert({ ...input, rep_id: user.id } as never)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as FollowUp;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["follow-ups"] }),
    onError: (e) => toast.error(errMsg(e, "Failed")),
  });
}

export function useUpdateFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FollowUp> }) => {
      const { error } = await supabase.from("follow_ups").update(updates as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["follow-ups"] }),
    onError: (e) => toast.error(errMsg(e, "Failed")),
  });
}

export function useDeleteFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("follow_ups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["follow-ups"] }),
    onError: (e) => toast.error(errMsg(e, "Delete failed")),
  });
}
