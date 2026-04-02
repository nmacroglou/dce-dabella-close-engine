import type { EngineState, ComputedValues } from "@/types/engine";

/** Parse a string to number, defaulting to 0 */
export const parseNum = (v: string): number => parseFloat(v) || 0;

/** Build the options array used by Presentation & Customer views */
export function buildOptionsArray(state: EngineState, computed: ComputedValues) {
  return [
    { key: "A" as const, name: state.optionAName, price: state.priceA, monthly: computed.options.A.monthly },
    { key: "B" as const, name: state.optionBName, price: state.priceB, monthly: computed.options.B.monthly },
    { key: "C" as const, name: state.optionCName, price: state.priceC, monthly: computed.options.C.monthly },
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
