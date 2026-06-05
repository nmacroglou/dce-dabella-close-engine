import { Shield, Zap, Home, Star, Award, TrendingUp, Wind, Droplets, Sun, Hammer, ThermometerSun, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface OptionTheme {
  gradient: string;
  badge: string;
  badgeColor: string;
  ring: string;
  accent: string;
  bgAccent: string;
  borderAccent: string;
}

export const OPTION_THEMES: Record<"A" | "B" | "C", OptionTheme> = {
  A: {
    gradient: "from-primary to-primary/80",
    badge: "Best Value",
    badgeColor: "bg-primary text-primary-foreground",
    ring: "ring-primary",
    accent: "text-primary",
    bgAccent: "bg-primary/5",
    borderAccent: "border-primary/20",
  },
  B: {
    gradient: "from-accent to-accent/80",
    badge: "Most Popular",
    badgeColor: "bg-accent text-accent-foreground",
    ring: "ring-accent",
    accent: "text-accent",
    bgAccent: "bg-accent/5",
    borderAccent: "border-accent/20",
  },
  C: {
    gradient: "from-warning to-warning/80",
    badge: "Smart Start",
    badgeColor: "bg-warning text-warning-foreground",
    ring: "ring-warning",
    accent: "text-foreground",
    bgAccent: "bg-warning/5",
    borderAccent: "border-warning/20",
  },
};

export type RoofMaterial = "shingle" | "tile" | "tpo";

/** Default option names per roof material — used when the user switches material. */
export const OPTION_NAME_DEFAULTS: Record<RoofMaterial, { A: string; B: string; C: string }> = {
  shingle: {
    A: "Timberline Energy Charcoal",
    B: "Grand Sequoia Charcoal",
    C: "Timberline American Harvest",
  },
  tile: {
    A: "Westlake Royal Therma Series",
    B: "Westlake Royal Cool Series",
    C: "Westlake Royal Standard Roof",
  },
  tpo: {
    A: "GAF EverGuard TPO Premium",
    B: "GAF EverGuard TPO Performance",
    C: "GAF EverGuard TPO Essential",
  },
};

/** Default option names when Windows is the primary product. */
export const WINDOW_OPTION_NAME_DEFAULTS: { A: string; B: string; C: string } = {
  A: "Glasswing Triple Pane with Krypton",
  B: "Glasswing Double Pane with Krypton",
  C: "Fairfield Double Pane with Argon",
};

/** All known default option names — used to detect "untouched" names safely. */
export const ALL_DEFAULT_OPTION_NAMES: Set<string> = new Set([
  ...Object.values(OPTION_NAME_DEFAULTS).flatMap((d) => [d.A, d.B, d.C]),
  WINDOW_OPTION_NAME_DEFAULTS.A,
  WINDOW_OPTION_NAME_DEFAULTS.B,
  WINDOW_OPTION_NAME_DEFAULTS.C,
]);

/* ---------- Per-product default "What's Included" sets ---------- */

const ROOF_SHINGLE: string[] = [
  "Golden Pledge® Lifetime Warranty",
  "GAF Master Elite® Installation",
  "Factory-Trained Certified Installers",
  "SolarMAX HD Reflective Shingles",
  "Full tear-off & system replacement",
  "Best long-term ROI",
];

const ROOF_TILE_A: string[] = [
  "Westlake Royal Roof Tile",
  "TileSeal HT Underlayment System",
  "Vented Eave Riser",
  "Elevated Batten System",
  "Zephyr Roll Ridge Ventilation",
  "Vented Elevated Ridge System",
  "Bird Stop & Weather Seal Package",
  "Up to 22% Greater Energy Efficiency",
  "Cool Roof Rated Tile Profile",
  "Lifetime System Warranty",
  "Factory-Certified Tile Installers",
  "Best Long-Term ROI",
];

const ROOF_TILE_B: string[] = [
  "Westlake Royal Roof Tile",
  "TileSeal HT Underlayment System",
  "Elevated Batten System",
  "Zephyr Roll Ridge Ventilation",
  "Bird Stop Protection",
  "Up to 22% Greater Energy Efficiency",
  "Cool Roof Rated Tile Profile",
  "Lifetime System Warranty",
  "Factory-Certified Tile Installers",
  "Exceptional Long-Term Value",
];

const ROOF_TILE_C: string[] = [
  "Westlake Royal Roof Tile",
  "Premium Underlayment Replacement",
  "Standard Batten System",
  "Ridge Replacement",
  "Professional Installation",
  "Manufacturer Warranty",
  "Reliable Weather Protection",
];

const ROOF_TPO_A: string[] = [
  "GAF EverGuard TPO 80-mil Membrane",
  "High-Performance Cover Board",
  "Fully Adhered Flashing System",
  "Reinforced Seam Welding",
  "Tapered Insulation for Positive Drainage",
  "ENERGY STAR® Cool Roof Rated",
  "30-Year Manufacturer System Warranty",
  "Factory-Certified Commercial Installers",
  "Best Long-Term ROI",
];

const ROOF_TPO_B: string[] = [
  "GAF EverGuard TPO 60-mil Membrane",
  "Cover Board Protection",
  "Mechanically Attached System",
  "Reinforced Seam Welding",
  "ENERGY STAR® Cool Roof Rated",
  "25-Year Manufacturer System Warranty",
  "Factory-Certified Commercial Installers",
  "Exceptional Long-Term Value",
];

const ROOF_TPO_C: string[] = [
  "GAF EverGuard TPO 45-mil Membrane",
  "Standard Insulation Replacement",
  "Mechanically Attached System",
  "Heat-Welded Seams",
  "Professional Installation",
  "Manufacturer Warranty",
  "Reliable Weather Protection",
];

const WINDOWS: string[] = [
  "Lifetime transferable warranty",
  "Triple-pane Low-E + Argon glass",
  "Factory-Trained Certified Installers",
  "ENERGY STAR® Most Efficient",
  "Full-frame replacement & wrap",
  "Sound & UV reduction package",
];

const WINDOWS_A: string[] = [
  "Glasswing Triple-Pane with Krypton Gas",
  "Premium Low-E³ Glass Coating",
  "Foam-Filled Reinforced Frames",
  "Lifetime Transferable Warranty",
  "ENERGY STAR® Most Efficient",
  "Full-Frame Replacement & Exterior Wrap",
  "Maximum Sound & UV Reduction",
  "Factory-Trained Certified Installers",
  "Best Long-Term ROI",
];

const WINDOWS_B: string[] = [
  "Glasswing Double-Pane with Krypton Gas",
  "Low-E³ Glass Coating",
  "Foam-Filled Frames",
  "Lifetime Transferable Warranty",
  "ENERGY STAR® Qualified",
  "Full-Frame Replacement & Exterior Wrap",
  "Enhanced Sound & UV Reduction",
  "Factory-Trained Certified Installers",
];

const WINDOWS_C: string[] = [
  "Fairfield Double-Pane with Argon Gas",
  "Low-E Glass Coating",
  "Reinforced Vinyl Frames",
  "Limited Lifetime Warranty",
  "ENERGY STAR® Qualified",
  "Professional Installation",
  "Reliable Weather Protection",
];

const SIDING: string[] = [
  "Lifetime fade & hail warranty",
  "Insulated siding system",
  "Factory-Trained Certified Installers",
  "House-wrap moisture barrier",
  "Color-match guarantee",
  "Best long-term ROI",
];

const BATH: string[] = [
  "Lifetime tub & surround warranty",
  "One-day professional installation",
  "Factory-Trained Certified Installers",
  "Microban® antimicrobial protection",
  "ADA-compliant safety options",
  "Premium fixture package",
];

const GUTTERS: string[] = [
  "Lifetime gutter-guard warranty",
  "Seamless aluminum gutters",
  "Factory-Trained Certified Installers",
  "Leaf-free clog protection",
  "Reinforced hidden hangers",
  "Best long-term ROI",
];

const SOLAR: string[] = [
  "25-year panel performance warranty",
  "Factory-Trained Certified Installers",
  "Energy production guarantee",
  "Battery-ready inverter",
  "Net-metering ready",
  "SolarMAX monitoring app",
];

const SHARED_FALLBACK: string[] = [
  "Golden Pledge® Lifetime Warranty",
  "Factory-Trained Certified Installers",
  "SolarMAX Warranty Protection",
  "GAF Master Elite® Installation",
  "Full system replacement",
  "Best long-term ROI",
];

export const DEFAULT_FEATURE_TEXTS: string[] = SHARED_FALLBACK;

/** Compute the default "What's Included" bullets based on products + roof material. */
export function getDefaultFeatureTexts(
  products: string[] | undefined,
  roofMaterial: RoofMaterial | undefined,
  optKey?: "A" | "B" | "C",
): string[] {
  const list = products && products.length > 0 ? products : [];
  const has = (name: string) => list.some((p) => p.toLowerCase().includes(name.toLowerCase()));

  // Tile roof: per-option lists
  if (has("Roof") && roofMaterial === "tile" && optKey) {
    if (optKey === "A") return ROOF_TILE_A.slice();
    if (optKey === "B") return ROOF_TILE_B.slice();
    return ROOF_TILE_C.slice();
  }

  // TPO flat roof: per-option lists
  if (has("Roof") && roofMaterial === "tpo" && optKey) {
    if (optKey === "A") return ROOF_TPO_A.slice();
    if (optKey === "B") return ROOF_TPO_B.slice();
    return ROOF_TPO_C.slice();
  }

  // Windows as primary product (no Roof): per-option lists
  if (!has("Roof") && has("Window") && optKey) {
    if (optKey === "A") return WINDOWS_A.slice();
    if (optKey === "B") return WINDOWS_B.slice();
    return WINDOWS_C.slice();
  }

  const buckets: string[][] = [];
  if (has("Roof")) {
    buckets.push(
      roofMaterial === "tile" ? ROOF_TILE_A :
      roofMaterial === "tpo" ? ROOF_TPO_A :
      ROOF_SHINGLE
    );
  }
  if (has("Window")) buckets.push(WINDOWS);
  if (has("Siding")) buckets.push(SIDING);
  if (has("Bath")) buckets.push(BATH);
  if (has("Gutter")) buckets.push(GUTTERS);
  if (has("Solar")) buckets.push(SOLAR);

  if (buckets.length === 0) return SHARED_FALLBACK.slice();

  // Single product: return its full list
  if (buckets.length === 1) return buckets[0].slice();

  // Multi-product: interleave top bullets from each, dedupe, cap at 8
  const merged: string[] = [];
  const seen = new Set<string>();
  const maxLen = Math.max(...buckets.map((b) => b.length));
  for (let i = 0; i < maxLen && merged.length < 8; i++) {
    for (const b of buckets) {
      if (merged.length >= 8) break;
      const item = b[i];
      if (!item) continue;
      const key = item.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

const ICON_CYCLE: LucideIcon[] = [Shield, Award, Zap, Star, Home, TrendingUp, Wind, Droplets, Sun, Hammer, ThermometerSun, Sparkles];

export function featuresFromTexts(texts: string[]): { icon: LucideIcon; text: string }[] {
  return texts.map((text, i) => ({ icon: ICON_CYCLE[i % ICON_CYCLE.length], text }));
}

/** Backwards-compat: previous code imported FEATURES_BY_OPTION as a static map. */
export const FEATURES_BY_OPTION: Record<string, { icon: LucideIcon; text: string }[]> = {
  A: featuresFromTexts(SHARED_FALLBACK),
  B: featuresFromTexts(SHARED_FALLBACK),
  C: featuresFromTexts(SHARED_FALLBACK),
};

/** Preferred helper: compute icon+text feature list for a given option. */
export function getFeaturesForOption(
  products: string[] | undefined,
  roofMaterial: RoofMaterial | undefined,
  customFeatures: string[] | undefined,
  optKey: "A" | "B" | "C",
): { icon: LucideIcon; text: string }[] {
  const texts = customFeatures && customFeatures.length > 0
    ? customFeatures
    : getDefaultFeatureTexts(products, roofMaterial, optKey);
  return featuresFromTexts(texts);
}
