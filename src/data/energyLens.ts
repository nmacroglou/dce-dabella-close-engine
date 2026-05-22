/**
 * Data model for the Energy Roof Inflation Lens module.
 * Stubbed for now — structured so real utility / regulatory feeds can plug in later.
 */

export interface Utility {
  id: string;
  name: string;
  region: string;
  productionFactor: number; // kWh per kW per year
  defaultRateLow: number; // $/kWh conservative
  defaultRateHigh: number; // $/kWh high-impact
  exportCredit: number; // $/kWh exported (no battery / excess)
  notes: string;
}

export const UTILITIES: Utility[] = [
  {
    id: "srp",
    name: "SRP",
    region: "Arizona — Phoenix Metro",
    productionFactor: 1650,
    defaultRateLow: 0.15,
    defaultRateHigh: 0.25,
    exportCredit: 0.05,
    notes: "Demand charges on most residential plans; export compensation limited.",
  },
  {
    id: "aps",
    name: "APS",
    region: "Arizona — Statewide",
    productionFactor: 1700,
    defaultRateLow: 0.14,
    defaultRateHigh: 0.24,
    exportCredit: 0.07,
    notes: "Time-of-use default; export rates step down annually.",
  },
  {
    id: "tep",
    name: "TEP",
    region: "Arizona — Tucson",
    productionFactor: 1700,
    defaultRateLow: 0.13,
    defaultRateHigh: 0.22,
    exportCredit: 0.06,
    notes: "Residential demand pilot; export credit reviewed yearly.",
  },
];

export interface RatePlan {
  id: string;
  utilityId: string;
  name: string;
  type: "Flat" | "TOU" | "Demand";
  summary: string;
}

export const RATE_PLANS: RatePlan[] = [
  { id: "srp-eztou", utilityId: "srp", name: "EZ-3 TOU", type: "TOU", summary: "On-peak weekday afternoons; high summer rates." },
  { id: "srp-demand", utilityId: "srp", name: "Customer Generation (E-27)", type: "Demand", summary: "Required for most solar customers; demand charge applies." },
  { id: "aps-tou", utilityId: "aps", name: "Saver Choice", type: "TOU", summary: "On-peak 4–7pm weekdays." },
];

export interface ExportRule {
  id: string;
  utilityId: string;
  rule: string;
  hasBattery: boolean;
}

export const EXPORT_RULES: ExportRule[] = [
  { id: "srp-nobat", utilityId: "srp", hasBattery: false, rule: "Export credit ~$0.05/kWh; on-peak production not fully captured." },
  { id: "srp-bat", utilityId: "srp", hasBattery: true, rule: "Battery shifts production into on-peak self-use — much higher effective value." },
];

export interface InflationScenario {
  id: string;
  label: string;
  rate: number;
  description: string;
}

export const INFLATION_SCENARIOS: InflationScenario[] = [
  { id: "low", label: "Conservative", rate: 0.04, description: "Long-run historical electricity inflation." },
  { id: "mid", label: "Recent Trend", rate: 0.07, description: "Post-2020 utility rate increases nationally." },
  { id: "high", label: "AZ Hotspot", rate: 0.10, description: "Heavy demand growth + data centers in AZ." },
  { id: "shock", label: "Demand Shock", rate: 0.15, description: "AI / data-center buildout outpaces generation." },
];

export interface RegulatoryEvent {
  date: string;
  utilityId: string;
  title: string;
  impact: "up" | "down" | "neutral";
}

export const REGULATORY_LOG: RegulatoryEvent[] = [
  { date: "2023-11", utilityId: "srp", title: "SRP base rate increase approved", impact: "up" },
  { date: "2024-09", utilityId: "aps", title: "APS export credit reduced", impact: "up" },
  { date: "2025-04", utilityId: "srp", title: "New demand-charge pilot expanded", impact: "up" },
];

export const SYSTEM_SIZES = [2, 3, 4] as const;
export type SystemSize = number; // allow variable via slider

export interface SelfConsumptionPreset {
  id: "low" | "med" | "high";
  label: string;
  pct: number;
}

export const SELF_CONSUMPTION_PRESETS: SelfConsumptionPreset[] = [
  { id: "low", label: "No battery", pct: 0.35 },
  { id: "med", label: "Small battery", pct: 0.65 },
  { id: "high", label: "Full battery", pct: 0.85 },
];

export const TIME_HORIZONS = [5, 10, 15, 20, 25, 30, 35, 40, 50] as const;
