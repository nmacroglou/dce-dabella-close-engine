import { useState, useCallback, useMemo } from "react";
import type {
  EngineState,
  ComputedValues,
  OptionComputed,
  EngineUpdater,
  EngineTabProps,
} from "@/types/engine";

// Re-export all types for backward compatibility
export type { EngineState, ComputedValues, OptionComputed, EngineUpdater, EngineTabProps };

const initialState: EngineState = {
  homeowner1: "John",
  homeowner2: "Mary",
  product: "Roofing System",
  solarKw: "8",
  optionAName: "Timberline Energy Charcoal",
  optionBName: "Grand Sequoia Charcoal",
  optionCName: "Timberline American Harvest",
  gutterFeet: "100",
  downPayment: 0,
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

  const reset = useCallback(() => setState(initialState), []);

  const computed = useMemo((): ComputedValues => {
    const {
      priceA, priceB, priceC, roiPercent, monthlyBill,
      financingFactor2, downPayment,
      efficiencyDiscount, standbyDiscount,
      deferred6Pct, deferred12Pct, energySavingsPct,
    } = state;

    const annualCost = monthlyBill * 12;
    const tenYearCost = annualCost * 10;
    const energySavings = Math.round(tenYearCost * (energySavingsPct / 100));

    const buildOption = (price: number): OptionComputed => {
      const financed = price - downPayment;
      const effP = price - efficiencyDiscount;
      const stbP = price - standbyDiscount;
      const d6P = price * (1 - deferred6Pct / 100);
      const d12P = price * (1 - deferred12Pct / 100);
      const roi = Math.round(price * (roiPercent / 100));
      return {
        price,
        monthly: Math.round(financed * financingFactor2),
        efficiencyPrice: effP,
        standbyPrice: stbP,
        deferred6Price: d6P,
        deferred12Price: d12P,
        monthlyEfficiency: Math.round((effP - downPayment) * financingFactor2),
        monthlyStandby: Math.round((stbP - downPayment) * financingFactor2),
        monthlyDeferred6: Math.round((d6P - downPayment) * financingFactor2),
        monthlyDeferred12: Math.round((d12P - downPayment) * financingFactor2),
        roiValue: roi,
        netCost: price - roi - energySavings,
      };
    };

    const options = {
      A: buildOption(priceA),
      B: buildOption(priceB),
      C: buildOption(priceC),
    };

    const optA = options.A;
    const roiValue = optA.roiValue;
    // 8% annual inflation on roofing materials over 10 years
    const inflationMultiplier = Math.pow(1.08, 10); // ~2.159
    const inflationPenalty = Math.round(priceA * (inflationMultiplier - 1));
    const lockedInSavings = inflationPenalty; // locking in today's price saves this
    const moveForwardImpact = roiValue + energySavings + lockedInSavings;
    const doNothingImpact = -(energySavings + inflationPenalty);
    const netDifference = moveForwardImpact - doNothingImpact;
    const yesNetCost = priceA - roiValue - energySavings;

    const selectedPrice =
      state.selectedOption === "A" ? priceA :
      state.selectedOption === "B" ? priceB :
      state.selectedOption === "C" ? priceC : 0;

    return {
      options,
      annualCost, tenYearCost, energySavings,
      moveForwardImpact, doNothingImpact, netDifference, selectedPrice,
      inflationPenalty, lockedInSavings,
      efficiencyPrice: options.C.efficiencyPrice,
      standbyPrice: options.C.standbyPrice,
      deferred6Price: options.C.deferred6Price,
      deferred12Price: options.C.deferred12Price,
      monthlyA: options.A.monthly,
      monthlyB: options.B.monthly,
      monthlyC: options.C.monthly,
      monthlyEfficiency: options.C.monthlyEfficiency,
      monthlyStandby: options.C.monthlyStandby,
      monthlyDeferred6: options.C.monthlyDeferred6,
      monthlyDeferred12: options.C.monthlyDeferred12,
      roiValue,
      yesNetCost,
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
