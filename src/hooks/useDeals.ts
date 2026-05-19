import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import type { Deal, DealStage } from "@/types/deal";
import type { EngineState } from "@/types/engine";
import { toast } from "sonner";

export function useDeals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["deals", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async (): Promise<Deal[]> => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Deal[];
    },
  });
}

export function useDeal(dealId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["deal", dealId],
    enabled: !!user && !!dealId,
    staleTime: 30_000,
    queryFn: async (): Promise<Deal | null> => {
      if (!dealId) return null;
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("id", dealId)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as Deal) ?? null;
    },
  });
}

export function useCreateDeal() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (initial: Partial<Deal> & { engine_state?: Partial<EngineState> }): Promise<Deal> => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("deals")
        .insert({
          rep_id: user.id,
          homeowner1: initial.homeowner1 ?? "",
          homeowner2: initial.homeowner2 ?? "",
          address: initial.address ?? "",
          notes: initial.notes ?? "",
          stage: initial.stage ?? "inspecting",
          engine_state: (initial.engine_state ?? {}) as unknown as Json,
          products: initial.products ?? [],
          price_a: initial.price_a ?? null,
          price_b: initial.price_b ?? null,
          price_c: initial.price_c ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Deal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create deal");
    },
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Deal> }): Promise<Deal> => {
      const payload = { ...updates } as Record<string, unknown>;
      if (payload.engine_state) {
        payload.engine_state = payload.engine_state as unknown as Json;
      }
      const { data, error } = await supabase
        .from("deals")
        .update(payload as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Deal;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["deal", data.id] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update deal");
    },
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Deal deleted");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete deal");
    },
  });
}

export function useUpdateDealStage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      stage,
      selected_option,
      closed_amount,
      lost_reason,
    }: {
      id: string;
      stage: DealStage;
      selected_option?: "A" | "B" | "C" | null;
      closed_amount?: number | null;
      lost_reason?: string | null;
    }) => {
      const updates: Record<string, unknown> = { stage };
      if (selected_option !== undefined) updates.selected_option = selected_option;
      if (closed_amount !== undefined) updates.closed_amount = closed_amount;
      if (lost_reason !== undefined) updates.lost_reason = lost_reason;

      const { error } = await supabase.from("deals").update(updates as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["deal"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["stage-history"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update stage");
    },
  });
}
