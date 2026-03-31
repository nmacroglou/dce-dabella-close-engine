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
  roiPercent: number;
  monthlyBill: number;
  currentStage: string;
  selectedOption: "A" | "B" | "C" | null;
  objectionType: string | null;
  priceShown: boolean;
  activeTab: string;
}

const initialState: EngineState = {
  homeowner1: "",
  homeowner2: "",
  product: "Windows",
  solarKw: "",
  optionAName: "Premium Package",
  optionBName: "Standard Package",
  optionCName: "Efficiency Package",
  gutterFeet: "",
  priceA: 25000,
  priceB: 20000,
  priceC: 18000,
  financingFactor1: 1.15,
  financingFactor2: 1.25,
  roiPercent: 57,
  monthlyBill: 200,
  currentStage: "calculator",
  selectedOption: null,
  objectionType: null,
  priceShown: false,
  activeTab: "calculator",
};

export function useCloseEngine() {
  const [state, setState] = useState<EngineState>(initialState);

  const update = useCallback(<K extends keyof EngineState>(key: K, value: EngineState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const computed = useMemo(() => {
    const { priceA, priceB, priceC, roiPercent, monthlyBill, financingFactor1, financingFactor2 } = state;

    const efficiencyPrice = priceC * 0.9;
    const standbyPrice = priceC * 0.85;
    const deferred6 = priceC * financingFactor1;
    const deferred12 = priceC * financingFactor2;

    const roiValue = (priceA * roiPercent) / 100;

    const annualCost = monthlyBill * 12;
    const tenYearCost = annualCost * 10;
    const savings75 = tenYearCost * 0.75;

    const monthlyA = priceA * financingFactor1 / 120;
    const monthlyB = priceB * financingFactor1 / 120;
    const monthlyC = priceC * financingFactor1 / 120;

    const selectedPrice =
      state.selectedOption === "A" ? priceA :
      state.selectedOption === "B" ? priceB :
      state.selectedOption === "C" ? priceC : 0;

    const netDifference = roiValue + savings75;

    return {
      efficiencyPrice,
      standbyPrice,
      deferred6,
      deferred12,
      roiValue,
      annualCost,
      tenYearCost,
      savings75,
      monthlyA,
      monthlyB,
      monthlyC,
      selectedPrice,
      netDifference,
    };
  }, [state]);

  const coachingTip = useMemo(() => {
    if (state.priceShown) return "Be silent. Let them react.";
    if (state.currentStage === "presentation") return "Ask them to eliminate one option.";
    if (state.objectionType === "price") return "Route to Efficiency → T-Close.";
    if (state.objectionType === "value") return "Route to ROI → Energy Close.";
    if (state.objectionType === "think") return "Create urgency. Use the timeline.";
    if (state.objectionType === "spouse") return "Involve both decision-makers. Use permission close.";
    if (state.currentStage === "closing") return "Always ask for the sale.";
    return "Build value before showing price.";
  }, [state.priceShown, state.currentStage, state.objectionType]);

  return { state, update, computed, coachingTip };
}
