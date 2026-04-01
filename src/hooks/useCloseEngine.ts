import { useState, useCallback, useMemo } from "react";

export interface EngineState {
  homeowner1: string;
  homeowner2: string;
  product: string;
  solarKw: string;
  optionAName: string;
  optionBName: string;
  optionCName: string;
  gutterFeet: string;
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
}

export interface ComputedValues {
  efficiencyPrice: number;
  standbyPrice: number;
  deferred6Price: number;
  deferred12Price: number;
  monthlyA: number;
  monthlyB: number;
  monthlyC: number;
  monthlyEfficiency: number;
  monthlyStandby: number;
  monthlyDeferred6: number;
  monthlyDeferred12: number;
  roiValue: number;
  annualCost: number;
  tenYearCost: number;
  energySavings: number;
  moveForwardImpact: number;
  doNothingImpact: number;
  netDifference: number;
  yesNetCost: number;
  selectedPrice: number;
}

export type EngineUpdater = <K extends keyof EngineState>(key: K, value: EngineState[K]) => void;

/** Common props passed to every engine tab */
export interface EngineTabProps {
  state: EngineState;
  computed: ComputedValues;
  update: EngineUpdater;
}

const initialState: EngineState = {
  homeowner1: "John",
  homeowner2: "Mary",
  product: "Roofing System",
  solarKw: "8",
  optionAName: "Timberline Energy Charcoal",
  optionBName: "Grand Sequoia Charcoal",
  optionCName: "Timberline American Harvest",
  gutterFeet: "100",
  priceA: 158832,
  priceB: 68678,
  priceC: 43399,
  financingFactor1: 0.01074,
  financingFactor2: 0.015,
  efficiencyDiscount: 2170,
  standbyDiscount: 2170,
  deferred6Pct: 5,
  deferred12Pct: 10,
  roiPercent: 67,
  monthlyBill: 300,
  energySavingsPct: 75,
  currentStage: "calculator",
  selectedOption: null,
  objectionType: null,
  priceShown: false,
  activeTab: "calculator",
};

export function useCloseEngine() {
  const [state, setState] = useState<EngineState>(initialState);

  const update: EngineUpdater = useCallback((key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const computed = useMemo((): ComputedValues => {
    const {
      priceA, priceB, priceC, roiPercent, monthlyBill,
      financingFactor1, financingFactor2,
      efficiencyDiscount, standbyDiscount,
      deferred6Pct, deferred12Pct, energySavingsPct,
    } = state;

    const efficiencyPrice = priceC - efficiencyDiscount;
    const standbyPrice = priceC - standbyDiscount;
    const deferred6Price = priceC * (1 - deferred6Pct / 100);
    const deferred12Price = priceC * (1 - deferred12Pct / 100);

    const monthlyA = Math.round(priceA * financingFactor2);
    const monthlyB = Math.round(priceB * financingFactor2);
    const monthlyC = Math.round(priceC * financingFactor2);
    const monthlyEfficiency = Math.round(efficiencyPrice * financingFactor2);
    const monthlyStandby = Math.round(standbyPrice * financingFactor2);
    const monthlyDeferred6 = Math.round(deferred6Price * financingFactor2);
    const monthlyDeferred12 = Math.round(deferred12Price * financingFactor2);

    const roiValue = Math.round(priceA * (roiPercent / 100));

    const annualCost = monthlyBill * 12;
    const tenYearCost = annualCost * 10;
    const energySavings = Math.round(tenYearCost * (energySavingsPct / 100));

    const moveForwardImpact = roiValue + energySavings;
    const doNothingImpact = -energySavings;
    const netDifference = moveForwardImpact - doNothingImpact;
    const yesNetCost = priceA - roiValue - energySavings;

    const selectedPrice =
      state.selectedOption === "A" ? priceA :
      state.selectedOption === "B" ? priceB :
      state.selectedOption === "C" ? priceC : 0;

    return {
      efficiencyPrice, standbyPrice, deferred6Price, deferred12Price,
      monthlyA, monthlyB, monthlyC,
      monthlyEfficiency, monthlyStandby, monthlyDeferred6, monthlyDeferred12,
      roiValue, annualCost, tenYearCost, energySavings,
      moveForwardImpact, doNothingImpact, netDifference, yesNetCost,
      selectedPrice,
    };
  }, [state]);

  const coachingTip = useMemo(() => {
    if (state.priceShown) return "Be silent. Let them react.";
    if (state.currentStage === "presentation") return "Ask them to eliminate one option.";
    if (state.objectionType === "price") return "Route to Efficiency → T-Close.";
    if (state.objectionType === "value") return "Route to ROI → Energy Close.";
    if (state.objectionType === "timing") return "Test timing truthfully. Efficiency or deferral.";
    if (state.objectionType === "trust") return "Slow down. Replay inspection. Rebuild trust.";
    if (state.currentStage === "closing") return "Always ask for the sale.";
    return "Build value before showing price.";
  }, [state.priceShown, state.currentStage, state.objectionType]);

  return { state, update, computed, coachingTip };
}
