import type { PropertyIntelReport } from "./types";
import { buildQualification, type QualificationDeck } from "./qualification";

/**
 * Derived intelligence layer — everything here is TRIANGULATED from the raw
 * property record: multiple independent estimates of the same quantity are
 * reconciled, disagreements are surfaced, and rep-facing KPIs are computed.
 *
 * All outputs are ESTIMATES from public-record data. Nothing here is an
 * appraisal, a credit decision, or proof of purchasing ability.
 */

/* ────────────────────────────────────────────────────────────── valuation */

export interface ValueEstimate {
  label: string;
  value: number;
  weight: number;
  note: string;
}

export interface ValuationTriangulation {
  estimates: ValueEstimate[];
  consensus: number | null;
  low: number | null;
  high: number | null;
  spread_pct: number | null;
  agreement: "tight" | "moderate" | "wide" | "single" | "none";
  agreement_note: string;
  price_per_sqft: number | null;
  assessment_ratio: number | null; // assessed / consensus
  tax_burden_pct: number | null; // annual tax / consensus
  implied_tax_value: number | null;
  cagr_pct: number | null; // annualized appreciation since purchase
}

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;

const median = (xs: number[]): number =>
  xs.length === 0
    ? 0
    : xs.length % 2
      ? [...xs].sort((a, b) => a - b)[(xs.length - 1) / 2]
      : ([...xs].sort((a, b) => a - b)[xs.length / 2 - 1] +
          [...xs].sort((a, b) => a - b)[xs.length / 2]) / 2;

/** Typical effective property tax rate used to back out a value from the tax bill. */
const EFFECTIVE_TAX_RATE = 0.0072;

export function buildValuation(r: PropertyIntelReport, q: QualificationDeck): ValuationTriangulation {
  const est: ValueEstimate[] = [];

  const market = num(r.info.estimated_market_value);
  if (market) est.push({ label: "Provider market value", value: market, weight: 0.4, note: "Assessor market estimate" });

  const assessed = num(r.info.assessed_value);
  if (assessed) {
    est.push({
      label: "Assessed × 1.15",
      value: Math.round(assessed * 1.15),
      weight: 0.2,
      note: "Assessment grossed to market",
    });
  }

  const purchase = num(r.most_recent_sale.sale_price);
  const tenure = q.equity.tenure_years;
  if (purchase && tenure !== null) {
    est.push({
      label: "Purchase appreciated",
      value: Math.round(purchase * Math.pow(1.045, tenure)),
      weight: 0.25,
      note: `${purchase.toLocaleString()} in ${q.equity.purchase_year ?? "?"} at ~4.5%/yr`,
    });
  }

  const annualTax = num((r.info as unknown as { annual_tax?: number }).annual_tax);
  const impliedTaxValue = annualTax ? Math.round(annualTax / EFFECTIVE_TAX_RATE) : null;
  if (impliedTaxValue) {
    est.push({
      label: "Tax-implied value",
      value: impliedTaxValue,
      weight: 0.15,
      note: `Tax bill ÷ ${(EFFECTIVE_TAX_RATE * 100).toFixed(2)}% effective rate`,
    });
  }

  const values = est.map((e) => e.value);
  const consensus = values.length
    ? Math.round(
        est.reduce((s, e) => s + e.value * e.weight, 0) / est.reduce((s, e) => s + e.weight, 0),
      )
    : null;
  const low = values.length ? Math.min(...values) : null;
  const high = values.length ? Math.max(...values) : null;
  const mid = values.length ? median(values) : null;
  const spread = low !== null && high !== null && mid ? Math.round(((high - low) / mid) * 100) : null;

  const agreement: ValuationTriangulation["agreement"] =
    values.length === 0 ? "none"
      : values.length === 1 ? "single"
        : spread !== null && spread <= 12 ? "tight"
          : spread !== null && spread <= 28 ? "moderate" : "wide";

  const agreement_note = {
    tight: "Independent sources agree closely — treat the consensus value as reliable.",
    moderate: "Sources disagree moderately — confirm recent improvements or condition at the door.",
    wide: "Sources disagree widely — do not quote a value; ask what they think the home is worth.",
    single: "Only one valuation source available — low corroboration.",
    none: "No valuation data on record — value questions must be asked at the door.",
  }[agreement];

  const sqft = num(r.info.square_feet);
  const cagr =
    purchase && consensus && tenure && tenure >= 1
      ? Math.round((Math.pow(consensus / purchase, 1 / tenure) - 1) * 1000) / 10
      : null;

  return {
    estimates: est,
    consensus,
    low,
    high,
    spread_pct: spread,
    agreement,
    agreement_note,
    price_per_sqft: consensus && sqft ? Math.round(consensus / sqft) : null,
    assessment_ratio: assessed && consensus ? Math.round((assessed / consensus) * 100) : null,
    tax_burden_pct: annualTax && consensus ? Math.round((annualTax / consensus) * 1000) / 10 : null,
    implied_tax_value: impliedTaxValue,
    cagr_pct: cagr,
  };
}

/* ───────────────────────────────────────────────────────── affordability */

export interface Affordability {
  implied_household_income: number | null;
  implied_monthly_housing: number | null;
  project_payment_mid: number;
  payment_to_income_pct: number | null;
  payment_to_value_pct: number | null;
  index: number; // 0-100
  band: "comfortable" | "workable" | "stretch" | "unknown";
  headline: string;
  notes: string[];
}

export function buildAffordability(
  r: PropertyIntelReport,
  q: QualificationDeck,
  v: ValuationTriangulation,
): Affordability {
  const notes: string[] = [];
  // Homes are typically bought at ~3.5x gross household income.
  const income = v.consensus ? Math.round(v.consensus / 3.5) : null;
  const monthlyIncome = income ? income / 12 : null;
  // Housing outlay proxy: mortgage on 80% LTV at purchase + taxes/insurance.
  const bal = q.equity.estimated_balance;
  const housing = bal ? Math.round((bal * 0.0058) + (v.consensus ? (v.consensus * 0.011) / 12 : 0)) : null;

  const ladder = q.investment.rows.find((x) => x.term_months === 120) ?? q.investment.rows[0];
  const paymentMid = ladder ? Math.round((ladder.low + ladder.high) / 2) : 0;

  const ptiPct = monthlyIncome ? Math.round((paymentMid / monthlyIncome) * 1000) / 10 : null;
  const ptvPct = v.consensus
    ? Math.round(((q.investment.low + q.investment.high) / 2 / v.consensus) * 1000) / 10
    : null;

  let index = 50;
  if (ptiPct !== null) index = Math.max(0, Math.min(100, Math.round(100 - (ptiPct - 2) * 9)));
  if (q.equity.equity_pct !== null) index = Math.round(index * 0.75 + q.equity.equity_pct * 0.25);

  const band: Affordability["band"] =
    ptiPct === null ? "unknown" : ptiPct <= 4 ? "comfortable" : ptiPct <= 7 ? "workable" : "stretch";

  if (ptvPct !== null && ptvPct > 12) {
    notes.push("Project is a large share of home value — lead with lifetime cost, not sticker price.");
  }
  if (band === "stretch") notes.push("Longer term or phased scope is the likely path — open the 240-month option.");
  if (band === "comfortable") notes.push("Payment is small relative to implied income — cash or short term is realistic.");
  notes.push("Income is inferred from home value, not verified. Never state it to the homeowner.");

  const headline = {
    comfortable: "Payment reads comfortable against implied income",
    workable: "Payment is workable — expect term shopping",
    stretch: "Payment reads as a stretch — sell the monthly, not the total",
    unknown: "Not enough data to gauge payment comfort",
  }[band];

  return {
    implied_household_income: income,
    implied_monthly_housing: housing,
    project_payment_mid: paymentMid,
    payment_to_income_pct: ptiPct,
    payment_to_value_pct: ptvPct,
    index,
    band,
    headline,
    notes,
  };
}

/* ─────────────────────────────────────────────────────── deal economics */

export interface FunnelStage {
  key: string;
  label: string;
  pct: number; // cumulative probability from one knock, 0-1
  step_pct: number; // conversion from the previous stage, 0-1
  note: string;
}

export interface EvLever {
  label: string;
  detail: string;
  delta: number; // additional expected dollars per knock
}

export interface DealEconomics {
  contract_low: number;
  contract_mid: number;
  contract_high: number;
  answer_probability: number;
  pitch_probability: number;
  close_probability: number; // 0-1 (close given sit)
  sit_probability: number; // 0-1 (sit given contact)
  joint_probability: number; // knock → signed
  commission_low: number;
  commission_high: number;
  expected_commission: number;
  expected_value_per_knock: number;
  ev_low: number;
  ev_high: number;
  knocks_to_one_deal: number | null;
  minutes_invested: number;
  value_per_hour: number | null;
  per_ten_doors: number;
  block_of_25: number;
  funnel: FunnelStage[];
  levers: EvLever[];
  verdict: string;
}

/** Historical funnel by tier — answer → pitch → sit → close. */
const TIER_FUNNEL: Record<QualificationDeck["tier"], { answer: number; pitch: number; sit: number; close: number }> = {
  A: { answer: 0.38, pitch: 0.62, sit: 0.34, close: 0.32 },
  B: { answer: 0.35, pitch: 0.55, sit: 0.26, close: 0.24 },
  C: { answer: 0.32, pitch: 0.46, sit: 0.18, close: 0.16 },
  D: { answer: 0.3, pitch: 0.38, sit: 0.11, close: 0.09 },
};

const FRONT_END_LOW = 0.08;
const FRONT_END_HIGH = 0.14;

export function buildDealEconomics(q: QualificationDeck): DealEconomics {
  const contractLow = Math.round(q.investment.low);
  const contractHigh = Math.round(q.investment.high);
  const contractMid = Math.round((contractLow + contractHigh) / 2);
  const f = TIER_FUNNEL[q.tier];
  const joint = f.answer * f.pitch * f.sit * f.close;

  const commissionLow = Math.round(contractLow * FRONT_END_LOW);
  const commissionHigh = Math.round(contractHigh * FRONT_END_HIGH);
  const commissionMid = Math.round((commissionLow + commissionHigh) / 2);
  const expected = Math.round(commissionMid * joint);

  // A knock plus a short conversation; sits add real time downstream.
  const minutes = Math.round(4 + f.answer * f.pitch * 10 + f.answer * f.pitch * f.sit * 90);
  const valuePerHour = minutes > 0 ? Math.round((expected / minutes) * 60) : null;

  const funnel: FunnelStage[] = [
    { key: "knock", label: "Knock", pct: 1, step_pct: 1, note: "One door, one attempt" },
    { key: "answer", label: "Answer", pct: f.answer, step_pct: f.answer, note: "Someone comes to the door" },
    { key: "pitch", label: "Real conversation", pct: f.answer * f.pitch, step_pct: f.pitch, note: "You get past the opener" },
    { key: "sit", label: "Sit / appointment", pct: f.answer * f.pitch * f.sit, step_pct: f.sit, note: "Both decision-makers at the table" },
    { key: "close", label: "Signed", pct: joint, step_pct: f.close, note: "Contract signed at or after the sit" },
  ];

  const levers: EvLever[] = [
    {
      label: "Both decision-makers present",
      detail: "Confirm the second owner before you sit — one-legger sits close roughly a third less.",
      delta: Math.round(commissionMid * f.answer * f.pitch * f.sit * f.close * 0.45),
    },
    {
      label: "Knock in the best window",
      detail: q.best_knock_window,
      delta: Math.round(expected * 0.3),
    },
    {
      label: "Two callback attempts",
      detail: "Text plus voicemail recovers a chunk of no-answers at the same contract value.",
      delta: Math.round(commissionMid * (1 - f.answer) * 0.35 * f.pitch * f.sit * f.close),
    },
  ].filter((l) => l.delta > 0);

  const verdict =
    expected >= 900 ? "High-value door — protect this one on the route."
      : expected >= 450 ? "Solid expected value — worth a callback if nobody answers."
        : expected >= 200 ? "Average door — knock it in sequence, don't chase it."
          : "Low expected value — knock only while you're on the street.";

  return {
    contract_low: contractLow,
    contract_mid: contractMid,
    contract_high: contractHigh,
    answer_probability: f.answer,
    pitch_probability: f.pitch,
    close_probability: f.close,
    sit_probability: f.sit,
    joint_probability: joint,
    commission_low: commissionLow,
    commission_high: commissionHigh,
    expected_commission: expected,
    expected_value_per_knock: expected,
    ev_low: Math.round(commissionLow * joint * 0.7),
    ev_high: Math.round(commissionHigh * joint * 1.3),
    knocks_to_one_deal: joint > 0 ? Math.round(1 / joint) : null,
    minutes_invested: minutes,
    value_per_hour: valuePerHour,
    per_ten_doors: Math.round(expected * 10),
    block_of_25: Math.round(expected * 25),
    funnel,
    levers,
    verdict,
  };
}


/* ────────────────────────────────────────────────── data triangulation */

export type FieldStatus = "corroborated" | "single" | "conflict" | "missing";

export interface TriangulatedField {
  field: string;
  value: string;
  sources: string[];
  status: FieldStatus;
  action: string | null;
}

export interface DataTriangulation {
  fields: TriangulatedField[];
  completeness_pct: number;
  corroboration_pct: number;
  conflicts: number;
  verify_at_door: string[];
}

export function buildDataTriangulation(r: PropertyIntelReport): DataTriangulation {
  const f: TriangulatedField[] = [];
  const push = (
    field: string,
    value: string | number | null | undefined,
    sources: string[],
    action: string | null,
    conflict = false,
  ) => {
    const has = value !== null && value !== undefined && value !== "" && value !== 0;
    f.push({
      field,
      value: has ? String(value) : "—",
      sources,
      status: !has ? "missing" : conflict ? "conflict" : sources.length >= 2 ? "corroborated" : "single",
      action: has && !conflict ? null : action,
    });
  };

  const deedSources = ["County Recorder"];
  const assessorSources = ["County Assessor"];

  push("Parcel / APN", r.property_match.parcel_number, [...assessorSources, "Geocoder"], "Confirm the parcel before you pitch.");
  push(
    "Owner of record",
    r.ownership.owner_name,
    r.most_recent_sale.buyer_name && r.most_recent_sale.buyer_name === r.ownership.owner_name
      ? [...deedSources, "Assessor tax roll"]
      : deedSources,
    "Ask who owns the home — stay generic at the door.",
    !!r.most_recent_sale.buyer_name && !!r.ownership.owner_name && r.most_recent_sale.buyer_name !== r.ownership.owner_name,
  );
  push(
    "Occupancy",
    r.identity.owner_occupancy_status.replace(/_/g, " "),
    r.ownership.tax_mailing_matches_property ? ["Tax mailing", "Assessor"] : ["Tax mailing"],
    "Confirm whether they own or rent.",
    !r.ownership.tax_mailing_matches_property && r.identity.owner_occupancy_status === "likely_owner_occupied",
  );
  push("Year built", r.info.year_built, assessorSources, "Ask how old the home is.");
  push("Square feet", r.info.square_feet, assessorSources, "Estimate on site.");
  push("Roof material", r.info.roof_material, assessorSources, "Identify material on inspection.");
  push(
    "Roof age",
    r.info.estimated_roof_age !== null ? `${r.info.estimated_roof_age} yrs` : null,
    r.info.permits.length ? ["Permits", "Build year"] : ["Build year"],
    "Ask when the roof was last done and by whom.",
  );
  push("Market value", r.info.estimated_market_value, assessorSources, "Do not quote a value — ask theirs.");
  push("Assessed value", r.info.assessed_value, assessorSources, "Pull tax record before the sit.");
  push("Last sale", r.most_recent_sale.sale_date, deedSources, "Ask how long they've been in the home.");
  push("Sale price", r.most_recent_sale.sale_price, deedSources, "Do not reference purchase price if unconfirmed.");
  push("Solar", r.info.solar_present === null ? null : r.info.solar_present ? "Yes" : "No", ["Assessor"], "Look for panels on the walk-up.");
  push("Permits on file", r.info.permits.length || null, ["Permit index"], "Ask what work has been done since they moved in.");

  const present = f.filter((x) => x.status !== "missing").length;
  const corroborated = f.filter((x) => x.status === "corroborated").length;
  const conflicts = f.filter((x) => x.status === "conflict").length;

  return {
    fields: f,
    completeness_pct: Math.round((present / f.length) * 100),
    corroboration_pct: Math.round((corroborated / f.length) * 100),
    conflicts,
    verify_at_door: f.filter((x) => x.action).slice(0, 6).map((x) => `${x.field}: ${x.action}`),
  };
}

/* ──────────────────────────────────────────────────────── timing signals */

export interface TimingSignal {
  label: string;
  detail: string;
  weight: "high" | "medium" | "low";
}

export interface TimingIntel {
  signals: TimingSignal[];
  season_note: string;
  permit_gap_years: number | null;
  next_review_year: number | null;
  urgency_index: number; // 0-100
}

const SEASON_NOTE: Record<number, string> = {
  0: "Winter — leak season. Lead with water intrusion and interior damage.",
  1: "Winter — leak season. Lead with water intrusion and interior damage.",
  2: "Pre-storm spring — position ahead of the wind/hail window.",
  3: "Storm season opens — insurance conversations are live.",
  4: "Pre-summer — heat, attic temps and utility bills sell ventilation.",
  5: "Peak heat — utility bill anchoring is strongest right now.",
  6: "Monsoon / peak heat — damage plus utility pain in the same visit.",
  7: "Monsoon — active storm damage claims in the neighborhood.",
  8: "Post-monsoon — inspect for wind and hail damage from the season.",
  9: "Fall — 'before winter' urgency and install calendars still open.",
  10: "Pre-winter — installation slots tighten; scarcity is real, not scripted.",
  11: "Year-end — tax and budget-cycle framing, plus leak season starts.",
};

export function buildTiming(r: PropertyIntelReport, q: QualificationDeck): TimingIntel {
  const signals: TimingSignal[] = [];
  const now = new Date();
  const year = now.getFullYear();

  const roof = q.lifecycle[0];
  if (roof.status === "overdue") {
    signals.push({ label: "Past rated life", detail: `${roof.system} is ~${roof.age} yrs on a ${roof.expected_life}-yr material.`, weight: "high" });
  } else if (roof.status === "window" && roof.remaining !== null) {
    signals.push({ label: "Replacement window", detail: `Enters replacement window within ${roof.remaining} yrs.`, weight: "high" });
  }

  const lastPermitYear = r.info.permits
    .map((p) => Number(String(p.date).slice(0, 4)))
    .filter((y) => Number.isFinite(y) && y > 1900)
    .sort((a, b) => b - a)[0] ?? null;
  const permitGap = lastPermitYear ? year - lastPermitYear : null;
  if (permitGap !== null && permitGap >= 15) {
    signals.push({ label: "Permit gap", detail: `No permitted work in ${permitGap} yrs — deferred maintenance likely.`, weight: "medium" });
  } else if (lastPermitYear === null) {
    signals.push({ label: "No permits on record", detail: "Nothing major replaced since build, or work was unpermitted.", weight: "medium" });
  }

  if (q.equity.tenure_years !== null && q.equity.tenure_years >= 7 && q.equity.tenure_years <= 12) {
    signals.push({ label: "Reinvestment window", detail: `${Math.round(q.equity.tenure_years)} yrs in — the years owners upgrade rather than move.`, weight: "medium" });
  }
  if (q.equity.tenure_years !== null && q.equity.tenure_years < 2) {
    signals.push({ label: "New owner", detail: "Recent purchase — improvement budgets are open, equity is thin.", weight: "medium" });
  }
  if (r.info.storm_exposure === "high") {
    signals.push({ label: "Storm exposure", detail: "High-exposure area — claim and inspection urgency is credible.", weight: "high" });
  }
  if (r.info.heat_exposure === "high") {
    signals.push({ label: "Heat exposure", detail: "High heat load — ventilation and coating pay back fastest here.", weight: "medium" });
  }

  const urgency = Math.max(
    0,
    Math.min(
      100,
      (roof.status === "overdue" ? 55 : roof.status === "window" ? 40 : roof.status === "watch" ? 22 : 8) +
        (permitGap !== null && permitGap >= 15 ? 12 : lastPermitYear === null ? 10 : 0) +
        (r.info.storm_exposure === "high" ? 15 : 0) +
        (r.info.heat_exposure === "high" ? 8 : 0) +
        (q.equity.tenure_years !== null && q.equity.tenure_years >= 12 ? 10 : 0),
    ),
  );

  const nextReview = roof.remaining !== null && roof.remaining > 0 ? year + Math.min(roof.remaining, 5) : year;

  return {
    signals,
    season_note: SEASON_NOTE[now.getMonth()],
    permit_gap_years: permitGap,
    next_review_year: nextReview,
    urgency_index: urgency,
  };
}

/* ─────────────────────────────────────────────────────────── aggregate */

export interface IntelMetrics {
  valuation: ValuationTriangulation;
  affordability: Affordability;
  economics: DealEconomics;
  data: DataTriangulation;
  timing: TimingIntel;
  route_priority: number; // 0-100 blended routing score
  route_note: string;
}

export function buildIntelMetrics(r: PropertyIntelReport, deck?: QualificationDeck): IntelMetrics {
  const q = deck ?? buildQualification(r);
  const valuation = buildValuation(r, q);
  const affordability = buildAffordability(r, q, valuation);
  const economics = buildDealEconomics(q);
  const data = buildDataTriangulation(r);
  const timing = buildTiming(r, q);

  const route = Math.round(
    q.score * 0.4 +
      timing.urgency_index * 0.25 +
      affordability.index * 0.2 +
      data.corroboration_pct * 0.15,
  );

  const route_note =
    route >= 78 ? "Top of the route — knock this before anything else on the street."
      : route >= 60 ? "Strong route position — schedule inside today's block."
        : route >= 42 ? "Mid route — knock in sequence."
          : "Bottom of the route — only if you're already passing it.";

  return { valuation, affordability, economics, data, timing, route_priority: route, route_note };
}

/* ─────────────────────────────────────────────── credit & cash-flow read */

export interface CreditSignal {
  label: string;
  detail: string;
  points: number; // signed contribution to the score estimate
}

export interface CreditProfile {
  /** Midpoint FICO-style estimate (inferred, never verified). */
  score_mid: number | null;
  score_low: number | null;
  score_high: number | null;
  tier: "excellent" | "good" | "fair" | "challenged" | "unknown";
  tier_note: string;
  /** Rough approval read for typical DaBella lender tiers. */
  approval_note: string;
  signals: CreditSignal[];
  confidence: "low" | "moderate" | "high";
  /** Monthly dollars left after housing, taxes and typical living costs. */
  disposable_low: number | null;
  disposable_mid: number | null;
  disposable_high: number | null;
  disposable_note: string;
  /** Project payment as a share of estimated disposable income. */
  payment_to_disposable_pct: number | null;
  headroom_note: string;
  caveats: string[];
}

const TIER_OF = (s: number): CreditProfile["tier"] =>
  s >= 740 ? "excellent" : s >= 680 ? "good" : s >= 620 ? "fair" : "challenged";

export function buildCreditProfile(
  r: PropertyIntelReport,
  q: QualificationDeck,
  v: ValuationTriangulation,
  a: Affordability,
): CreditProfile {
  const signals: CreditSignal[] = [];
  let score = 690;
  const add = (label: string, detail: string, points: number) => {
    signals.push({ label, detail, points });
    score += points;
  };

  const tenure = q.equity.tenure_years;
  const pct = q.equity.equity_pct;
  const value = v.consensus;

  if (tenure !== null) {
    if (tenure < 3) add("Recent mortgage underwriting", `Bought ~${Math.round(tenure)} yr ago — passed a lender within the last cycle`, 18);
    else if (tenure < 8) add("Established tenure", `${Math.round(tenure)} yrs in the home — seasoned payment history`, 10);
    else add("Long tenure", `${Math.round(tenure)} yrs in the home — long, stable trade lines`, 20);
  } else {
    add("Tenure unknown", "No recorded purchase — no payment-history proxy", -6);
  }

  if (pct !== null) {
    if (pct >= 60) add("Deep equity", `~${pct}% estimated equity — strong secured-loan profile`, 28);
    else if (pct >= 40) add("Solid equity", `~${pct}% estimated equity`, 16);
    else if (pct >= 20) add("Building equity", `~${pct}% estimated equity`, 6);
    else add("Thin equity", `~${pct}% estimated equity — leveraged`, -10);
  } else {
    add("Equity unknown", "No sale/value basis to estimate equity", -5);
  }

  if (value) {
    if (value >= 750_000) add("High-value home", `${Math.round(value / 1000)}k consensus value`, 20);
    else if (value >= 500_000) add("Above-median home", `${Math.round(value / 1000)}k consensus value`, 12);
    else if (value >= 325_000) add("Median-range home", `${Math.round(value / 1000)}k consensus value`, 5);
    else add("Entry-value home", `${Math.round(value / 1000)}k consensus value`, -6);
  }

  if (r.ownership.owner_type === "trust" || r.ownership.owner_type === "llc") {
    add("Entity / trust ownership", "Estate planning or investor profile — usually strong credit", 14);
  }
  if (r.info.solar_present) add("Solar on record", "Financed solar implies a recent approval", 8);

  const recentPermit = (r.info.permits ?? []).some((p) => {
    const y = Number(String(p.date).slice(0, 4));
    return Number.isFinite(y) && new Date().getFullYear() - y <= 5;
  });
  if (recentPermit) add("Recent permitted work", "Paid for improvements in the last 5 yrs", 8);

  if (r.ownership.tax_mailing_matches_property) add("Owner-occupied", "Tax mail goes to the property", 6);
  else if (r.ownership.tax_mailing_matches_property === false) add("Absentee mailing address", "Tax mail off-site — occupancy unclear", -4);

  const known = [tenure, pct, value].filter((x) => x !== null).length;
  const hasBasis = known > 0;
  const mid = hasBasis ? Math.max(560, Math.min(820, Math.round(score))) : null;
  const spread = known >= 3 ? 25 : known === 2 ? 35 : 45;
  const low = mid !== null ? Math.max(540, mid - spread) : null;
  const high = mid !== null ? Math.min(850, mid + spread) : null;
  const tier = mid === null ? "unknown" : TIER_OF(mid);

  const tier_note = {
    excellent: "Reads as prime — expect the best rate sheet and lowest factors.",
    good: "Reads as near-prime — standard programs should clear.",
    fair: "Reads as mid-tier — expect a higher factor or a co-applicant ask.",
    challenged: "Reads as sub-prime — lead with a secured or shorter-scope path.",
    unknown: "Not enough public-record signal to infer a credit band.",
  }[tier];

  const approval_note = {
    excellent: "Likely approves on tier 1 with room for 120–180 mo terms.",
    good: "Likely approves on tier 1–2; have the 120 mo option ready.",
    fair: "Plan for tier 2–3 factors; phased scope keeps the payment in range.",
    challenged: "Expect a decline on unsecured — position secured/HELOC or phase the work.",
    unknown: "Run the soft pull before you shape the payment story.",
  }[tier];

  /* ── disposable monthly income ── */
  const grossMonthly = a.implied_household_income ? a.implied_household_income / 12 : null;
  const housing = a.implied_monthly_housing ?? (v.consensus ? Math.round((v.consensus * 0.011) / 12) : null);
  let disposable_mid: number | null = null;
  if (grossMonthly) {
    const net = grossMonthly * 0.76; // fed/state/FICA drag
    const living = grossMonthly * 0.34; // food, transport, insurance, utilities, debt service
    disposable_mid = Math.max(0, Math.round(net - (housing ?? 0) - living));
  }
  const disposable_low = disposable_mid !== null ? Math.max(0, Math.round(disposable_mid * 0.7)) : null;
  const disposable_high = disposable_mid !== null ? Math.round(disposable_mid * 1.3) : null;

  const ptd = disposable_mid && disposable_mid > 0
    ? Math.round((a.project_payment_mid / disposable_mid) * 1000) / 10
    : null;

  const headroom_note = ptd === null
    ? "No income basis on record — ask a budget question instead of assuming one."
    : ptd <= 20 ? "Payment fits well inside estimated free cash flow — anchor the 120 mo option."
      : ptd <= 40 ? "Payment takes a real bite of free cash flow — show 180 mo as the comfort lane."
        : ptd <= 65 ? "Payment crowds free cash flow — phase the scope or stretch the term."
          : "Payment likely exceeds free cash flow — sell one system now, plan the rest.";

  const disposable_note = disposable_mid === null
    ? "Value-implied income unavailable."
    : `Gross ~${Math.round((grossMonthly ?? 0)).toLocaleString()}/mo, less taxes, housing ~${(housing ?? 0).toLocaleString()} and typical living costs.`;

  return {
    score_mid: mid,
    score_low: low,
    score_high: high,
    tier,
    tier_note,
    approval_note,
    signals,
    confidence: known >= 3 ? "moderate" : known === 2 ? "low" : "low",
    disposable_low,
    disposable_mid,
    disposable_high,
    disposable_note,
    payment_to_disposable_pct: ptd,
    headroom_note,
    caveats: [
      "Inferred from public property records — this is NOT a credit report or a credit decision.",
      "Never state a credit score or income figure to the homeowner; use it only to pick which option to lead with.",
      "Always confirm with the lender's soft pull before promising terms.",
    ],
  };
}
