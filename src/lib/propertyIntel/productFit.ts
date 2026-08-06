import type { PropertyIntelReport } from "./types";
import { buildQualification } from "./qualification";

/**
 * Product fit board — scores every DaBella offering against the property record
 * so a rep can see, line by line, which lines to lead with, what the ballpark
 * investment is, and what the monthly payment looks like.
 */

export type OfferKey =
  | "roofing" | "coollife" | "windows" | "siding" | "bath" | "gutters" | "insulation";

export interface ProductFit {
  key: OfferKey;
  label: string;
  blurb: string;
  /** 0-100 need score */
  score: number;
  band: "lead" | "strong" | "possible" | "hold";
  age: number | null;
  expected_life: number;
  /** Years past (negative) or remaining on rated life. */
  remaining: number | null;
  low: number;
  high: number;
  monthly_low: number;
  monthly_high: number;
  drivers: string[];
  verify: string;
}

export interface ProductFitBoard {
  items: ProductFit[];
  lead: ProductFit;
  bundle: { low: number; high: number; monthly_low: number; monthly_high: number; items: string[] };
  total_home_opportunity: { low: number; high: number };
  basis: string;
}

/** 120-month retail reference factor (11.24% APR book). */
const FACTOR_120 = 0.01391;

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

const round500 = (n: number) => Math.max(0, Math.round(n / 500) * 500);

interface Model {
  key: OfferKey;
  label: string;
  blurb: string;
  life: number;
  perSqFt: [number, number] | null;
  floor: [number, number];
  areaMultiplier: number;
  verify: string;
}

const MODELS: Model[] = [
  {
    key: "roofing", label: "Roofing", blurb: "GAF / Westlake systems, Golden Pledge® coverage",
    life: 22, perSqFt: [7.5, 13.5], floor: [12000, 22000], areaMultiplier: 1.25,
    verify: "Photograph south/west faces for granule loss, flashing and penetrations.",
  },
  {
    key: "coollife", label: "Cool Life coating", blurb: "Westlake Cool Life series — tile / TPO / low-slope reflective system",
    life: 15, perSqFt: [4.5, 8.0], floor: [8000, 16000], areaMultiplier: 1.25,
    verify: "Confirm substrate (tile, TPO, low-slope) and current reflectivity / chalking.",
  },
  {
    key: "windows", label: "Windows", blurb: "Dual-pane vinyl replacement, energy package",
    life: 25, perSqFt: [6.0, 11.0], floor: [9000, 18000], areaMultiplier: 1,
    verify: "Count openings, check for fogging, failed seals and single-pane glass.",
  },
  {
    key: "siding", label: "Siding", blurb: "Insulated siding and exterior envelope",
    life: 30, perSqFt: [9.0, 16.0], floor: [16000, 30000], areaMultiplier: 1,
    verify: "Inspect for chalking, warping, woodpecker/rot damage and caulk failure.",
  },
  {
    key: "bath", label: "Bath / shower", blurb: "One-day acrylic bath and shower systems",
    life: 20, perSqFt: null, floor: [12000, 24000], areaMultiplier: 0,
    verify: "Ask to see the original wet areas — grout, pan and surround condition.",
  },
  {
    key: "gutters", label: "Gutters", blurb: "Seamless gutters and leaf protection",
    life: 20, perSqFt: [1.2, 2.4], floor: [2500, 5500], areaMultiplier: 1,
    verify: "Check fascia rot, seam separation and grade / drainage at downspouts.",
  },
  {
    key: "insulation", label: "Attic insulation", blurb: "Blown-in insulation and attic ventilation",
    life: 25, perSqFt: [1.8, 3.6], floor: [3500, 8500], areaMultiplier: 1,
    verify: "Ask about summer cooling bills and check attic depth / ventilation.",
  },
];

function bandFor(score: number): ProductFit["band"] {
  return score >= 78 ? "lead" : score >= 60 ? "strong" : score >= 42 ? "possible" : "hold";
}

export function buildProductFit(r: PropertyIntelReport): ProductFitBoard {
  const q = buildQualification(r);
  const year = new Date().getFullYear();
  const yearBuilt = r.info.year_built;
  const homeAge = yearBuilt ? year - yearBuilt : null;
  const sqft = r.info.square_feet ?? null;
  const roofMaterial = (r.info.roof_material ?? "").toLowerCase();
  const roofAge = r.info.estimated_roof_age ?? homeAge;
  const isTileOrLowSlope = /tile|concrete|clay|tpo|membrane|flat|rolled/.test(roofMaterial);

  const items: ProductFit[] = MODELS.map((m) => {
    const life = m.key === "roofing" ? roofLifeFor(r.info.roof_material) : m.life;
    const age = m.key === "roofing" || m.key === "coollife" ? roofAge : homeAge;
    const remaining = age === null ? null : life - age;

    // Base need from lifecycle position.
    let score = age === null ? 45 : Math.max(5, Math.min(100, Math.round((age / life) * 92)));
    const drivers: string[] = [];
    if (age !== null) drivers.push(`${age} yrs of a ${life}-yr rated life`);
    else drivers.push("Age unknown — verify at the door");

    // Product-specific modifiers.
    if (m.key === "coollife") {
      if (isTileOrLowSlope) { score += 18; drivers.push(`${r.info.roof_material ?? "Tile / low-slope"} substrate — Cool Life restores instead of tear-off`); }
      else { score -= 26; drivers.push("Steep-slope shingle — coating is not the right system"); }
      if (r.info.heat_exposure === "high") { score += 8; drivers.push("High heat exposure — reflective coating cuts attic load"); }
    }
    if (m.key === "roofing") {
      if (isTileOrLowSlope && (remaining ?? 0) > 5) { score -= 10; drivers.push("Long-life material still inside rated life — restoration may beat replacement"); }
      if (r.info.storm_exposure === "high") { score += 8; drivers.push("High storm exposure"); }
      if (r.info.solar_present) { score -= 6; drivers.push("Solar present — detach/reset adds scope"); }
    }
    if (m.key === "windows" && (r.info.heat_exposure === "high")) { score += 6; drivers.push("High heat exposure — glazing drives cooling cost"); }
    if (m.key === "siding" && r.info.exterior_material) drivers.push(`Exterior: ${r.info.exterior_material}`);
    if (m.key === "insulation" && r.info.heat_exposure === "high") { score += 8; drivers.push("Cooling load relief pairs with roof"); }
    if (m.key === "gutters" && r.info.storm_exposure === "high") { score += 5; drivers.push("Storm exposure — drainage failure accelerates fascia rot"); }
    if (m.key === "bath" && (r.info.bathrooms ?? 0) >= 3) { score += 4; drivers.push(`${r.info.bathrooms} baths on record`); }

    // Ability to pay nudges everything a little.
    if (q.equity.band === "strong") score += 4;
    else if (q.equity.band === "weak") score -= 5;

    score = Math.max(0, Math.min(100, Math.round(score)));

    // Cost envelope.
    let low = m.floor[0];
    let high = m.floor[1];
    if (sqft && m.perSqFt && m.areaMultiplier > 0) {
      const area = sqft * m.areaMultiplier;
      low = Math.max(m.floor[0], round500(area * m.perSqFt[0]));
      high = Math.max(m.floor[1], round500(area * m.perSqFt[1]));
    }

    return {
      key: m.key, label: m.label, blurb: m.blurb, score, band: bandFor(score),
      age, expected_life: life, remaining,
      low, high,
      monthly_low: Math.round(low * FACTOR_120),
      monthly_high: Math.round(high * FACTOR_120),
      drivers: drivers.slice(0, 3),
      verify: m.verify,
    };
  }).sort((a, b) => b.score - a.score);

  const lead = items[0];
  const bundleItems = items.filter((i) => i.band === "lead" || i.band === "strong").slice(0, 3);
  const picked = bundleItems.length ? bundleItems : [lead];
  const bLow = picked.reduce((s, i) => s + i.low, 0);
  const bHigh = picked.reduce((s, i) => s + i.high, 0);

  return {
    items,
    lead,
    bundle: {
      low: bLow, high: bHigh,
      monthly_low: Math.round(bLow * FACTOR_120),
      monthly_high: Math.round(bHigh * FACTOR_120),
      items: picked.map((i) => i.label),
    },
    total_home_opportunity: {
      low: items.reduce((s, i) => s + i.low, 0),
      high: items.reduce((s, i) => s + i.high, 0),
    },
    basis: sqft
      ? `${sqft.toLocaleString()} sq ft × category rates · 120-mo at 11.24% APR reference factor`
      : "Category baselines (square footage unavailable) · 120-mo at 11.24% APR reference factor",
  };
}
