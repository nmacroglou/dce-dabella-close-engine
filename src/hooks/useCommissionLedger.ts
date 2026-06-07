import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnerScope } from "@/contexts/OwnerScopeContext";
import { toast } from "sonner";
import { errMsg } from "@/lib/errors";
import { useEffect } from "react";

export interface CommissionPayment {
  id: string;
  rep_id: string;
  deal_id: string | null;
  customer_name: string | null;
  job_number: string | null;
  sale_date: string | null;
  expected_total: number;
  expected_front: number;
  expected_back: number;
  front_paid_amount: number;
  front_paid_at: string | null;
  back_paid_amount: number;
  back_paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useCommissionLedger() {
  const { user } = useAuth();
  const { effectiveRepId, scope } = useOwnerScope();
  const qc = useQueryClient();

  // Read follows owner scope: non-admins are pinned to themselves by the
  // scope context; admins see whichever rep they've selected ("me", a specific
  // rep, or all reps when effectiveRepId is null). Writes/auto-sync remain
  // pinned to the logged-in user elsewhere.
  const query = useQuery({
    queryKey: ["commission_payments", user?.id, scope, effectiveRepId],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async (): Promise<CommissionPayment[]> => {
      let q = supabase
        .from("commission_payments")
        .select("*")
        .order("sale_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (effectiveRepId) q = q.eq("rep_id", effectiveRepId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CommissionPayment[];
    },
  });

  // realtime — scoped to the rep being viewed, or all rows when admin views all
  useEffect(() => {
    if (!user) return;
    const filter = effectiveRepId ? `rep_id=eq.${effectiveRepId}` : undefined;
    const ch = supabase
      .channel("commission_payments_rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "commission_payments", ...(filter ? { filter } : {}) },
        () => qc.invalidateQueries({ queryKey: ["commission_payments"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc, effectiveRepId]);

  return query;
}

export function useUpsertPayment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CommissionPayment> & { id?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const payload = { ...input, rep_id: user.id };
      if (input.id) {
        const { data, error } = await supabase
          .from("commission_payments")
          .update(payload)
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("commission_payments")
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commission_payments", user?.id] });
      toast.success("Saved");
    },
    onError: (e) => toast.error(errMsg(e, "Save failed")),
  });
}

export function useDeletePayment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("commission_payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commission_payments", user?.id] });
      toast.success("Deleted");
    },
    onError: (e) => toast.error(errMsg(e, "Delete failed")),
  });
}
