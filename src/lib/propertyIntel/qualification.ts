import type { PropertyIntelReport, ProductKey } from "./types";

/**
 * Qualification engine — turns raw property intel into door-ready "ammo":
 * equity/ability-to-pay estimates, system lifecycle timing, decision-maker map,
 * predicted objections with rebuttals, and discovery questions.
 *
 * Everything here is an ESTIMATE derived from public-record data. Nothing here
 * is a credit decision, financing approval, or proof of purchasing ability.
 */

export type Band = "strong" | "moderate" | "weak" | "unknown";

export interface Pillar {
  key: string;
  label: string;
  score: number; // 0-100
  weight: number;
  detail: string;
}

export interface EquityPicture {
  purchase_price: number | null;
  purchase_year: number | null;
  tenure_years: number | null;
  current_value: number | null;
  value_basis: string;
  appreciation: number | null;
  estimated_balance: number | null;
  estimated_equity: number | null;
  equity_pct: number | null;
  band: Band;
  notes: string[];
}

export interface LifecycleItem {
  system: string;
  age: number | null;
  expected_life: number;
  remaining: number | null;
  pct_used: number;
  status: "overdue" | "window" | "watch" | "healthy" | "unknown";
  note: string;
}

export interface PredictedObjection {
  id: string;
  trigger: string;
  objection: string;
  rebuttal: string;
  likelihood: "high" | "medium" | "low";
}

export interface InvestmentLadder {
  product: string;
  low: number;
  high: number;
  basis: string;
  rate_label: string;
  rows: { term_months: number; low: number; high: number }[];
  equity_headroom: number | null;
}

export interface QualificationDeck {

  score: number;
  tier: "A" | "B" | "C" | "D";
  tier_note: string;
  pillars: Pillar[];
  equity: EquityPicture;
  lifecycle: LifecycleItem[];
  investment: InvestmentLadder;
  decision_makers: { label: string; note: string; required: boolean }[];

  objections: PredictedObjection[];
  discovery: string[];
  urgency_hooks: string[];
  red_flags: string[];
  best_knock_window: string;
  door_ammo: string;
}

const ROOF_LIFE: Record<string, number> = {
  asphalt: 22, "asphalt shingle": 22, shingle: 22, composition: 22,
  wood: 25, shake: 25, tile: 45, concrete: 45, clay: 50,
  metal: 45, slate: 75, tpo: 22, membrane: 20, flat: 18, rolled: 12,
};

function roofLifeFor(material: string | null): number {
  if (!material) return 22;
  const m = material.toLowerCase();
  const hit = Object.keys(ROOF_LIFE).find((k) => m.includes(k));
  return hit ? ROOF_LIFE[hit] : 22;
}

function money(n: number | null | undefined): number | null {
  return typeof n === "number" && isFinite(n) && n > 0 ? n : null;
}

/** Remaining balance on a 30-yr fixed after `years`, assuming 80% LTV at `rate`. */
function remainingBalance(principal: number, years: number, rate = 0.055): number {
  const n = 360;
  const r = rate / 12;
  const p = principal * 0.8;
  const paid = Math.min(Math.max(years, 0) * 12, n);
  const bal = p * ((Math.pow(1 + r, n) - Math.pow(1 + r, paid)) / (Math.pow(1 + r, n) - 1));
  return Math.max(0, Math.round(bal));
}

function bandFrom(score: number): Band {
  if (score >= 72) return "strong";
  if (score >= 45) return "moderate";
  if (score > 0) return "weak";
  return "unknown";
}

function buildEquity(r: PropertyIntelReport): EquityPicture {
  const notes: string[] = [];
  const now = new Date();
  const saleDate = r.most_recent_sale.sale_date ? new Date(r.most_recent_sale.sale_date) : null;
  const purchase = money(r.most_recent_sale.sale_price);
  const tenure = saleDate && !isNaN(saleDate.getTime())
    ? Math.max(0, Math.round(((now.getTime() - saleDate.getTime()) / 31557600000) * 10) / 10)
    : null;

  let current = money(r.info.estimated_market_value);
  let basis = "Provider market estimate";
  if (!current) {
    const assessed = money(r.info.assessed_value);
    if (assessed) { current = Math.round(assessed * 1.15); basis = "Assessed value × 1.15"; }
  }
  if (!current && purchase && tenure !== null) {
    current = Math.round(purchase * Math.pow(1.045, tenure));
    basis = "Purchase price appreciated ~4.5%/yr";
  }
  if (!current) { basis = "No valuation available"; notes.push("No assessed or market value on record — ask value questions at the door."); }

  const balance = purchase && tenure !== null ? remainingBalance(purchase, tenure) : null;
  const equity = current && balance !== null ? Math.max(0, current - balance) : null;
  const pct = equity !== null && current ? Math.round((equity / current) * 100) : null;
  const appreciation = current && purchase ? current - purchase : null;

  if (tenure !== null && tenure < 2) notes.push("Recent purchase — equity thin, but new owners spend on the home early.");
  if (tenure !== null && tenure >= 12) notes.push("Long tenure — deferred maintenance is likely and equity is deep.");
  if (pct !== null && pct >= 60) notes.push("Estimated equity supports secured financing conversations.");
  notes.push("Estimates only — not proof of purchasing ability or financing eligibility.");

  return {
    purchase_price: purchase,
    purchase_year: saleDate && !isNaN(saleDate.getTime()) ? saleDate.getFullYear() : null,
    tenure_years: tenure,
    current_value: current,
    value_basis: basis,
    appreciation,
    estimated_balance: balance,
    estimated_equity: equity,
    equity_pct: pct,
    band: pct === null ? "unknown" : bandFrom(pct),
    notes,
  };
}

function buildLifecycle(r: PropertyIntelReport): LifecycleItem[] {
  const items: LifecycleItem[] = [];
  const yearBuilt = r.info.year_built;
  const age = (v: number | null) => (v === null ? null : v);

  const roofAge = r.info.estimated_roof_age ?? (yearBuilt ? new Date().getFullYear() - yearBuilt : null);
  const roofLife = roofLifeFor(r.info.roof_material);
  items.push(mk("Roof", age(roofAge), roofLife, r.info.is_roof_age_estimated || !r.info.estimated_roof_age
    ? "Age estimated from build year / permits — confirm on inspection."
    : `Material: ${r.info.roof_material ?? "unknown"}.`));

  const homeAge = yearBuilt ? new Date().getFullYear() - yearBuilt : null;
  items.push(mk("Windows", homeAge, 25, "Original glazing fails around year 20–25; look for seal failure and fogging."));
  items.push(mk("Exterior / siding", homeAge, 30, `Exterior: ${r.info.exterior_material ?? "unknown"}.`));
  items.push(mk("Bath / shower", homeAge, 20, "Original wet areas past 20 years are prime remodel candidates."));
  items.push(mk("Gutters", homeAge, 20, "Check fascia rot and grade — pairs naturally with a roof sale."));

  return items;

  function mk(system: string, a: number | null, life: number, note: string): LifecycleItem {
    const remaining = a === null ? null : life - a;
    const pct = a === null ? 0 : Math.min(100, Math.round((a / life) * 100));
    const status: LifecycleItem["status"] =
      a === null ? "unknown" : remaining! <= 0 ? "overdue" : remaining! <= 5 ? "window" : remaining! <= 10 ? "watch" : "healthy";
    return { system, age: a, expected_life: life, remaining, pct_used: pct, status, note };
  }
}

const PRODUCT_LABEL: Record<ProductKey, string> = {
  roofing: "roof", windows: "windows", bath: "bath", siding: "siding",
  paint: "exterior coating", gutters: "gutters", ventilation: "attic ventilation", insulation: "insulation",
};

function buildObjections(r: PropertyIntelReport, eq: EquityPicture): PredictedObjection[] {
  const out: PredictedObjection[] = [];
  const product = PRODUCT_LABEL[r.opportunity.primary_product] ?? "project";

  if (eq.tenure_years !== null && eq.tenure_years < 3) {
    out.push({
      id: "just-bought", likelihood: "high", trigger: `Purchased ${eq.tenure_years} yrs ago`,
      objection: "We just bought the place — everything passed inspection.",
      rebuttal: "A sale inspection is a snapshot, not a lifespan report. It tells you it isn't leaking today — not how many seasons are left. Let me show you what the inspector didn't measure.",
    });
  }
  if (eq.tenure_years !== null && eq.tenure_years >= 15) {
    out.push({
      id: "always-fine", likelihood: "high", trigger: `${Math.round(eq.tenure_years)} yrs in the home`,
      objection: "It's held up fine for years, we're not worried.",
      rebuttal: "That's exactly why I'm here — it's done its job. Materials don't fail gradually, they fail all at once at the end of their rating. You've gotten every year out of it; let's decide the timing instead of the weather deciding for you.",
    });
  }
  if (eq.band === "weak" || eq.equity_pct === null) {
    out.push({
      id: "cant-afford", likelihood: "high", trigger: "Limited estimated equity",
      objection: "We can't afford this right now.",
      rebuttal: "Most of our homeowners don't write a check. We work in monthly terms — the question is whether the payment beats what deferring costs you in damage and energy loss.",
    });
  } else {
    out.push({
      id: "shop-around", likelihood: "medium", trigger: "Strong equity profile",
      objection: "We want to get three bids.",
      rebuttal: "Smart. Just make sure you compare warranty, crew certification and material grade — not just the number. I'll leave you the spec sheet so the comparison is apples to apples.",
    });
  }
  if (r.ownership.owner_type === "joint") {
    out.push({
      id: "spouse", likelihood: "high", trigger: "Two names on the deed",
      objection: "I need to talk to my spouse.",
      rebuttal: "Absolutely — and that's why I'd rather present once with both of you than twice with half the information. When are you two in the same room?",
    });
  }
  if (["trust", "llc", "corporation"].includes(r.ownership.owner_type)) {
    out.push({
      id: "not-decision-maker", likelihood: "high", trigger: `Title held by ${r.ownership.owner_type.toUpperCase()}`,
      objection: "I'd have to run it past the trustee / partner.",
      rebuttal: "Understood — who signs for the property? Let's get the inspection done now so the decision-maker has real numbers instead of a guess.",
    });
  }
  if (!r.ownership.tax_mailing_matches_property) {
    out.push({
      id: "rental", likelihood: "medium", trigger: "Tax mail goes elsewhere",
      objection: "I just rent here / I'm not the owner.",
      rebuttal: "No problem. Owners of rentals still care about a failing roof — can I leave a condition report the owner can act on, and get their best contact?",
    });
  }
  if (r.info.solar_present) {
    out.push({
      id: "solar", likelihood: "medium", trigger: "Solar detected on roof",
      objection: "We can't do the roof, we have solar.",
      rebuttal: "We detach and reset solar every week. Doing the roof after the panels go on is the normal order of operations — what you don't want is a roof failing under a 25-year array.",
    });
  }
  out.push({
    id: "no-time", likelihood: "medium", trigger: "Standard door resistance",
    objection: "Now's not a good time.",
    rebuttal: `Fair — I'm not asking for an hour. Give me the time it takes to walk the ${product} and I'll tell you honestly whether you need us this year or in five.`,
  });

  return out.slice(0, 6);
}

function buildDiscovery(r: PropertyIntelReport, eq: EquityPicture): string[] {
  const q: string[] = [];
  const product = PRODUCT_LABEL[r.opportunity.primary_product] ?? "home";
  q.push(`When was the ${product} last worked on, and do you know who did it?`);
  if (eq.tenure_years !== null) q.push(`You've been here about ${Math.round(eq.tenure_years)} years — what's on the list you keep meaning to get to?`);
  q.push("Have you had anyone up there since the last big storm?");
  q.push("Is this the home you plan to stay in, or is there a move on the horizon?");
  q.push("Who besides you weighs in on a decision like this?");
  if (r.info.solar_present) q.push("Who installed the solar, and is it owned or leased?");
  if (r.info.storm_exposure === "high") q.push("Did you file anything with insurance after the last hail event?");
  if (r.info.heat_exposure === "high") q.push("What are your summer utility bills running now versus a few years ago?");
  q.push("If we found something that needs attention, would you want it handled this season or budgeted for next?");
  return q;
}

/** Rough project cost envelope per product, driven by home size. */
const COST_MODEL: Record<ProductKey, { perSqFt: [number, number]; floor: [number, number]; multiplier: number }> = {
  roofing:     { perSqFt: [7.5, 13.5], floor: [12000, 22000], multiplier: 1.25 },
  windows:     { perSqFt: [6.0, 11.0], floor: [9000, 18000], multiplier: 1 },
  siding:      { perSqFt: [9.0, 16.0], floor: [16000, 30000], multiplier: 1 },
  bath:        { perSqFt: [0, 0], floor: [12000, 24000], multiplier: 0 },
  paint:       { perSqFt: [3.0, 5.5], floor: [7000, 13000], multiplier: 1 },
  gutters:     { perSqFt: [1.2, 2.4], floor: [2500, 5500], multiplier: 1 },
  ventilation: { perSqFt: [0.8, 1.6], floor: [1800, 4200], multiplier: 1 },
  insulation:  { perSqFt: [1.8, 3.6], floor: [3500, 8500], multiplier: 1 },
};

const LADDER_TERMS = [60, 120, 180, 240];

function buildInvestment(r: PropertyIntelReport, eq: EquityPicture): InvestmentLadder {
  const key = r.opportunity.primary_product;
  const model = COST_MODEL[key] ?? COST_MODEL.roofing;
  const sqft = r.info.square_feet ?? null;

  let low = model.floor[0];
  let high = model.floor[1];
  let basis = "Category baseline — square footage unavailable";

  if (sqft && model.multiplier > 0) {
    const area = sqft * model.multiplier;
    low = Math.max(model.floor[0], Math.round((area * model.perSqFt[0]) / 500) * 500);
    high = Math.max(model.floor[1], Math.round((area * model.perSqFt[1]) / 500) * 500);
    basis = `${sqft.toLocaleString()} sq ft × category rate`;
  } else if (model.multiplier === 0) {
    basis = "Fixed-scope category range";
  }

  // Mid-book retail factor: 11.24% APR table (see Payment Factors reference).
  const FACTORS: Record<number, number> = { 60: 0.02186, 120: 0.01391, 180: 0.01152, 240: 0.01049 };

  return {
    product: PRODUCT_LABEL[key] ?? key,
    low, high, basis,
    rate_label: "11.24% APR reference factor",
    rows: LADDER_TERMS.map((t) => ({
      term_months: t,
      low: Math.round(low * FACTORS[t]),
      high: Math.round(high * FACTORS[t]),
    })),
    equity_headroom: eq.estimated_equity,
  };
}


function buildUrgency(r: PropertyIntelReport, life: LifecycleItem[]): string[] {
  const hooks: string[] = [];
  const roof = life[0];
  if (roof.status === "overdue") hooks.push(`Roof is ~${roof.age} yrs on a ${roof.expected_life}-yr material — past rated life.`);
  else if (roof.status === "window") hooks.push(`Roof enters its replacement window within ${roof.remaining} yrs.`);
  if (r.info.storm_exposure === "high") hooks.push("High storm exposure area — hail/wind damage is a live insurance conversation.");
  if (r.info.heat_exposure === "high") hooks.push("High heat exposure — ventilation and coating drive real utility savings here.");
  if (r.info.permits.length === 0) hooks.push("No permits on record — likely no major system replaced since build.");
  if (r.info.solar_present) hooks.push("Solar present — roof must outlive the array; detach/reset is the cheaper path now.");
  return hooks;
}

export function buildQualification(r: PropertyIntelReport): QualificationDeck {
  const equity = buildEquity(r);
  const lifecycle = buildLifecycle(r);
  const roof = lifecycle[0];

  // Pillars
  const ability = equity.equity_pct !== null ? Math.min(100, equity.equity_pct + 15) : 45;
  const motivation = equity.tenure_years === null ? 50
    : equity.tenure_years >= 15 ? 92 : equity.tenure_years >= 8 ? 78 : equity.tenure_years >= 3 ? 58 : 38;
  const need = roof.status === "overdue" ? 95 : roof.status === "window" ? 82 : roof.status === "watch" ? 60 : roof.status === "unknown" ? 45 : 30;
  const access = ["trust", "llc", "corporation"].includes(r.ownership.owner_type) ? 35
    : r.identity.owner_occupancy_status === "likely_owner_occupied" ? 88
    : r.ownership.tax_mailing_matches_property ? 70 : 45;
  const data = r.overall_confidence.score;

  const pillars: Pillar[] = [
    { key: "ability", label: "Ability to pay", score: Math.round(ability), weight: 0.25, detail: equity.equity_pct !== null ? `~${equity.equity_pct}% estimated equity` : "No valuation/sale basis" },
    { key: "motivation", label: "Motivation / tenure", score: motivation, weight: 0.2, detail: equity.tenure_years !== null ? `${Math.round(equity.tenure_years)} yrs in home` : "Tenure unknown" },
    { key: "need", label: "Product need", score: need, weight: 0.3, detail: `${roof.system} ${roof.age ?? "?"} yrs / ${roof.expected_life}-yr life` },
    { key: "access", label: "Decision access", score: access, weight: 0.15, detail: r.ownership.owner_type === "joint" ? "Two deeded owners — both at table" : `Title: ${r.ownership.owner_type}` },
    { key: "data", label: "Data quality", score: data, weight: 0.1, detail: `${r.overall_confidence.label} record confidence` },
  ];

  const score = Math.round(pillars.reduce((s, p) => s + p.score * p.weight, 0));
  const tier = score >= 80 ? "A" : score >= 65 ? "B" : score >= 48 ? "C" : "D";
  const tier_note = {
    A: "Priority knock — need, equity and access all line up. Go for a same-day inspection.",
    B: "Strong candidate — one pillar is soft. Qualify it at the door before you invest the full pitch.",
    C: "Worth a knock, low expectation. Lead with inspection value, not price.",
    D: "Low fit on paper. Knock only if you're already on the street — or route the neighbors instead.",
  }[tier];

  const decision_makers: { label: string; note: string; required: boolean }[] = [];
  if (r.ownership.owner_type === "joint") {
    decision_makers.push({ label: "Both deeded owners", note: "Two names on the deed — present once, to both.", required: true });
  } else if (["trust", "llc", "corporation"].includes(r.ownership.owner_type)) {
    decision_makers.push({ label: "Trustee / authorized signer", note: `Title held by ${r.ownership.owner_type.toUpperCase()} — confirm who can sign.`, required: true });
    if (r.identity.likely_occupant_name) decision_makers.push({ label: r.identity.likely_occupant_name, note: "Likely occupant — may be the beneficiary.", required: false });
  } else {
    decision_makers.push({ label: r.identity.likely_owner_name ?? "Recorded owner", note: "Single deeded owner.", required: true });
  }
  if (!r.ownership.tax_mailing_matches_property) {
    decision_makers.push({ label: "Off-site owner", note: `Tax mail: ${r.ownership.tax_mailing_address ?? "different address"} — occupant may be a tenant.`, required: false });
  }

  const red_flags: string[] = [];
  if (r.info.do_not_knock) red_flags.push("Do Not Knock — suppressed property.");
  if (r.info.existing_customer) red_flags.push("Existing DaBella customer — check history before pitching.");
  if (r.info.previous_dabella_interaction) red_flags.push("Prior DaBella interaction on record.");
  if (!r.brief.use_name_at_door) red_flags.push("Owner name confidence below 75% — do not use the name at the door.");
  if (r.identity.owner_occupancy_status === "likely_non_owner_occupied") red_flags.push("Likely non-owner-occupied — verify decision authority first.");
  if (r.property_match.confidence.score < 70) red_flags.push("Weak parcel match — verify the address before you commit the pitch.");

  const best_knock_window = r.identity.owner_occupancy_status === "likely_owner_occupied"
    ? "Weekdays 4:30–7:30 PM or Saturday 10 AM–2 PM — owner-occupied, likely working hours."
    : "Saturday mid-morning — occupancy unconfirmed, weekend gives the best contact odds.";

  const urgency_hooks = buildUrgency(r, lifecycle);
  const objections = buildObjections(r, equity);
  const discovery = buildDiscovery(r, equity);
  const investment = buildInvestment(r, equity);
  const ladder120 = investment.rows.find((x) => x.term_months === 120);

  const door_ammo = [
    `${r.property_match.standardized_address}`,
    `Tier ${tier} · Qualification ${score}/100 · ${r.opportunity.primary_product.toUpperCase()} lead`,
    r.brief.use_name_at_door && r.brief.headline_name ? `Owner: ${r.brief.headline_name}` : "Owner: unconfirmed — do not use a name",
    equity.tenure_years !== null ? `Tenure: ${Math.round(equity.tenure_years)} yrs${equity.purchase_year ? ` (bought ${equity.purchase_year})` : ""}` : "Tenure: unknown",
    equity.equity_pct !== null ? `Est. equity: ~${equity.equity_pct}%` : "Est. equity: unknown",
    `Roof: ${roof.age ?? "?"} yrs of ${roof.expected_life}-yr life`,
    ladder120 ? `Ballpark: $${investment.low.toLocaleString()}–$${investment.high.toLocaleString()} · ~$${ladder120.low}–$${ladder120.high}/mo @ 120 mo` : "",
    "",
    `OPENER: ${r.brief.suggested_opener}`,
    "",
    "URGENCY:",
    ...urgency_hooks.map((h) => `• ${h}`),
    "",
    "EXPECT:",
    ...objections.slice(0, 3).map((o) => `• "${o.objection}" → ${o.rebuttal}`),
    "",
    "ASK:",
    ...discovery.slice(0, 4).map((q) => `• ${q}`),
  ].join("\n");

  return {
    score, tier, tier_note, pillars, equity, lifecycle, investment,
    decision_makers, objections, discovery, urgency_hooks, red_flags,
    best_knock_window, door_ammo,
  };

}
