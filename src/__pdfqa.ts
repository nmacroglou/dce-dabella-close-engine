/* QA-only: renders every PDF export with sample data so we can eyeball them. */
import { writeFileSync, mkdirSync } from "fs";

import { buildCustomerPdf } from "@/lib/pdf/build";
import { buildInspectionPdf } from "@/lib/pdf/inspection";
import { buildPropertyIntelPdf } from "@/lib/pdf/propertyIntel";
import type { EngineState, ComputedValues } from "@/types/engine";
import { TEMPLATES } from "@/data/inspectionTemplates";
import { generateReport } from "@/lib/propertyIntel/generateReport";

mkdirSync("/tmp/pdfqa", { recursive: true });

const state = {
  homeowner1: "Marcus Whitfield", homeowner2: "Elena Whitfield",
  products: ["Roofing System"], solarKw: "8",
  optionAName: "Timberline Energy Charcoal", optionBName: "Grand Sequoia Charcoal",
  optionCName: "Timberline American Harvest", gutterFeet: "100", downPayment: 0,
  priceA: 38400, priceB: 32900, priceC: 28750,
  financingFactor1: 0.01074, financingFactor2: 0.015, creditScore: 720,
  efficiencyDiscount: 2170, standbyDiscount: 2170, deferred6Pct: 5, deferred12Pct: 10,
  roiPercent: 67, monthlyBill: 300, energySavingsPct: 75,
  currentStage: "presentation", selectedOption: null, objectionType: null,
  priceShown: true, activeTab: "presentation",
  windowInspection: [], windowItems: [], windowScopeChecks: [],
  roofMaterial: "shingle",
} as unknown as EngineState;

const opt = (price: number) => ({
  price, monthly: Math.round(price * 0.01074),
  efficiencyPrice: price - 2170, standbyPrice: price - 2170,
  deferred6Price: price * 0.95, deferred12Price: price * 0.9,
  monthlyEfficiency: Math.round((price - 2170) * 0.01074),
  monthlyStandby: Math.round((price - 2170) * 0.01074),
  monthlyDeferred6: Math.round(price * 0.95 * 0.01074),
  monthlyDeferred12: Math.round(price * 0.9 * 0.01074),
  roiValue: price * 0.67, netCost: price * 0.33,
});

const computed: ComputedValues = {
  options: { A: opt(38400), B: opt(32900), C: opt(28750) },
  annualCost: 3600, tenYearCost: 41000, energySavings: 2700,
  moveForwardImpact: 18400, doNothingImpact: -41000, netDifference: 59400,
  inflationPenalty: 5200, lockedInSavings: 27000, selectedPrice: 32900,
};

const options = [
  { key: "A" as const, name: state.optionAName, price: 38400, monthly: 412 },
  { key: "B" as const, name: state.optionBName, price: 32900, monthly: 353 },
  { key: "C" as const, name: state.optionCName, price: 28750, monthly: 309 },
];

const save = async (name: string, blob: Blob) =>
  writeFileSync(`/tmp/pdfqa/${name}.pdf`, Buffer.from(await blob.arrayBuffer()));

const { blob: proposal } = await buildCustomerPdf(state, computed, options, null, {
  rep: { name: "Jordan Reyes", email: "jordan@dabella.us", phone: "(602) 555-0147" },
});
await save("proposal", proposal);

const { blob: inspection } = await buildInspectionPdf({
  customerName: "Marcus Whitfield",
  address: "1416 W Libby St, Phoenix, AZ 85023",
  reportTypes: ["roof"],
  sections: TEMPLATES.roof,
  photos: [
    { tags: ["granule_loss", "cracked_shingles"], severity: "high", caption: "Heavy granule loss across the south-facing slope with exposed mat.", signedUrl: undefined },
    { tags: ["pipe_boot"], severity: "moderate", caption: "Pipe boot seal is split and no longer watertight.", signedUrl: undefined },
    { tags: ["valley_metal"], severity: "low", caption: "Surface rust forming along the valley metal.", signedUrl: undefined },
  ],
  rep: { name: "Jordan Reyes", email: "jordan@dabella.us", phone: "(602) 555-0147" },
  language: "en",
});
await save("inspection", inspection);

const report = await generateReport("1416 W Libby St, Phoenix, AZ 85023", "Jordan");
const { blob: intel } = await buildPropertyIntelPdf(report);
await save("property-intel", intel);

console.log("ok");
