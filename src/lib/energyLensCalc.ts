/** Core math for the Energy Roof Inflation Lens. Homeowner-friendly, no discounting. */

export interface LensInputs {
  monthlyBill: number;
  rate: number; // $/kWh effective
  systemKw: number;
  productionFactor: number; // kWh per kW per year
  selfConsumptionPct: number; // 0..1
  exportRate: number; // $/kWh
  inflationPct: number; // 0..1
  horizonYears: number;
  degradationPct?: number; // 0..1 annual, default 0.005
  hasBattery: boolean;
}

export interface YearPoint {
  year: number;
  doNothingAnnual: number;
  doNothingCumulative: number;
  withRoofAnnual: number;
  withRoofCumulative: number;
  energyValueAnnual: number;
  energyValueCumulative: number;
}

export interface LensResult {
  annualKwhUsage: number;
  prodYear1: number;
  selfUsedYear1: number;
  exportedYear1: number;
  valueYear1: number;
  valueYear1Monthly: number;
  annualBillYear1: number;
  offsetPct: number; // value/annual bill
  series: YearPoint[];
  cumulativeEnergyValue: number;
  cumulativeDoNothing: number;
  cumulativeSavings: number;
  inflationExposureReducedPct: number;
}

export function computeLens(i: LensInputs): LensResult {
  const degradation = i.degradationPct ?? 0.005;
  const annualKwhUsage = i.rate > 0 ? (i.monthlyBill / i.rate) * 12 : 0;

  const prodYear1 = i.systemKw * i.productionFactor;
  const selfUsedYear1 = prodYear1 * i.selfConsumptionPct;
  const exportedYear1 = prodYear1 - selfUsedYear1;
  const valueYear1 = selfUsedYear1 * i.rate + exportedYear1 * i.exportRate;
  const annualBillYear1 = i.monthlyBill * 12;
  const offsetPct = annualBillYear1 > 0 ? valueYear1 / annualBillYear1 : 0;

  const series: YearPoint[] = [];
  let doNothingCum = 0;
  let withRoofCum = 0;
  let energyValueCum = 0;

  for (let y = 1; y <= i.horizonYears; y++) {
    const inflationMult = Math.pow(1 + i.inflationPct, y - 1);
    const prodMult = Math.pow(1 - degradation, y - 1);

    const billAnnual = annualBillYear1 * inflationMult;
    const ratedThisYear = i.rate * inflationMult;
    const exportRateThisYear = i.exportRate * inflationMult;
    const prodThisYear = prodYear1 * prodMult;
    const selfUsedThisYear = prodThisYear * i.selfConsumptionPct;
    const exportedThisYear = prodThisYear - selfUsedThisYear;
    const energyValueThisYear =
      selfUsedThisYear * ratedThisYear + exportedThisYear * exportRateThisYear;

    const withRoofAnnual = Math.max(0, billAnnual - energyValueThisYear);

    doNothingCum += billAnnual;
    withRoofCum += withRoofAnnual;
    energyValueCum += energyValueThisYear;

    series.push({
      year: y,
      doNothingAnnual: billAnnual,
      doNothingCumulative: doNothingCum,
      withRoofAnnual,
      withRoofCumulative: withRoofCum,
      energyValueAnnual: energyValueThisYear,
      energyValueCumulative: energyValueCum,
    });
  }

  const cumulativeSavings = doNothingCum - withRoofCum;
  const inflationExposureReducedPct = doNothingCum > 0 ? cumulativeSavings / doNothingCum : 0;

  return {
    annualKwhUsage,
    prodYear1,
    selfUsedYear1,
    exportedYear1,
    valueYear1,
    valueYear1Monthly: valueYear1 / 12,
    annualBillYear1,
    offsetPct,
    series,
    cumulativeEnergyValue: energyValueCum,
    cumulativeDoNothing: doNothingCum,
    cumulativeSavings,
    inflationExposureReducedPct,
  };
}
