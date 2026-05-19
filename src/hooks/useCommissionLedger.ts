import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
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
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["commission_payments", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<CommissionPayment[]> => {
      const { data, error } = await supabase
        .from("commission_payments")
        .select("*")
        .order("sale_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CommissionPayment[];
    },
  });

  // realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("commission_payments_rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "commission_payments", filter: `rep_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["commission_payments", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

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
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
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
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });
}
