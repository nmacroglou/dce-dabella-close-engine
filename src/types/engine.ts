import type { WindowLineItem, WindowInspectionEntry } from "@/data/windowData";

export interface EngineState {
  homeowner1: string;
  homeowner2: string;
  products: string[];
  solarKw: string;
  optionAName: string;
  optionBName: string;
  optionCName: string;
  gutterFeet: string;
  downPayment: number;
  priceA: number;
  priceB: number;
  priceC: number;
  financingFactor1: number;
  financingFactor2: number;
  efficiencyDiscount: number;
  standbyDiscount: number;
  deferred6Pct: number;
  deferred12Pct: number;
  roiPercent: number;
  monthlyBill: number;
  energySavingsPct: number;
  currentStage: string;
  selectedOption: "A" | "B" | "C" | null;
  objectionType: string | null;
  priceShown: boolean;
  activeTab: string;
  windowInspection: WindowInspectionEntry[];
  windowItems: WindowLineItem[];
  windowScopeChecks: boolean[];
}

export interface OptionComputed {
  price: number;
  monthly: number;
  efficiencyPrice: number;
  standbyPrice: number;
  deferred6Price: number;
  deferred12Price: number;
  monthlyEfficiency: number;
  monthlyStandby: number;
  monthlyDeferred6: number;
  monthlyDeferred12: number;
  roiValue: number;
  netCost: number;
}

export interface ComputedValues {
  options: Record<"A" | "B" | "C", OptionComputed>;
  annualCost: number;
  tenYearCost: number;
  energySavings: number;
  moveForwardImpact: number;
  doNothingImpact: number;
  netDifference: number;
  inflationPenalty: number;
  lockedInSavings: number;
  selectedPrice: number;
}

export type EngineUpdater = <K extends keyof EngineState>(key: K, value: EngineState[K]) => void;

/** Common props passed to every engine tab */
export interface EngineTabProps {
  state: EngineState;
  computed: ComputedValues;
  update: EngineUpdater;
  reset?: () => void;
}
