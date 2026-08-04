import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { DealObjection } from "@/types/deal";
import { toast } from "sonner";
import { errMsg } from "@/lib/errors";

export function useDealObjections(dealId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["deal-objections", dealId],
    enabled: !!user && !!dealId,
    queryFn: async (): Promise<DealObjection[]> => {
      if (!dealId) return [];
      const { data, error } = await supabase
        .from("deal_objections")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DealObjection[];
    },
  });
}

export function useAllObjections() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-objections", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async (): Promise<DealObjection[]> => {
      const { data, error } = await supabase
        .from("deal_objections")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DealObjection[];
    },
  });
}

export function useLogObjection() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dealId,
      objectionType,
      notes,
    }: {
      dealId: string;
      objectionType: string;
      notes?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("deal_objections").insert({
        deal_id: dealId,
        rep_id: user.id,
        objection_type: objectionType,
        notes: notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["deal-objections", vars.dealId] });
      qc.invalidateQueries({ queryKey: ["all-objections"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Objection logged");
    },
    onError: (err) => {
      toast.error(errMsg(err, "Failed to log objection"));
    },
  });
}

export function useDeleteDealObjection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; dealId: string }) => {
      const { error } = await supabase.from("deal_objections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["deal-objections", vars.dealId] });
      qc.invalidateQueries({ queryKey: ["all-objections"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err) => toast.error(errMsg(err, "Failed to remove objection")),
  });
}
