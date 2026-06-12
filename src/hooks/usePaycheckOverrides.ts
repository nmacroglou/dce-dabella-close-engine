import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { errMsg } from "@/lib/errors";

export interface PaycheckOverride {
  id: string;
  rep_id: string;
  payday_date: string; // YYYY-MM-DD
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Per-rep paycheck overrides, stored in `public.paycheck_overrides`.
 * Replaces the previous localStorage-only flow so amounts follow the rep
 * across devices and survive logout / browser resets.
 */
export function usePaycheckOverrides(repId: string | undefined) {
  const qc = useQueryClient();
  const queryKey = ["paycheck_overrides", repId] as const;

  const query = useQuery({
    queryKey,
    enabled: !!repId,
    staleTime: 30_000,
    queryFn: async (): Promise<Record<string, PaycheckOverride>> => {
      const { data, error } = await (supabase as any)
        .from("paycheck_overrides")
        .select("*")
        .eq("rep_id", repId);
      if (error) throw error;
      const map: Record<string, PaycheckOverride> = {};
      for (const row of (data ?? []) as PaycheckOverride[]) {
        map[row.payday_date] = row;
      }
      return map;
    },
  });

  // Realtime — keep the calendar live across devices for the same rep
  useEffect(() => {
    if (!repId) return;
    const ch = supabase
      .channel(`paycheck_overrides_${repId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "paycheck_overrides",
          filter: `rep_id=eq.${repId}`,
        },
        () => qc.invalidateQueries({ queryKey }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [repId, qc]);

  return query;
}

export function useUpsertPaycheckOverride() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { payday_date: string; amount: number; notes?: string | null }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await (supabase as any)
        .from("paycheck_overrides")
        .upsert(
          {
            rep_id: user.id,
            payday_date: input.payday_date,
            amount: input.amount,
            notes: input.notes ?? null,
          },
          { onConflict: "rep_id,payday_date" },
        )
        .select()
        .single();
      if (error) throw error;
      return data as PaycheckOverride;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paycheck_overrides", user?.id] });
    },
    onError: (e) => toast.error(errMsg(e, "Save failed")),
  });
}

export function useDeletePaycheckOverride() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payday_date: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await (supabase as any)
        .from("paycheck_overrides")
        .delete()
        .eq("rep_id", user.id)
        .eq("payday_date", payday_date);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paycheck_overrides", user?.id] });
    },
    onError: (e) => toast.error(errMsg(e, "Delete failed")),
  });
}
