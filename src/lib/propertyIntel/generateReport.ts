import type { PropertyIntelReport } from "./types";
import { confidence } from "./confidence";
import { NAME_USAGE_MIN_CONFIDENCE } from "./copy";
import {
  mockPropertyMatch, mockOwnership, mockSale, mockInfo, mockOpportunity,
} from "./providers/mockProviders";

const PRODUCT_LABEL: Record<string, string> = {
  roofing: "roofing system",
  windows: "windows",
  bath: "bath / shower system",
  siding: "siding",
  paint: "exterior coating",
  gutters: "gutter system",
  ventilation: "attic ventilation",
  insulation: "insulation",
};

/**
 * Fully client-side demo report generator. When the edge function is wired
 * with live providers, this can be swapped for `supabase.functions.invoke`.
 */
export function generateReport(query: string, repFirstName = "your rep"): PropertyIntelReport {
  const { fixture, match } = mockPropertyMatch(query);
  const ownership = mockOwnership(fixture);
  const sale = mockSale(fixture);
  const info = mockInfo(fixture);
  const opp = mockOpportunity({ info, ownership });

  // Identity assessment
  const identityReasons: string[] = [];
  const identityConflicts: string[] = [];
  let identityScore = 60;
  let likelyOwner: string | null = ownership.owner_name;
  const status =
    ownership.owner_type === "individual" || ownership.owner_type === "joint"
      ? "likely_owner_occupied"
      : "unknown";

  if (ownership.owner_type === "trust" || ownership.owner_type === "llc" || ownership.owner_type === "corporation") {
    likelyOwner = null;
    identityScore = 46;
    identityConflicts.push(`Owned by ${ownership.owner_type.toUpperCase()} — beneficiary/agent may not be occupant`);
    if (!ownership.tax_mailing_matches_property) {
      identityScore -= 8;
      identityConflicts.push("Tax mailing address differs from property");
    }
  } else {
    identityReasons.push("Recorded buyers on most recent deed");
    if (ownership.tax_mailing_matches_property) {
      identityScore += 20;
      identityReasons.push("Tax mailing address matches the property");
    } else {
      identityScore -= 12;
      identityConflicts.push("Tax mailing address differs from property");
    }
    identityReasons.push("No later ownership transfer found");
    identityScore += 8;
  }

  const identity = {
    likely_owner_name: likelyOwner,
    likely_occupant_name: likelyOwner,
    owner_occupancy_status: status as "likely_owner_occupied" | "likely_non_owner_occupied" | "unknown",
    confidence: confidence(identityScore, identityReasons, identityConflicts),
  };

  const useName = !!identity.likely_owner_name && identity.confidence.score >= NAME_USAGE_MIN_CONFIDENCE;
  const firstName = identity.likely_owner_name?.split(/[&,]/)[0].trim().split(" ")[0] ?? null;

  const productLabel = PRODUCT_LABEL[opp.primary_product] ?? opp.primary_product;

  const opener = useName && firstName
    ? `Hi, are you ${firstName}? My name is ${repFirstName} with DaBella. We're helping several homeowners nearby evaluate their ${productLabel}, and I wanted to see when yours was last professionally inspected.`
    : `Hi, my name is ${repFirstName} with DaBella. Are you the homeowner? We're helping several neighbors take a quick look at their ${productLabel}.`;

  const brief = {
    headline_name: useName ? identity.likely_owner_name : null,
    use_name_at_door: useName,
    suggested_opener: opener,
    reasons: opp.reasons.slice(0, 3),
  };

  // Overall confidence: weighted average of the important pieces.
  const overallScore = Math.round(
    match.confidence.score * 0.25 +
    ownership.confidence.score * 0.25 +
    sale.confidence.score * 0.15 +
    identity.confidence.score * 0.2 +
    opp.recommendation_confidence.score * 0.15
  );

  return {
    property_match: match,
    ownership,
    most_recent_sale: sale,
    identity,
    info,
    opportunity: opp,
    brief,
    overall_confidence: confidence(overallScore, [
      "Weighted rollup of match, ownership, sale, identity and opportunity confidence",
    ]),
    is_demo: true,
    generated_at: new Date().toISOString(),
  };
}
