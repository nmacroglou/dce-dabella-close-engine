/**
 * Commission Sheet — mirrors DaBella Hover Commission Sheet.
 * Inputs persist to deals.commission_sheet (jsonb). Calculations are pure functions.
 */

export interface CommissionSheetInputs {
  date_of_sale: string | null;
  job_number: string | null;
  rep_last_first: string | null;

  // Project-level total (the single big "PROJECT PRICE" in the header)
  project_price: number;

  // Contract & project breakdown by line item
  contract_roof: number;
  contract_siding: number;
  contract_gutters: number;
  project_roof: number;
  project_siding: number;
  project_gutters: number;

  company_paid_finance_fees: number;
  promotion_note: string;
  /** Override commission % (e.g. POI promo bumps tier). 0 = use grid lookup. */
  promotion_pct_override: number;
  bonus_self_gen_fee: number;
  /** Who earned the self-gen bonus: 1 = rep1, 2 = rep2, 0 = split per rep% */
  self_gen_to_rep: 0 | 1 | 2;
  dollar_for_dollar: number;

  // Split between the two reps (must sum to 100)
  rep1_pct: number;
  rep2_pct: number;
}

export interface CommissionGridTier {
  min_pop: number;        // % of Project Price floor (inclusive)
  commission_pct: number; // commission % awarded at that floor
}

export interface MonthlyPromo {
  id: string;
  month: string;          // e.g. "2026-05" or freeform "May"
  product: string;        // Roof, Siding, Baths, Windows, Solar, Financing, Other
  label: string;          // short headline e.g. "Free Gutters @ 100%"
  details: string;        // long form / fine print
  override_pct: number;   // commission % override applied when this promo is active (0 = no math change)
  active: boolean;
}

export interface MonthlyBonusTier {
  min_nis: number;
  pct: number;
}

export interface CommissionGrid {
  id: string;
  rep_id: string;
  tiers: CommissionGridTier[];
  front_end_pct: number; // advance %
  promos: MonthlyPromo[];
  monthly_bonus_tiers: MonthlyBonusTier[];
  follow_up_sla: import("./followUp").FollowUpSLA;
}

export const DEFAULT_MONTHLY_BONUS_TIERS: MonthlyBonusTier[] = [
  { min_nis: 75000, pct: 1.0 },
  { min_nis: 100000, pct: 1.25 },
  { min_nis: 125000, pct: 1.5 },
  { min_nis: 150000, pct: 1.75 },
  { min_nis: 175000, pct: 2.0 },
  { min_nis: 200000, pct: 2.5 },
];

export function lookupMonthlyBonusPct(totalNIS: number, tiers: MonthlyBonusTier[]): number {
  if (totalNIS <= 0 || tiers.length === 0) return 0;
  const sorted = [...tiers].sort((a, b) => a.min_nis - b.min_nis);
  let pct = 0;
  for (const t of sorted) if (totalNIS >= t.min_nis) pct = t.pct;
  return pct;
}

export const DEFAULT_TIERS: CommissionGridTier[] = [
  { min_pop: 75, commission_pct: 5 },
  { min_pop: 80, commission_pct: 7 },
  { min_pop: 85, commission_pct: 9 },
  { min_pop: 90, commission_pct: 10 },
  { min_pop: 95, commission_pct: 11 },
  { min_pop: 100, commission_pct: 12 },
];

export const emptyCommissionSheet = (): CommissionSheetInputs => ({
  date_of_sale: null,
  job_number: null,
  rep_last_first: null,
  project_price: 0,
  contract_roof: 0,
  contract_siding: 0,
  contract_gutters: 0,
  project_roof: 0,
  project_siding: 0,
  project_gutters: 0,
  company_paid_finance_fees: 0,
  promotion_note: "",
  promotion_pct_override: 0,
  bonus_self_gen_fee: 0,
  self_gen_to_rep: 0,
  dollar_for_dollar: 0,
  rep1_pct: 100,
  rep2_pct: 0,
});

/** Lookup commission % from grid based on % of Project Price. */
export function lookupCommissionPct(popPct: number, tiers: CommissionGridTier[]): number {
  if (popPct <= 0 || tiers.length === 0) return 0;
  const sorted = [...tiers].sort((a, b) => a.min_pop - b.min_pop);
  let pct = 0;
  for (const t of sorted) {
    if (popPct >= t.min_pop) pct = t.commission_pct;
  }
  return pct;
}

export interface CommissionSheetComputed {
  contractTotal: number;
  projectTotal: number;
  contractLessFees: number;
  popPct: number;                  // % of Project Price (true POP — fees do NOT lower it)
  commissionPct: number;           // looked up from grid or override
  commissionPctSource: "grid" | "override";
  subtotalCommissionDue: number;   // contractLessFees * commissionPct
  splitable: number;               // subtotal + $-for-$ (split per rep %)
  totalCommissionDue: number;      // splitable + bonuses
  rep1Commission: number;
  rep2Commission: number;
  rep1Advance: number;
  rep1Earned: number;
  rep2Advance: number;
  rep2Earned: number;
}

export function computeCommissionSheet(
  s: CommissionSheetInputs,
  tiers: CommissionGridTier[],
  frontEndPct: number
): CommissionSheetComputed {
  const contractTotal = s.contract_roof + s.contract_siding + s.contract_gutters;
  const projectTotalLines = s.project_roof + s.project_siding + s.project_gutters;
  const projectTotal = projectTotalLines > 0 ? projectTotalLines : s.project_price;

  const contractLessFees = Math.max(0, contractTotal - s.company_paid_finance_fees);
  // True POP: fees DaBella absorbs do NOT punish the rep's tier.
  const popPct = projectTotal > 0 ? (contractTotal / projectTotal) * 100 : 0;
  const gridPct = lookupCommissionPct(popPct, tiers);
  const override = s.promotion_pct_override || 0;
  const commissionPct = override > 0 ? override : gridPct;
  const commissionPctSource: "grid" | "override" = override > 0 ? "override" : "grid";

  const subtotalCommissionDue = contractLessFees * (commissionPct / 100);
  const splitable = subtotalCommissionDue + s.dollar_for_dollar;
  const totalCommissionDue = splitable + s.bonus_self_gen_fee;

  const r1 = s.rep1_pct / 100;
  const r2 = s.rep2_pct / 100;
  const bonus = s.bonus_self_gen_fee;
  const rep1Bonus = s.self_gen_to_rep === 1 ? bonus : s.self_gen_to_rep === 2 ? 0 : bonus * r1;
  const rep2Bonus = s.self_gen_to_rep === 2 ? bonus : s.self_gen_to_rep === 1 ? 0 : bonus * r2;

  const rep1Commission = splitable * r1 + rep1Bonus;
  const rep2Commission = splitable * r2 + rep2Bonus;
  const advance = frontEndPct / 100;

  return {
    contractTotal,
    projectTotal,
    contractLessFees,
    popPct,
    commissionPct,
    commissionPctSource,
    subtotalCommissionDue,
    splitable,
    totalCommissionDue,
    rep1Commission,
    rep2Commission,
    rep1Advance: rep1Commission * advance,
    rep1Earned: rep1Commission * (1 - advance),
    rep2Advance: rep2Commission * advance,
    rep2Earned: rep2Commission * (1 - advance),
  };
}
