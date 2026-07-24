/**
 * Mock provider adapters — clearly labeled demo data.
 * Real ATTOM / Regrid / CoreLogic / DataTree adapters will replace these
 * behind the edge function once API keys are added.
 */
import type {
  PropertyMatch, OwnershipRecord, SaleRecord, PropertyInfo, ProductKey,
} from "../types";
import { confidence } from "../confidence";

interface DemoFixture {
  address: string;
  parcel: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  ownerName: string;
  ownerType: OwnershipRecord["owner_type"];
  buyerName: string;
  sellerName: string;
  saleDate: string;
  salePrice: number;
  yearBuilt: number;
  sqft: number;
  lot: number;
  stories: number;
  bed: number;
  bath: number;
  assessed: number;
  market: number;
  roofMaterial: string;
  roofAge: number;
  ownerOccupied: boolean;
  taxMatch: boolean;
  taxName?: string;
  taxAddr?: string;
  permits?: PropertyInfo["permits"];
}

const DEMO: DemoFixture[] = [
  {
    address: "4218 N 7th Ave, Phoenix, AZ 85013",
    parcel: "155-42-018",
    city: "Phoenix", state: "AZ", zip: "85013",
    lat: 33.4936, lng: -112.0836,
    ownerName: "Maria & David Sanchez",
    ownerType: "joint",
    buyerName: "Maria Sanchez; David Sanchez",
    sellerName: "R. Whitmore Family Trust",
    saleDate: "2007-06-14",
    salePrice: 289000,
    yearBuilt: 1998, sqft: 2140, lot: 8250, stories: 1, bed: 4, bath: 2.5,
    assessed: 342000, market: 468000,
    roofMaterial: "Asphalt shingle", roofAge: 19,
    ownerOccupied: true, taxMatch: true,
  },
  {
    address: "6811 E Osborn Rd, Scottsdale, AZ 85251",
    parcel: "173-08-042",
    city: "Scottsdale", state: "AZ", zip: "85251",
    lat: 33.4864, lng: -111.9247,
    ownerName: "Cactus Ridge Holdings LLC",
    ownerType: "llc",
    buyerName: "Cactus Ridge Holdings LLC",
    sellerName: "Patricia Nguyen",
    saleDate: "2019-11-02",
    salePrice: 615000,
    yearBuilt: 1984, sqft: 2680, lot: 9800, stories: 1, bed: 4, bath: 3,
    assessed: 512000, market: 745000,
    roofMaterial: "Concrete tile", roofAge: 22,
    ownerOccupied: false, taxMatch: false,
    taxName: "Cactus Ridge Holdings LLC",
    taxAddr: "PO Box 4477, Scottsdale AZ 85261",
    permits: [{ type: "electrical", date: "2021-04-12", description: "Panel upgrade 200A" }],
  },
  {
    address: "12520 N 32nd St, Phoenix, AZ 85032",
    parcel: "166-11-207",
    city: "Phoenix", state: "AZ", zip: "85032",
    lat: 33.5966, lng: -112.0157,
    ownerName: "Robert Kim",
    ownerType: "individual",
    buyerName: "Robert Kim",
    sellerName: "Angela Foster",
    saleDate: "2014-03-21",
    salePrice: 232000,
    yearBuilt: 2001, sqft: 1860, lot: 6200, stories: 2, bed: 3, bath: 2.5,
    assessed: 298000, market: 412000,
    roofMaterial: "Asphalt shingle", roofAge: 12,
    ownerOccupied: true, taxMatch: true,
    permits: [{ type: "roofing", date: "2018-08-30", description: "Reroof — 30yr architectural shingle" }],
  },
  {
    address: "3355 E Camelback Rd, Phoenix, AZ 85018",
    parcel: "171-32-089",
    city: "Phoenix", state: "AZ", zip: "85018",
    lat: 33.5091, lng: -111.9931,
    ownerName: "Hillcrest Family Trust",
    ownerType: "trust",
    buyerName: "Hillcrest Family Trust",
    sellerName: "Nathan Brooks",
    saleDate: "2011-09-08",
    salePrice: 780000,
    yearBuilt: 1978, sqft: 3120, lot: 12400, stories: 1, bed: 5, bath: 3.5,
    assessed: 690000, market: 985000,
    roofMaterial: "Tile", roofAge: 24,
    ownerOccupied: true, taxMatch: true,
    taxName: "Hillcrest Family Trust c/o L. Brooks",
    taxAddr: "3355 E Camelback Rd, Phoenix AZ 85018",
  },
];

function pickFixture(query: string): DemoFixture {
  const q = query.trim().toLowerCase();
  // Try zip / partial match
  const found = DEMO.find((d) =>
    d.address.toLowerCase().includes(q) ||
    d.zip === q ||
    d.parcel === q ||
    q.includes(d.zip)
  );
  if (found) return found;
  // Hash-pick a stable fixture so the same query returns the same house.
  let hash = 0;
  for (let i = 0; i < q.length; i++) hash = (hash * 31 + q.charCodeAt(i)) >>> 0;
  return DEMO[hash % DEMO.length];
}

export function mockPropertyMatch(query: string): { fixture: DemoFixture; match: PropertyMatch } {
  const f = pickFixture(query);
  // Confidence: exact address input scores highest.
  const looksLikeAddress = /\d+\s+\w+/.test(query);
  const zipMatch = query.includes(f.zip);
  let score = 55;
  const reasons: string[] = ["Parcel match confirmed (demo)"];
  if (looksLikeAddress) { score += 20; reasons.push("Address string parsed"); }
  if (zipMatch) { score += 15; reasons.push("ZIP code matches parcel record"); }
  if (query.trim().toLowerCase() === f.address.toLowerCase()) { score += 10; reasons.push("Exact address match"); }
  return {
    fixture: f,
    match: {
      standardized_address: f.address,
      parcel_number: f.parcel,
      city: f.city, state: f.state, postal_code: f.zip,
      latitude: f.lat, longitude: f.lng,
      property_type: "Single-family residence",
      data_sources: ["County Assessor (demo)", "Parcel GIS (demo)", "Licensed property record (demo)"],
      last_updated: new Date().toISOString(),
      confidence: confidence(score, reasons),
    },
  };
}

export function mockOwnership(f: DemoFixture): OwnershipRecord {
  const reasons: string[] = [
    `Recorded owner: ${f.ownerName}`,
    `Ownership type: ${f.ownerType}`,
  ];
  const conflicts: string[] = [];
  let score = 78;
  if (f.taxMatch) { score += 8; reasons.push("Tax mailing address matches property"); }
  else { score -= 15; conflicts.push("Tax mailing address differs from property"); }
  if (f.ownerType === "trust" || f.ownerType === "llc") {
    score -= 20;
    conflicts.push(`Owned by ${f.ownerType.toUpperCase()} — individual identity requires confirmation`);
  }
  return {
    owner_name: f.ownerName,
    owner_type: f.ownerType,
    tax_mailing_name: f.taxName ?? f.ownerName,
    tax_mailing_address: f.taxAddr ?? f.address,
    tax_mailing_matches_property: f.taxMatch,
    ownership_start_date: f.saleDate,
    document_type: "Warranty Deed",
    recording_number: `2007-${(Math.floor(Math.random() * 900000) + 100000)}`,
    source: "County Recorder (demo)",
    source_record_date: f.saleDate,
    confidence: confidence(score, reasons, conflicts),
  };
}

export function mockSale(f: DemoFixture): SaleRecord {
  return {
    sale_date: f.saleDate,
    buyer_name: f.buyerName,
    seller_name: f.sellerName,
    sale_price: f.salePrice,
    document_type: "Warranty Deed",
    recording_number: `${f.saleDate.slice(0, 4)}-${(Math.floor(Math.random() * 900000) + 100000)}`,
    source: "County Recorder (demo)",
    confidence: confidence(88, [
      "Deed recorded on date",
      "Buyer and seller names present",
      "Document type verified",
    ]),
  };
}

export function mockInfo(f: DemoFixture): PropertyInfo {
  return {
    year_built: f.yearBuilt,
    square_feet: f.sqft,
    lot_size: f.lot,
    stories: f.stories,
    bedrooms: f.bed,
    bathrooms: f.bath,
    assessed_value: f.assessed,
    estimated_market_value: f.market,
    roof_material: f.roofMaterial,
    estimated_roof_age: f.roofAge,
    is_roof_age_estimated: true,
    exterior_material: "Stucco",
    solar_present: false,
    permits: f.permits ?? [],
    storm_exposure: "moderate",
    heat_exposure: "high",
    visible_condition_notes: null,
    previous_dabella_interaction: false,
    existing_customer: false,
    do_not_knock: false,
  };
}

export interface OpportunityInput { info: PropertyInfo; ownership: OwnershipRecord; }
export function mockOpportunity({ info, ownership }: OpportunityInput) {
  const reasons: string[] = [];
  const missing: string[] = [];
  const inspection: string[] = [];
  const hasRecentRoofPermit = info.permits.some((p) => p.type === "roofing" &&
    new Date(p.date) > new Date(new Date().getFullYear() - 5, 0, 1));
  const roofAge = info.estimated_roof_age ?? 0;

  let primary: ProductKey = "roofing";
  let secondary: ProductKey | null = "windows";
  let score = 40;

  if (hasRecentRoofPermit) {
    primary = "windows";
    secondary = "bath";
    score = 55;
    reasons.push("Recent roofing permit on file — roof recently replaced");
    reasons.push("Original windows likely nearing end of service life");
    inspection.push("Inspect window seal condition and frame integrity");
  } else {
    reasons.push(`Property built in ${info.year_built} — original roof aging`);
    if (roofAge >= 18) { score += 25; reasons.push(`Estimated roof age exceeds 18 years (${roofAge}y)`); }
    if (info.heat_exposure === "high") { score += 10; reasons.push("High heat exposure accelerates shingle degradation"); }
    if (info.storm_exposure === "high" || info.storm_exposure === "moderate") {
      score += 8; reasons.push(`${(info.storm_exposure ?? "").replace(/^./, (c) => c.toUpperCase())} storm exposure zone`);
    }
    inspection.push("Photograph south/west roof faces for granule loss");
    inspection.push("Note flashing condition around penetrations");
  }
  if (!info.visible_condition_notes) missing.push("Visible exterior condition photos");
  if (roofAge === null) missing.push("Confirmed roof age from installer/warranty");

  let recScore = 60;
  const recReasons: string[] = [];
  const recConflicts: string[] = [];
  if (ownership.confidence.score >= 75) { recScore += 10; recReasons.push("Ownership confidence high"); }
  else recConflicts.push("Ownership confidence limits recommendation reliability");
  if (info.year_built && info.year_built < 2005) { recScore += 8; recReasons.push("Property predates modern roofing systems"); }

  return {
    primary_product: primary,
    secondary_product: secondary,
    opportunity_score: Math.min(100, Math.round(score)),
    recommendation_confidence: confidence(recScore, recReasons, recConflicts),
    reasons,
    missing_info: missing,
    suggested_inspection_focus: inspection,
  };
}
