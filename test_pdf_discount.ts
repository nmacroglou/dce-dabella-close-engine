import { buildCustomerPdf } from "./src/lib/pdf/build";
import type { EngineState, ComputedValues } from "./src/types/engine";

const state: EngineState = {
  homeowner1: "John Smith",
  homeowner2: "",
  products: ["Roofing System"],
  solarKw: "0",
  optionAName: "Golden Pledge",
  optionBName: "Most Popular",
  optionCName: "Smart Start",
  gutterFeet: "0",
  downPayment: 1000,
  priceA: 20000,
  priceB: 15000,
  priceC: 10000,
  financingFactor1: 0.008,
  financingFactor2: 0.009,
  creditScore: 700,
  efficiencyDiscount: 1000,
  standbyDiscount: 0,
  deferred6Pct: 0,
  deferred12Pct: 0,
  roiPercent: 70,
  monthlyBill: 200,
  energySavingsPct: 30,
  currentStage: "options",
  selectedOption: "A",
  objectionType: null,
  priceShown: true,
  activeTab: "presentation",
  windowInspection: [],
  windowItems: [],
  windowScopeChecks: [],
};

const computed: ComputedValues = {
  options: {
    A: { price: 18000, monthly: 162, efficiencyPrice: 19000, standbyPrice: 20000, deferred6Price: 18000, deferred12Price: 18000, monthlyEfficiency: 171, monthlyStandby: 180, monthlyDeferred6: 162, monthlyDeferred12: 162, roiValue: 14000, netCost: -3200 },
    B: { price: 13500, monthly: 122, efficiencyPrice: 14250, standbyPrice: 15000, deferred6Price: 13500, deferred12Price: 13500, monthlyEfficiency: 129, monthlyStandby: 135, monthlyDeferred6: 122, monthlyDeferred12: 122, roiValue: 10500, netCost: -4200 },
    C: { price: 9000, monthly: 81, efficiencyPrice: 9500, standbyPrice: 10000, deferred6Price: 9000, deferred12Price: 9000, monthlyEfficiency: 86, monthlyStandby: 90, monthlyDeferred6: 81, monthlyDeferred12: 81, roiValue: 7000, netCost: -5200 },
  },
  annualCost: 2400,
  tenYearCost: 24000,
  energySavings: 7200,
  moveForwardImpact: 21200,
  doNothingImpact: -31200,
  netDifference: 52400,
  inflationPenalty: 6000,
  lockedInSavings: 6000,
  selectedPrice: 18000,
};

const originalComputed: ComputedValues = {
  ...computed,
  options: {
    A: { ...computed.options.A, price: 20000 },
    B: { ...computed.options.B, price: 15000 },
    C: { ...computed.options.C, price: 10000 },
  },
  selectedPrice: 20000,
};

const options = [
  { key: "A" as const, name: "Golden Pledge", price: 18000, monthly: 162 },
  { key: "B" as const, name: "Most Popular", price: 13500, monthly: 122 },
  { key: "C" as const, name: "Smart Start", price: 9000, monthly: 81 },
];

async function main() {
  const { blob } = await buildCustomerPdf(state, computed, options, "A", { debug: false }, originalComputed);
  const buffer = Buffer.from(await blob.arrayBuffer());
  require("fs").writeFileSync("/tmp/test-proposal.pdf", buffer);
  console.log("PDF written to /tmp/test-proposal.pdf", buffer.length, "bytes");
}

main().catch(console.error);
