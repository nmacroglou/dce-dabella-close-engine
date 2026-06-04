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

export type RoofMaterial = "shingle" | "tile";

/* ---------- Per-product default "What's Included" sets ---------- */

const ROOF_SHINGLE: string[] = [
  "Golden Pledge® Lifetime Warranty",
  "GAF Master Elite® Installation",
  "Factory-Trained Certified Installers",
  "SolarMAX HD Reflective Shingles",
  "Full tear-off & system replacement",
  "Best long-term ROI",
];

const ROOF_TILE: string[] = [
  "Lifetime Tile System Warranty",
  "Factory-Trained Certified Tile Installers",
  "Premium underlayment full replacement",
  "Cool-Roof rated tile profile",
  "Bird-stop & weather seal package",
  "Best long-term ROI",
];

const WINDOWS: string[] = [
  "Lifetime transferable warranty",
  "Triple-pane Low-E + Argon glass",
  "Factory-Trained Certified Installers",
  "ENERGY STAR® Most Efficient",
  "Full-frame replacement & wrap",
  "Sound & UV reduction package",
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
): string[] {
  const list = products && products.length > 0 ? products : [];
  const has = (name: string) => list.some((p) => p.toLowerCase().includes(name.toLowerCase()));

  const buckets: string[][] = [];
  if (has("Roof")) buckets.push(roofMaterial === "tile" ? ROOF_TILE : ROOF_SHINGLE);
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
): { icon: LucideIcon; text: string }[] {
  const texts = customFeatures && customFeatures.length > 0
    ? customFeatures
    : getDefaultFeatureTexts(products, roofMaterial);
  return featuresFromTexts(texts);
}
