import type { EngineState, ComputedValues } from "@/types/engine";

/** Parse a string to number, defaulting to 0 */
export const parseNum = (v: string): number => parseFloat(v) || 0;

/** Build the options array used by Presentation & Customer views */
export function buildOptionsArray(state: EngineState, computed: ComputedValues) {
  // Sources price from `computed.options[key].price` (not raw state.priceX) so any
  // discount applied via applyDiscountToComputed flows through to consumers like
  // the PDF export, share dialog, and customer-facing presentation.
  return [
    { key: "A" as const, name: state.optionAName, price: computed.options.A.price, monthly: computed.options.A.monthly },
    { key: "B" as const, name: state.optionBName, price: computed.options.B.price, monthly: computed.options.B.monthly },
    { key: "C" as const, name: state.optionCName, price: computed.options.C.price, monthly: computed.options.C.monthly },
  ];
}

export type OptionSummary = ReturnType<typeof buildOptionsArray>[number];

/** Get the display name for an option key */
export function getOptionLabel(key: "A" | "B" | "C", state: EngineState) {
  if (key === "A") return state.optionAName;
  if (key === "B") return state.optionBName;
  return state.optionCName;
}

/** Compute financial metrics for a given option (T-Close & Impact panels) */
export function getOptionMetrics(key: "A" | "B" | "C", computed: ComputedValues) {
  const opt = computed.options[key];
  const inflationMultiplier = Math.pow(1.08, 10);
  const inflationPenalty = Math.round(opt.price * (inflationMultiplier - 1));
  const lockedInSavings = inflationPenalty;
  const moveForward = opt.roiValue + computed.energySavings + lockedInSavings;
  const doNothing = -(computed.energySavings + inflationPenalty);
  const netDiff = moveForward - doNothing;
  return { price: opt.price, roi: opt.roiValue, inflationPenalty, lockedInSavings, moveForward, doNothing, netDiff };
}

export type OptionMetrics = ReturnType<typeof getOptionMetrics>;

/** Homeowner display name */
export function getNames(state: EngineState) {
  return state.homeowner2 ? `${state.homeowner1} & ${state.homeowner2}` : state.homeowner1;
}

export const OPTION_KEYS: readonly ("A" | "B" | "C")[] = ["A", "B", "C"] as const;

/** Format selected products as a display label */
export function getProductLabel(products: string[]): string {
  if (products.length === 0) return "Home Improvement";
  if (products.length === 1) return products[0];
  if (products.length === 2) return products.join(" & ");
  return `${products.slice(0, -1).join(", ")} & ${products[products.length - 1]}`;
}

/** Check if a product is in the selected products array */
export function hasProduct(products: string[], product: string): boolean {
  return products.includes(product);
}

/** Apply a percentage discount across all option prices in a ComputedValues snapshot. */
export function applyDiscountToComputed(computed: ComputedValues, pct: number): ComputedValues {
  if (!pct) return computed;
  const f = 1 - pct / 100;
  const scale = (n: number) => Math.round(n * f);
  const scaleOpt = (o: ComputedValues["options"]["A"]): ComputedValues["options"]["A"] => ({
    price: scale(o.price),
    monthly: scale(o.monthly),
    efficiencyPrice: scale(o.efficiencyPrice),
    standbyPrice: scale(o.standbyPrice),
    deferred6Price: scale(o.deferred6Price),
    deferred12Price: scale(o.deferred12Price),
    monthlyEfficiency: scale(o.monthlyEfficiency),
    monthlyStandby: scale(o.monthlyStandby),
    monthlyDeferred6: scale(o.monthlyDeferred6),
    monthlyDeferred12: scale(o.monthlyDeferred12),
    roiValue: scale(o.roiValue),
    netCost: scale(o.price) - scale(o.roiValue) - computed.energySavings,
  });
  return {
    ...computed,
    options: { A: scaleOpt(computed.options.A), B: scaleOpt(computed.options.B), C: scaleOpt(computed.options.C) },
    selectedPrice: scale(computed.selectedPrice),
  };
}

