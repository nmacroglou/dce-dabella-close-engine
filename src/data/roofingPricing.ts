/**
 * Preliminary roof pricing — sourced from the field pricing sheet.
 * Prices are per SQ (square = 100 sq ft of roof area) unless noted.
 * Used by the preliminary estimate widget on the Deals page.
 */

export type RoofType = "shingle" | "tile";

export interface ShingleLine {
  id: string;
  label: string;
  pricePerSq: number;
  note?: string;
  roofType?: RoofType; // defaults to shingle for back-compat
}

export const SHINGLE_LINES: ShingleLine[] = [
  { id: "american_harvest", label: "American Harvest", pricePerSq: 1320, roofType: "shingle" },
  { id: "timberline_hd", label: "Timberline HD", pricePerSq: 1390, roofType: "shingle" },
  { id: "timberline_ultra_hd", label: "Timberline Ultra HD", pricePerSq: 1560, note: "Not stocked", roofType: "shingle" },
  { id: "woodland", label: "Woodland", pricePerSq: 1740, roofType: "shingle" },
  { id: "camelot_ii", label: "Camelot II", pricePerSq: 1740, roofType: "shingle" },
  { id: "grand_sequoia", label: "Grand Sequoia", pricePerSq: 1740, note: "Not stocked", roofType: "shingle" },
  { id: "grand_canyon", label: "Grand Canyon", pricePerSq: 1900, roofType: "shingle" },
  { id: "liberty_low_slope", label: "Liberty Low Slope (3-layer system)", pricePerSq: 1265, roofType: "shingle" },
  // Tile roofing lines
  { id: "tile_standard", label: "Standard Tile System", pricePerSq: 1100, roofType: "tile" },
  { id: "tile_cool_series", label: "Cool Series", pricePerSq: 1310, roofType: "tile" },
  { id: "tile_cool_therma", label: "Cool Series w/ Therma", pricePerSq: 1475, roofType: "tile" },
  { id: "tile_walk_pad", label: "Walk Pad", pricePerSq: 2000, roofType: "tile" },
  { id: "tile_california", label: "California Markets", pricePerSq: 300, note: "Upcharge / specialty market", roofType: "tile" },
];

export interface Accessory {
  id: string;
  label: string;
  /** Flat fee if `unit` is "flat"; otherwise per-unit cost. */
  price: number;
  unit: "flat" | "per_sheet" | "per_sq" | "per_ft" | "per_ea";
  /** Default qty when included (used when the rep just toggles it on). */
  defaultQty?: number;
}

export const ACCESSORIES: Accessory[] = [
  { id: "tarp_fee", label: "Tarp fee (non-refundable)", price: 500, unit: "flat", defaultQty: 1 },
  { id: "resheeting", label: "Resheeting", price: 150, unit: "per_sheet", defaultQty: 0 },
  { id: "deck_armor", label: "Deck armor", price: 75, unit: "per_sq", defaultQty: 0 },
  { id: "remove_chimney", label: "Remove chimney", price: 2500, unit: "flat", defaultQty: 1 },
  { id: "cricket_flashing", label: "Cricket / chimney flashing", price: 250, unit: "per_ea", defaultQty: 1 },
  { id: "ultimate_pipe_flashing", label: "Ultimate pipe flashing", price: 150, unit: "per_ea", defaultQty: 3 },
  { id: "stainless_flashing", label: "Stainless steel flashing (coast <5mi)", price: 155, unit: "per_ea", defaultQty: 1 },
  { id: "skylight_flashing", label: "Skylight flashing", price: 250, unit: "per_ea", defaultQty: 1 },
  { id: "custom_skylight", label: "Custom fixed skylight", price: 2400, unit: "per_ea", defaultQty: 1 },
  { id: "standard_skylight", label: "Standard fixed skylight (2x2 / 2x4 / 4x4)", price: 1200, unit: "per_ea", defaultQty: 1 },
  { id: "tg_wood", label: "T&G wood replacement", price: 10, unit: "per_ft", defaultQty: 0 },
  { id: "fascia_wood", label: "Fascia wood replacement", price: 19, unit: "per_ft", defaultQty: 0 },
  { id: "barge_rafter", label: "Barge / rafter wood replacement", price: 26, unit: "per_ft", defaultQty: 0 },
  { id: "golden_pledge", label: "Golden Pledge warranty", price: 1500, unit: "flat", defaultQty: 1 },
  { id: "solar_max", label: "SolarMax warranty", price: 4000, unit: "flat", defaultQty: 1 },
  { id: "roof_trip_fee", label: "Roof trip fee (60+ miles from city hall)", price: 250, unit: "flat", defaultQty: 1 },
];

export const OBSTRUCTION_BUFFER_PCT = 10; // +10% high end of the range for solar / obstructions / margin

export function unitLabel(unit: Accessory["unit"]): string {
  switch (unit) {
    case "flat": return "flat";
    case "per_sheet": return "/ sheet";
    case "per_sq": return "/ SQ";
    case "per_ft": return "/ ft";
    case "per_ea": return "/ ea";
  }
}

export interface PreliminaryEstimateInput {
  squares: number;
  shingleId: string | null;
  accessories: Record<string, number>; // id -> qty (0 = off)
  hasSolar: boolean;
  notes: string;
}

export interface EstimateBreakdown {
  shingleCost: number;
  accessoriesCost: number;
  base: number;
  low: number;  // raw
  high: number; // raw + buffer
  bufferPct: number;
}

export function computeEstimate(input: PreliminaryEstimateInput): EstimateBreakdown {
  const shingle = SHINGLE_LINES.find((s) => s.id === input.shingleId);
  const shingleCost = shingle ? shingle.pricePerSq * Math.max(0, input.squares) : 0;

  let accessoriesCost = 0;
  for (const acc of ACCESSORIES) {
    const qty = input.accessories[acc.id] ?? 0;
    if (qty > 0) accessoriesCost += acc.price * qty;
  }

  const base = shingleCost + accessoriesCost;
  // Solar always adds the buffer; for range mode we always show low + high.
  const bufferPct = OBSTRUCTION_BUFFER_PCT + (input.hasSolar ? OBSTRUCTION_BUFFER_PCT : 0);
  const low = base;
  const high = Math.round(base * (1 + bufferPct / 100));
  return { shingleCost, accessoriesCost, base, low, high, bufferPct };
}
