/** Commission rates by product (editable placeholders — actual rates TBD) */
export const COMMISSION_RATES: Record<string, { base: number; label: string }> = {
  "Roofing System": { base: 10, label: "Roofing" },
  Windows: { base: 10, label: "Windows" },
  Siding: { base: 10, label: "Siding" },
  Solar: { base: 10, label: "Solar" },
  Gutters: { base: 10, label: "Gutters" },
  Bath: { base: 10, label: "Bath" },
};

/** Golden Pledge adder */
export const GOLDEN_PLEDGE_ADDER = 1; // +1%

/** Self-generated lead bonus rate (only if sold at ≥75% of project price) */
export const SELF_GEN_RATE = 8; // 8%
export const SELF_GEN_MIN_PRICE_PCT = 75;

/** Mini Job flat commission tiers */
export const MINI_JOB_TIERS = [
  { min: 15000, max: 19999.99, commission: 500 },
  { min: 20000, max: 24999.99, commission: 750 },
  { min: 25000, max: 29999.99, commission: 1000 },
  { min: 30000, max: 34999.99, commission: 1250 },
  { min: 35000, max: 39999.99, commission: 1500 },
  { min: 40000, max: 44999.99, commission: 1750 },
  { min: 45000, max: 49999.99, commission: 2000 },
  { min: 50000, max: 54999.99, commission: 2250 },
] as const;

/** Under-threshold mini job floor */
export const MINI_JOB_FLOOR = 300;

/** Per $5k NIS increment above $55k */
export const MINI_JOB_INCREMENT = 250;
export const MINI_JOB_INCREMENT_STEP = 5000;

/** Monthly NIS bonus tiers */
export const MONTHLY_BONUS_TIERS = [
  { min: 75000, max: 99999.99, pct: 1.0 },
  { min: 100000, max: 124999.99, pct: 1.25 },
  { min: 125000, max: 149999.99, pct: 1.5 },
  { min: 150000, max: 174999.99, pct: 1.75 },
  { min: 175000, max: 199999.99, pct: 2.0 },
  { min: 200000, max: Infinity, pct: 2.5 },
] as const;

/** Quarterly production minimum */
export const QUARTERLY_MIN_NIS = 180000;
export const MONTHLY_MIN_NIS = 60000;
export const MIN_DPL = 2300;

/** Front-end / back-end split */
export const FRONT_END_PCT = 80;
export const BACK_END_PCT = 20;

/** Compute mini job commission from contract price */
export function getMiniJobCommission(contractPrice: number): number {
  if (contractPrice < 15000) return MINI_JOB_FLOOR;
  const tier = MINI_JOB_TIERS.find(
    (t) => contractPrice >= t.min && contractPrice <= t.max
  );
  if (tier) return tier.commission;
  // Above max tier: $2,250 + $250 per $5k above $55k
  if (contractPrice >= 55000) {
    const extra = Math.floor((contractPrice - 55000) / MINI_JOB_INCREMENT_STEP);
    return 2250 + (extra + 1) * MINI_JOB_INCREMENT;
  }
  return MINI_JOB_FLOOR;
}

/** Compute standard commission */
export function getStandardCommission(
  contractPrice: number,
  baseRatePct: number,
  goldenPledge: boolean
): number {
  const rate = baseRatePct + (goldenPledge ? GOLDEN_PLEDGE_ADDER : 0);
  return Math.round(contractPrice * (rate / 100));
}

/** Compute self-gen bonus */
export function getSelfGenBonus(
  contractPrice: number,
  projectPrice: number
): number {
  if (projectPrice <= 0) return 0;
  const pctOfProject = (contractPrice / projectPrice) * 100;
  if (pctOfProject < SELF_GEN_MIN_PRICE_PCT) return 0;
  return Math.round(contractPrice * (SELF_GEN_RATE / 100));
}

/** Get monthly bonus tier info */
export function getMonthlyBonus(totalNIS: number): { pct: number; bonus: number } | null {
  const tier = MONTHLY_BONUS_TIERS.find(
    (t) => totalNIS >= t.min && totalNIS <= t.max
  );
  if (!tier) return null;
  return { pct: tier.pct, bonus: Math.round(totalNIS * (tier.pct / 100)) };
}
