import type { EngineState } from "@/types/engine";
import type { CommissionSheetInputs } from "@/types/commission";

export type DealStage = "inspecting" | "presented" | "follow_up" | "won" | "lost" | "disqualified";

export const DEAL_STAGES: DealStage[] = ["inspecting", "presented", "follow_up", "won", "lost", "disqualified"];

export const STAGE_LABELS: Record<DealStage, string> = {
  inspecting: "Inspecting",
  presented: "Presented",
  follow_up: "Follow-up",
  won: "Won",
  lost: "Lost",
  disqualified: "Disqualified",
};

export const STAGE_LABELS_ES: Record<DealStage, string> = {
  inspecting: "Inspeccionando",
  presented: "Presentado",
  follow_up: "Seguimiento",
  won: "Ganado",
  lost: "Perdido",
  disqualified: "Descalificado",
};

export const STAGE_COLORS: Record<DealStage, string> = {
  inspecting: "bg-muted text-muted-foreground",
  presented: "bg-primary/10 text-primary",
  follow_up: "bg-warning/10 text-warning",
  won: "bg-success/10 text-success",
  lost: "bg-destructive/10 text-destructive",
  disqualified: "bg-muted-foreground/15 text-muted-foreground",
};

export type DisqualifiedReason =
  | "no_home"
  | "no_money_price"
  | "no_money_dte"
  | "no_money_credit"
  | "no_money_no_funds"
  | "no_money_no_coapp"
  | "no_money_cant_afford"
  | "other";

export const DISQUALIFIED_REASON_LABELS: Record<DisqualifiedReason, string> = {
  no_home: "No Home",
  no_money_price: "No Money — Price too high",
  no_money_dte: "No Money — DTE too high / non-existent",
  no_money_credit: "No Money — Credit in the dirt",
  no_money_no_funds: "No Money — No funds",
  no_money_no_coapp: "No Money — No co-applicant",
  no_money_cant_afford: "No Money — Can't afford",
  other: "Other",
};

export const DISQUALIFIED_REASON_LABELS_ES: Record<DisqualifiedReason, string> = {
  no_home: "Sin casa",
  no_money_price: "Sin dinero — Precio muy alto",
  no_money_dte: "Sin dinero — DTE muy alto / inexistente",
  no_money_credit: "Sin dinero — Crédito por los suelos",
  no_money_no_funds: "Sin dinero — Sin fondos",
  no_money_no_coapp: "Sin dinero — Sin co-solicitante",
  no_money_cant_afford: "Sin dinero — No puede pagar",
  other: "Otro",
};

export type LeadSource = "internet" | "canvass" | "self_gen" | "referral" | "other";

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  internet: "Internet",
  canvass: "Canvass",
  self_gen: "Self-Gen",
  referral: "Referral",
  other: "Other",
};

export const LEAD_SOURCE_LABELS_ES: Record<LeadSource, string> = {
  internet: "Internet",
  canvass: "Puerta a puerta",
  self_gen: "Auto-generado",
  referral: "Referido",
  other: "Otro",
};

export interface Deal {
  id: string;
  rep_id: string;
  homeowner1: string | null;
  homeowner2: string | null;
  homeowner_email: string | null;
  homeowner_phone: string | null;
  address: string | null;
  notes: string | null;
  stage: DealStage;
  stage_changed_at: string;
  closed_at: string | null;
  lost_reason: string | null;
  disqualified_reason: string | null;
  selected_option: "A" | "B" | "C" | null;
  closed_amount: number | null;
  engine_state: Partial<EngineState>;
  products: string[];
  price_a: number | null;
  price_b: number | null;
  price_c: number | null;
  commission_sheet: CommissionSheetInputs;
  lead_source: LeadSource | null;
  was_presented: boolean;
  was_demoed: boolean;
  install_date: string | null;
  install_notes: string | null;
  created_at: string;
  updated_at: string;
  lat: number | null;
  lng: number | null;
  geocoded_at: string | null;
  geocoded_address: string | null;
}

export interface DealObjection {
  id: string;
  deal_id: string;
  rep_id: string;
  objection_type: string;
  notes: string | null;
  created_at: string;
}
