import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type {
  EngineState,
  ComputedValues,
  OptionComputed,
  EngineUpdater,
  EngineTabProps,
} from "@/types/engine";
import { WINDOW_INSPECTION_ITEMS, WINDOW_SCOPE_ITEMS } from "@/data/windowData";
import {
  OPTION_NAME_DEFAULTS,
  WINDOW_OPTION_NAME_DEFAULTS,
  SIDING_OPTION_NAME_DEFAULTS,
  BATH_OPTION_NAME_DEFAULTS,
  SOLAR_OPTION_NAME_DEFAULTS,
  ALL_DEFAULT_OPTION_NAMES,
} from "@/components/engine/presentation/constants";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import { useDeal, useUpdateDeal } from "@/hooks/useDeals";

export type { EngineState, ComputedValues, OptionComputed, EngineUpdater, EngineTabProps };

const initialState: EngineState = {
  homeowner1: "",
  homeowner2: "",
  products: ["Roofing System"],
  solarKw: "8",
  optionAName: "Timberline Energy Charcoal",
  optionBName: "Grand Sequoia Charcoal",
  optionCName: "Timberline American Harvest",
  gutterFeet: "100",
  downPayment: 0,
  priceA: 0,
  priceB: 0,
  priceC: 0,
  financingFactor1: 0.01074,
  financingFactor2: 0.015,
  creditScore: null,
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
  activeTab: "playbook",
  windowInspection: WINDOW_INSPECTION_ITEMS.map((label) => ({ label, status: "na" as const })),
  windowItems: [],
  windowScopeChecks: new Array(WINDOW_SCOPE_ITEMS.length).fill(false),
  roofMaterial: "shingle",
};

export function useCloseEngine() {
  const { activeDealId } = useActiveDeal();
  const { data: deal } = useDeal(activeDealId);
  const updateDeal = useUpdateDeal();

  const [state, setState] = useState<EngineState>(initialState);
  const hydratedDealIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate when active deal loads (only when the deal id changes)
  useEffect(() => {
    if (deal && deal.id !== hydratedDealIdRef.current) {
      const merged: EngineState = {
        ...initialState,
        ...(deal.engine_state as Partial<EngineState>),
        homeowner1: deal.homeowner1 ?? initialState.homeowner1,
        homeowner2: deal.homeowner2 ?? initialState.homeowner2,
      };
      setState(merged);
      hydratedDealIdRef.current = deal.id;
    }
    // When unloading the active deal, reset to initial state
    if (!activeDealId && hydratedDealIdRef.current) {
      hydratedDealIdRef.current = null;
      setState(initialState);
    }
  }, [deal, activeDealId]);

  const update: EngineUpdater = useCallback((key, value) => {
    setState((prev) => {
      const next = { ...prev, [key]: value } as EngineState;

      // When roof material switches to tile/tpo and prices are empty,
      // prepopulate from the last-ask remembered for that material.
      if (key === "roofMaterial" && (value === "tile" || value === "tpo")) {
        if (!next.priceA && !next.priceB && !next.priceC) {
          try {
            const raw = localStorage.getItem(`dce:lastAsk:${value}`);
            if (raw) {
              const r = JSON.parse(raw) as { A?: number; B?: number; C?: number };
              next.priceA = r.A ?? 0;
              next.priceB = r.B ?? 0;
              next.priceC = r.C ?? 0;
            }
          } catch { /* ignore */ }
        }
      }

      // Remember the last-ask whenever a price is edited for tile/tpo.
      if ((key === "priceA" || key === "priceB" || key === "priceC") &&
          (next.roofMaterial === "tile" || next.roofMaterial === "tpo")) {
        try {
          localStorage.setItem(
            `dce:lastAsk:${next.roofMaterial}`,
            JSON.stringify({ A: next.priceA, B: next.priceB, C: next.priceC })
          );
        } catch { /* ignore */ }
      }

      // When products change, auto-swap option names to match the primary product
      // (only if the existing names are untouched defaults).
      if (key === "products") {
        const prods = (value as string[]) || [];
        const hasRoof = prods.some((p) => p.toLowerCase().includes("roof"));
        const hasWindows = prods.some((p) => p.toLowerCase().includes("window"));
        const hasSiding = prods.some((p) => p.toLowerCase().includes("siding"));
        const hasBath = prods.some((p) => p.toLowerCase().includes("bath"));
        let defaults: { A: string; B: string; C: string } | null = null;
        if (hasRoof) {
          defaults = OPTION_NAME_DEFAULTS[next.roofMaterial ?? "shingle"];
        } else if (hasWindows) {
          defaults = WINDOW_OPTION_NAME_DEFAULTS;
        } else if (hasSiding) {
          defaults = SIDING_OPTION_NAME_DEFAULTS;
        } else if (hasBath) {
          defaults = BATH_OPTION_NAME_DEFAULTS;
        }
        if (defaults) {
          if (!next.optionAName || ALL_DEFAULT_OPTION_NAMES.has(next.optionAName)) next.optionAName = defaults.A;
          if (!next.optionBName || ALL_DEFAULT_OPTION_NAMES.has(next.optionBName)) next.optionBName = defaults.B;
          if (!next.optionCName || ALL_DEFAULT_OPTION_NAMES.has(next.optionCName)) next.optionCName = defaults.C;
        }
      }

      return next;
    });
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  // Debounced auto-save to active deal
  useEffect(() => {
    if (!activeDealId || hydratedDealIdRef.current !== activeDealId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateDeal.mutate({
        id: activeDealId,
        updates: {
          homeowner1: state.homeowner1,
          homeowner2: state.homeowner2,
          products: state.products,
          price_a: state.priceA,
          price_b: state.priceB,
          price_c: state.priceC,
          selected_option: state.selectedOption,
          engine_state: state,
        },
      });
    }, 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, activeDealId]);

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
    const inflationMultiplier = Math.pow(1.08, 10);
    const inflationPenalty = Math.round(priceA * (inflationMultiplier - 1));
    const lockedInSavings = inflationPenalty;
    const moveForwardImpact = optA.roiValue + energySavings + lockedInSavings;
    const doNothingImpact = -(energySavings + inflationPenalty);
    const netDifference = moveForwardImpact - doNothingImpact;

    const selectedPrice =
      state.selectedOption === "A" ? priceA :
      state.selectedOption === "B" ? priceB :
      state.selectedOption === "C" ? priceC : 0;

    return {
      options,
      annualCost, tenYearCost, energySavings,
      moveForwardImpact, doNothingImpact, netDifference, selectedPrice,
      inflationPenalty, lockedInSavings,
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

  return { state, update, computed, coachingTip, reset };
}
