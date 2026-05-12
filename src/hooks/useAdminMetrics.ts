import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DealStage } from "@/types/deal";

export interface AdminDeal {
  id: string;
  rep_id: string;
  stage: DealStage;
  created_at: string;
  closed_at: string | null;
  closed_amount: number | null;
  stage_changed_at: string;
}
export interface AdminFollowUp {
  id: string; rep_id: string; deal_id: string;
  due_at: string; completed_at: string | null; created_at: string;
}
export interface AdminObjection {
  id: string; rep_id: string; objection_type: string; created_at: string;
}
export interface AdminProfile {
  user_id: string; display_name: string | null; email: string | null; created_at: string;
}
export interface AdminStageEvent {
  id: string; deal_id: string; rep_id: string;
  from_stage: DealStage | null; to_stage: DealStage; changed_at: string;
}

export interface AdminMetrics {
  deals: AdminDeal[];
  followUps: AdminFollowUp[];
  objections: AdminObjection[];
  profiles: AdminProfile[];
  stageHistory: AdminStageEvent[];
}

/** Pull all admin-scoped data in parallel. RLS guarantees only admins get rows. */
export function useAdminMetrics(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-metrics"],
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<AdminMetrics> => {
      const [deals, followUps, objections, profiles, stageHistory] = await Promise.all([
        supabase.from("deals").select("id,rep_id,stage,created_at,closed_at,closed_amount,stage_changed_at").order("created_at", { ascending: false }).limit(5000),
        supabase.from("follow_ups").select("id,rep_id,deal_id,due_at,completed_at,created_at").limit(5000),
        supabase.from("deal_objections").select("id,rep_id,objection_type,created_at").limit(5000),
        supabase.from("profiles").select("user_id,display_name,email,created_at"),
        supabase.from("deal_stage_history").select("id,deal_id,rep_id,from_stage,to_stage,changed_at").order("changed_at", { ascending: false }).limit(5000),
      ]);
      for (const r of [deals, followUps, objections, profiles, stageHistory]) {
        if (r.error) throw r.error;
      }
      return {
        deals: (deals.data ?? []) as AdminDeal[],
        followUps: (followUps.data ?? []) as AdminFollowUp[],
        objections: (objections.data ?? []) as AdminObjection[],
        profiles: (profiles.data ?? []) as AdminProfile[],
        stageHistory: (stageHistory.data ?? []) as AdminStageEvent[],
      };
    },
  });
}
