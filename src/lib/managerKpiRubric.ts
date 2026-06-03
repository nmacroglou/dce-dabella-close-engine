/** Workday Monthly Self-Evaluation rubric (Sales).
 *  Each KPI maps a numeric value to a proficiency score 1–10.
 *  Source: DaBella Workday "Complete Self Evaluation" competencies screen. */

export type RubricTier = { points: number; label: string; min: number; max: number };

export interface Rubric {
  id: string;
  name: string;
  unit: "pct" | "usd" | "count";
  /** Lower bound is inclusive; tiers MUST be ordered ascending by points. */
  tiers: RubricTier[];
  description: string;
}

export const CLOSE_RATE_RUBRIC: Rubric = {
  id: "close_rate",
  name: "Sales Rep Close Rate",
  unit: "pct",
  description: "Won ÷ (Won + Lost) for completed deals in the period.",
  tiers: [
    { points: 1,  label: "10% or below", min: 0,    max: 10.0001 },
    { points: 2,  label: "11%–13%",      min: 10.0001, max: 13.0001 },
    { points: 3,  label: "14%–16%",      min: 13.0001, max: 16.0001 },
    { points: 4,  label: "17%–18%",      min: 16.0001, max: 18.0001 },
    { points: 5,  label: "19%–21%",      min: 18.0001, max: 21.0001 },
    { points: 6,  label: "22%–23%",      min: 21.0001, max: 23.0001 },
    { points: 7,  label: "24%–25%",      min: 23.0001, max: 25.0001 },
    { points: 8,  label: "26%–27%",      min: 25.0001, max: 27.0001 },
    { points: 9,  label: "28%–29%",      min: 27.0001, max: 29.0001 },
    { points: 10, label: "30% or better",min: 29.0001, max: Infinity },
  ],
};

export const DPL_RUBRIC: Rubric = {
  id: "dpl",
  name: "Sales Rep DPL",
  unit: "usd",
  description: "Dollars Per Lead = Net Installed Sales ÷ Total Leads Run.",
  tiers: [
    { points: 1,  label: "$1,499 or less",     min: 0,    max: 1500 },
    { points: 2,  label: "$1,500–$1,749",      min: 1500, max: 1750 },
    { points: 3,  label: "$1,750–$1,999",      min: 1750, max: 2000 },
    { points: 4,  label: "$2,000–$2,499",      min: 2000, max: 2500 },
    { points: 5,  label: "$2,500–$2,749",      min: 2500, max: 2750 },
    { points: 6,  label: "$2,750–$2,999",      min: 2750, max: 3000 },
    { points: 7,  label: "$3,000–$3,249",      min: 3000, max: 3250 },
    { points: 8,  label: "$3,250–$3,499",      min: 3250, max: 3500 },
    { points: 9,  label: "$3,500–$3,749",      min: 3500, max: 3750 },
    { points: 10, label: "$3,750 or more",     min: 3750, max: Infinity },
  ],
};

export const NIS_RUBRIC: Rubric = {
  id: "nis",
  name: "Sales Rep NIS",
  unit: "usd",
  description: "Net Installed Sales for the month (won-deal contract value).",
  tiers: [
    { points: 1,  label: "$0–$39,999/mo",       min: 0,      max: 40000 },
    { points: 2,  label: "$40,000–$49,999/mo",  min: 40000,  max: 50000 },
    { points: 3,  label: "$50,000–$54,999/mo",  min: 50000,  max: 55000 },
    { points: 4,  label: "$55,000–$59,999/mo",  min: 55000,  max: 60000 },
    { points: 5,  label: "$60,000–$69,999/mo",  min: 60000,  max: 70000 },
    { points: 6,  label: "$70,000–$79,999/mo",  min: 70000,  max: 80000 },
    { points: 7,  label: "$80,000–$89,999/mo",  min: 80000,  max: 90000 },
    { points: 8,  label: "$90,000–$99,999/mo",  min: 90000,  max: 100000 },
    { points: 9,  label: "$100,000–$119,999/mo",min: 100000, max: 120000 },
    { points: 10, label: "$120,000+/mo",        min: 120000, max: Infinity },
  ],
};

export const PITCH_RATE_RUBRIC: Rubric = {
  id: "pitch_rate",
  name: "Sales Rep Pitch Rate",
  unit: "pct",
  description: "% of leads run that received a full presentation.",
  tiers: [
    { points: 1,  label: "0%–19%",  min: 0,  max: 20 },
    { points: 2,  label: "20%–39%", min: 20, max: 40 },
    { points: 3,  label: "40%–59%", min: 40, max: 60 },
    { points: 4,  label: "60%–69%", min: 60, max: 70 },
    { points: 5,  label: "70%–75%", min: 70, max: 75.0001 },
    { points: 6,  label: "76%–80%", min: 75.0001, max: 80.0001 },
    { points: 7,  label: "81%–85%", min: 80.0001, max: 85.0001 },
    { points: 8,  label: "86%–90%", min: 85.0001, max: 90.0001 },
    { points: 9,  label: "91%–95%", min: 90.0001, max: 95.0001 },
    { points: 10, label: "96%–100%",min: 95.0001, max: Infinity },
  ],
};

export const RETENTION_RUBRIC: Rubric = {
  id: "retention",
  name: "Sales Rep Retention",
  unit: "pct",
  description: "% of signed deals that survive cancellation through install.",
  tiers: PITCH_RATE_RUBRIC.tiers, // identical scale
};

export const ALL_RUBRICS: Rubric[] = [
  CLOSE_RATE_RUBRIC,
  DPL_RUBRIC,
  NIS_RUBRIC,
  PITCH_RATE_RUBRIC,
  RETENTION_RUBRIC,
];

export function scoreValue(rubric: Rubric, value: number): RubricTier {
  if (!Number.isFinite(value) || value <= 0) return rubric.tiers[0];
  for (const t of rubric.tiers) {
    if (value >= t.min && value < t.max) return t;
  }
  return rubric.tiers[rubric.tiers.length - 1];
}
