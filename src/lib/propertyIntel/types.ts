export type ConfidenceLabel = "Very High" | "High" | "Moderate" | "Low" | "Very Low";

export interface Confidence {
  score: number; // 0-100
  label: ConfidenceLabel;
  reasons: string[];
  conflicts: string[];
}

export interface PropertyMatch {
  standardized_address: string;
  parcel_number: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  property_type: string | null;
  data_sources: string[];
  last_updated: string;
  confidence: Confidence;
}

export interface OwnershipRecord {
  owner_name: string | null;
  owner_type: "individual" | "joint" | "trust" | "llc" | "corporation" | "unknown";
  tax_mailing_name: string | null;
  tax_mailing_address: string | null;
  tax_mailing_matches_property: boolean;
  ownership_start_date: string | null;
  document_type: string | null;
  recording_number: string | null;
  source: string;
  source_record_date: string | null;
  confidence: Confidence;
}

export interface SaleRecord {
  sale_date: string | null;
  buyer_name: string | null;
  seller_name: string | null;
  sale_price: number | null;
  document_type: string | null;
  recording_number: string | null;
  source: string;
  confidence: Confidence;
}

export interface IdentityAssessment {
  likely_owner_name: string | null;
  likely_occupant_name: string | null;
  owner_occupancy_status: "likely_owner_occupied" | "likely_non_owner_occupied" | "unknown";
  confidence: Confidence;
}

export interface PropertyInfo {
  year_built: number | null;
  square_feet: number | null;
  lot_size: number | null;
  stories: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  assessed_value: number | null;
  estimated_market_value: number | null;
  roof_material: string | null;
  estimated_roof_age: number | null;
  is_roof_age_estimated: boolean;
  exterior_material: string | null;
  solar_present: boolean | null;
  permits: { type: string; date: string; description: string }[];
  storm_exposure: "low" | "moderate" | "high" | null;
  heat_exposure: "low" | "moderate" | "high" | null;
  visible_condition_notes: string | null;
  previous_dabella_interaction: boolean;
  existing_customer: boolean;
  do_not_knock: boolean;
}

export type ProductKey =
  | "roofing" | "windows" | "bath" | "siding"
  | "paint" | "gutters" | "ventilation" | "insulation";

export interface Opportunity {
  primary_product: ProductKey;
  secondary_product: ProductKey | null;
  opportunity_score: number; // 0-100
  recommendation_confidence: Confidence;
  reasons: string[];
  missing_info: string[];
  suggested_inspection_focus: string[];
}

export interface PreDoorBrief {
  headline_name: string | null;
  use_name_at_door: boolean;
  suggested_opener: string;
  reasons: string[];
}

export interface PropertyIntelReport {
  property_match: PropertyMatch;
  ownership: OwnershipRecord;
  most_recent_sale: SaleRecord;
  identity: IdentityAssessment;
  info: PropertyInfo;
  opportunity: Opportunity;
  brief: PreDoorBrief;
  overall_confidence: Confidence;
  is_demo: boolean;
  generated_at: string;
}
