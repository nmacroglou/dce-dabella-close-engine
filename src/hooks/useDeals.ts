import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnerScope } from "@/contexts/OwnerScopeContext";
import type { Deal, DealStage } from "@/types/deal";
import type { EngineState } from "@/types/engine";
import { toast } from "sonner";
import { errMsg } from "@/lib/errors";

export function useDeals() {
  const { user } = useAuth();
  const { effectiveRepId, scope } = useOwnerScope();

  return useQuery({
    queryKey: ["deals", user?.id, scope, effectiveRepId],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async (): Promise<Deal[]> => {
      let q = supabase.from("deals").select("*").order("updated_at", { ascending: false });
      if (effectiveRepId) q = q.eq("rep_id", effectiveRepId);
      const { data, error } = await q;
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
          homeowner_email: initial.homeowner_email ?? null,
          homeowner_phone: initial.homeowner_phone ?? null,
          address: initial.address ?? "",
          notes: initial.notes ?? "",
          stage: initial.stage ?? "inspecting",
          engine_state: (initial.engine_state ?? {}) as unknown as Json,
          products: initial.products ?? [],
          price_a: initial.price_a ?? null,
          price_b: initial.price_b ?? null,
          price_c: initial.price_c ?? null,
          lead_source: initial.lead_source ?? null,
          was_presented: initial.was_presented ?? false,
          was_demoed: initial.was_demoed ?? false,
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
      toast.error(errMsg(err, "Failed to create deal"));
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
    // Optimistic update: patch caches immediately so toggles (lead source,
    // presented/demoed tags, inline edits) feel instant on iPad.
    onMutate: async ({ id, updates }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["deal", id] }),
        qc.cancelQueries({ queryKey: ["deals"] }),
      ]);
      const prevDeal = qc.getQueryData<Deal>(["deal", id]);
      const prevLists = qc.getQueriesData<Deal[]>({ queryKey: ["deals"] });

      if (prevDeal) {
        qc.setQueryData<Deal>(["deal", id], { ...prevDeal, ...updates } as Deal);
      }
      prevLists.forEach(([key, list]) => {
        if (!list) return;
        qc.setQueryData<Deal[]>(key, list.map((d) => (d.id === id ? { ...d, ...updates } as Deal : d)));
      });

      return { prevDeal, prevLists };
    },
    onError: (err, _vars, ctx) => {
      // Roll back optimistic patches on failure.
      if (ctx?.prevDeal) qc.setQueryData(["deal", ctx.prevDeal.id], ctx.prevDeal);
      ctx?.prevLists?.forEach(([key, list]) => qc.setQueryData(key, list));
      toast.error(errMsg(err, "Failed to update deal"));
    },
    onSettled: (data) => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      if (data) qc.invalidateQueries({ queryKey: ["deal", data.id] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
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
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["deals"] });
      const prevLists = qc.getQueriesData<Deal[]>({ queryKey: ["deals"] });
      prevLists.forEach(([key, list]) => {
        if (!list) return;
        qc.setQueryData<Deal[]>(key, list.filter((d) => d.id !== id));
      });
      return { prevLists };
    },
    onError: (err, _id, ctx) => {
      ctx?.prevLists?.forEach(([key, list]) => qc.setQueryData(key, list));
      toast.error(errMsg(err, "Failed to delete deal"));
    },
    onSuccess: () => {
      toast.success("Deal deleted");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
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
    onMutate: async (vars) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["deal", vars.id] }),
        qc.cancelQueries({ queryKey: ["deals"] }),
      ]);
      const patch: Partial<Deal> = {
        stage: vars.stage,
        stage_changed_at: new Date().toISOString(),
      };
      if (vars.selected_option !== undefined) patch.selected_option = vars.selected_option;
      if (vars.closed_amount !== undefined) patch.closed_amount = vars.closed_amount;
      if (vars.lost_reason !== undefined) patch.lost_reason = vars.lost_reason;
      if (vars.stage === "won" || vars.stage === "lost") patch.closed_at = new Date().toISOString();

      const prevDeal = qc.getQueryData<Deal>(["deal", vars.id]);
      const prevLists = qc.getQueriesData<Deal[]>({ queryKey: ["deals"] });

      if (prevDeal) qc.setQueryData<Deal>(["deal", vars.id], { ...prevDeal, ...patch } as Deal);
      prevLists.forEach(([key, list]) => {
        if (!list) return;
        qc.setQueryData<Deal[]>(key, list.map((d) => (d.id === vars.id ? { ...d, ...patch } as Deal : d)));
      });
      return { prevDeal, prevLists };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prevDeal) qc.setQueryData(["deal", ctx.prevDeal.id], ctx.prevDeal);
      ctx?.prevLists?.forEach(([key, list]) => qc.setQueryData(key, list));
      toast.error(errMsg(err, "Failed to update stage"));
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["deal", vars.id] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["stage-history"] });
    },
  });
}

