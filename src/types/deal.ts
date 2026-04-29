import type { EngineState } from "@/types/engine";
import type { CommissionSheetInputs } from "@/types/commission";

export type DealStage = "inspecting" | "presented" | "follow_up" | "won" | "lost";

export const DEAL_STAGES: DealStage[] = ["inspecting", "presented", "follow_up", "won", "lost"];

export const STAGE_LABELS: Record<DealStage, string> = {
  inspecting: "Inspecting",
  presented: "Presented",
  follow_up: "Follow-up",
  won: "Won",
  lost: "Lost",
};

export const STAGE_COLORS: Record<DealStage, string> = {
  inspecting: "bg-muted text-muted-foreground",
  presented: "bg-primary/10 text-primary",
  follow_up: "bg-warning/10 text-warning",
  won: "bg-success/10 text-success",
  lost: "bg-destructive/10 text-destructive",
};

export interface Deal {
  id: string;
  rep_id: string;
  homeowner1: string | null;
  homeowner2: string | null;
  address: string | null;
  notes: string | null;
  stage: DealStage;
  stage_changed_at: string;
  closed_at: string | null;
  lost_reason: string | null;
  selected_option: "A" | "B" | "C" | null;
  closed_amount: number | null;
  engine_state: Partial<EngineState>;
  products: string[];
  price_a: number | null;
  price_b: number | null;
  price_c: number | null;
  commission_sheet: CommissionSheetInputs;
  created_at: string;
  updated_at: string;
}

export interface DealObjection {
  id: string;
  deal_id: string;
  rep_id: string;
  objection_type: string;
  notes: string | null;
  created_at: string;
}
