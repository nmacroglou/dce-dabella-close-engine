import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnerScope } from "@/contexts/OwnerScopeContext";
import { errMsg } from "@/lib/errors";
import type { Incident, IncidentNote } from "@/types/incident";

export function useIncidents() {
  const { user } = useAuth();
  const { effectiveRepId, scope } = useOwnerScope();
  return useQuery({
    queryKey: ["incidents", user?.id, scope, effectiveRepId],
    enabled: !!user,
    staleTime: 15_000,
    queryFn: async (): Promise<Incident[]> => {
      let q = supabase
        .from("deal_incidents")
        .select("*")
        .order("created_at", { ascending: false });
      if (effectiveRepId) q = q.eq("rep_id", effectiveRepId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Incident[];
    },
  });
}

export function useIncidentNotes(incidentId: string | null) {
  return useQuery({
    queryKey: ["incident-notes", incidentId],
    enabled: !!incidentId,
    staleTime: 15_000,
    queryFn: async (): Promise<IncidentNote[]> => {
      if (!incidentId) return [];
      const { data, error } = await supabase
        .from("deal_incident_notes")
        .select("*")
        .eq("incident_id", incidentId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as IncidentNote[];
    },
  });
}

export function useUpsertIncident() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Incident> & { title: string }) => {
      if (!user) throw new Error("Not authenticated");
      const payload = { ...input, rep_id: user.id } as never;
      if (input.id) {
        const { data, error } = await supabase
          .from("deal_incidents")
          .update(payload)
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as Incident;
      }
      const { data, error } = await supabase
        .from("deal_incidents")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Incident;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents"] });
      toast.success("Incident saved");
    },
    onError: (e) => toast.error(errMsg(e, "Failed to save incident")),
  });
}

export function useUpdateIncidentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Incident["status"] }) => {
      const { error } = await supabase
        .from("deal_incidents")
        .update({ status } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents"] }),
    onError: (e) => toast.error(errMsg(e, "Failed to update status")),
  });
}

export function useDeleteIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deal_incidents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents"] });
      toast.success("Incident deleted");
    },
    onError: (e) => toast.error(errMsg(e, "Failed to delete")),
  });
}

export function useAddIncidentNote() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ incident_id, body }: { incident_id: string; body: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("deal_incident_notes")
        .insert({ incident_id, body, rep_id: user.id } as never);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["incident-notes", v.incident_id] }),
    onError: (e) => toast.error(errMsg(e, "Failed to add note")),
  });
}
