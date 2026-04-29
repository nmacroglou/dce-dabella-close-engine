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
  bonus_self_gen_fee: number;
  dollar_for_dollar: number;

  // Split between the two reps (must sum to 100)
  rep1_pct: number;
  rep2_pct: number;
}

export interface CommissionGridTier {
  min_pop: number;        // % of Project Price floor (inclusive)
  commission_pct: number; // commission % awarded at that floor
}

export interface CommissionGrid {
  id: string;
  rep_id: string;
  tiers: CommissionGridTier[];
  front_end_pct: number; // advance %
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
  bonus_self_gen_fee: 0,
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
  popPct: number;                  // % of Project Price after finance fees
  commissionPct: number;           // looked up from grid
  subtotalCommissionDue: number;   // contractLessFees * commissionPct
  totalCommissionDue: number;      // subtotal + bonus + $-for-$
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
  // Prefer the line-item project total; fall back to header project_price if blank
  const projectTotal = projectTotalLines > 0 ? projectTotalLines : s.project_price;

  const contractLessFees = contractTotal - s.company_paid_finance_fees;
  const popPct = projectTotal > 0 ? (contractLessFees / projectTotal) * 100 : 0;
  const commissionPct = lookupCommissionPct(popPct, tiers);
  const subtotalCommissionDue = contractLessFees * (commissionPct / 100);
  const totalCommissionDue = subtotalCommissionDue + s.bonus_self_gen_fee + s.dollar_for_dollar;

  const rep1Commission = totalCommissionDue * (s.rep1_pct / 100);
  const rep2Commission = totalCommissionDue * (s.rep2_pct / 100);
  const advance = frontEndPct / 100;

  return {
    contractTotal,
    projectTotal,
    contractLessFees,
    popPct,
    commissionPct,
    subtotalCommissionDue,
    totalCommissionDue,
    rep1Commission,
    rep2Commission,
    rep1Advance: rep1Commission * advance,
    rep1Earned: rep1Commission * (1 - advance),
    rep2Advance: rep2Commission * advance,
    rep2Earned: rep2Commission * (1 - advance),
  };
}
