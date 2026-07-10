export type InspectionReportType = "roof" | "windows" | "bath" | "solar" | "siding" | "stucco" | "paint";

export const REPORT_TYPE_LABELS: Record<InspectionReportType, string> = {
  roof: "Roof Inspection",
  windows: "Window Inspection",
  bath: "Bath Inspection",
  solar: "Solar Inspection",
  siding: "Siding Inspection",
  stucco: "Stucco Inspection",
  paint: "Paint Inspection",
};

export const REPORT_TYPE_LABELS_ES: Record<InspectionReportType, string> = {
  roof: "Inspección de Techo",
  windows: "Inspección de Ventanas",
  bath: "Inspección de Baño",
  solar: "Inspección Solar",
  siding: "Inspección de Revestimiento",
  stucco: "Inspección de Estuco",
  paint: "Inspección de Pintura",
};

/** Short trade name without the "Inspection" suffix, used when combining multiple report types. */
export const REPORT_TYPE_SHORT: Record<InspectionReportType, string> = {
  roof: "Roof",
  windows: "Windows",
  bath: "Bath",
  solar: "Solar",
  siding: "Siding",
  stucco: "Stucco",
  paint: "Paint",
};

export const REPORT_TYPE_SHORT_ES: Record<InspectionReportType, string> = {
  roof: "Techo",
  windows: "Ventanas",
  bath: "Baño",
  solar: "Solar",
  siding: "Revestimiento",
  stucco: "Estuco",
  paint: "Pintura",
};

/** Join one or more report types into a single human label, e.g. "Roof + Siding Inspection". */
export function combinedReportLabel(types: InspectionReportType[], lang: "en" | "es" = "en"): string {
  const list = (types && types.length ? types : ["roof" as InspectionReportType]);
  const labels = lang === "es" ? REPORT_TYPE_LABELS_ES : REPORT_TYPE_LABELS;
  const shorts = lang === "es" ? REPORT_TYPE_SHORT_ES : REPORT_TYPE_SHORT;
  if (list.length === 1) return labels[list[0]];
  const suffix = lang === "es" ? "Inspección" : "Inspection";
  return `${list.map((t) => shorts[t]).join(" + ")} ${suffix}`;
}


export interface InspectionSections {
  executive_summary: string;
  inspection_scope: string;
  measurements: string;
  professional_opinion: string;
  recommended_scope: string;
  next_steps: string;
  limitations: string;
}

const COMMON_SCOPE =
  "This report is based on visual review of the photos captured at the property. It does not replace destructive testing, engineering review, or code compliance review. Concealed conditions should be verified during physical inspection.";

const COMMON_NEXT_STEPS =
  "1) Review this report with your DaBella consultant. 2) Confirm scope and product selection. 3) Lock in pricing and schedule the project. Your consultant can answer any questions about warranty, financing, or timeline.";

const COMMON_LIMITATIONS =
  "Findings are limited to what is visible in the provided photographs. Areas not photographed, concealed framing, and hidden moisture damage cannot be confirmed from images alone and may be discovered during the work.";

export const TEMPLATES: Record<InspectionReportType, InspectionSections> = {
  roof: {
    executive_summary:
      "A professional roof condition review was performed for the homeowner. The visible evidence indicates conditions that warrant attention to protect the home from water intrusion and accelerated wear. The roof should be evaluated as a complete system because tile/shingle surface, underlayment, flashing details, and penetrations all work together to keep the home dry.",
    inspection_scope: COMMON_SCOPE,
    measurements:
      "Roof measurements should be confirmed using an EagleView, Hover, or field-measured diagram. Final scope and pricing should reflect verified squares, pitch, material type, waste factor, flashing, penetrations, and required code upgrades.",
    professional_opinion:
      "Based on the visible defects, full replacement (or complete tile reset with new underlayment) is the most defensible path. Spot repair would leave the surrounding system in the same vulnerable condition.",
    recommended_scope:
      "Replace the roofing system with manufacturer-approved underlayment, new flashings at all penetrations, ridge and valley detailing, and a workmanship warranty backed by DaBella.",
    next_steps: COMMON_NEXT_STEPS,
    limitations: COMMON_LIMITATIONS,
  },
  windows: {
    executive_summary:
      "A professional window condition review was performed. The photos document conditions affecting comfort, energy performance, and water management. Replacement-grade windows installed properly will restore performance and protect the home long-term.",
    inspection_scope: COMMON_SCOPE,
    measurements:
      "All openings should be field-measured for custom manufacturing. Final pricing reflects opening count, style, glass package, grids, and any structural or trim work required.",
    professional_opinion:
      "The visible conditions support a full-replacement approach rather than piecemeal repair. New units restore seal integrity, operation, and energy performance with a transferable warranty.",
    recommended_scope:
      "Install replacement windows with high-performance Low-E glass, proper flashing and caulk detail, and a lifetime workmanship warranty backed by DaBella.",
    next_steps: COMMON_NEXT_STEPS,
    limitations: COMMON_LIMITATIONS,
  },
  bath: {
    executive_summary:
      "A professional bath condition review was performed. The photos document moisture, finish, and fixture conditions that affect daily use and long-term durability. A full bath remodel addresses the system holistically.",
    inspection_scope: COMMON_SCOPE,
    measurements:
      "Field measurements of the bath footprint, plumbing locations, and fixture clearances should be confirmed at the design meeting.",
    professional_opinion:
      "Replacing the wet area as a system (pan, surround, fixtures, and seals) is the most reliable path. Cosmetic-only repair leaves the underlying failure modes in place.",
    recommended_scope:
      "Demo and rebuild the wet area with a sealed pan, code-compliant surround, new fixtures, and DaBella workmanship warranty. Address ventilation if inadequate.",
    next_steps: COMMON_NEXT_STEPS,
    limitations: COMMON_LIMITATIONS,
  },
  solar: {
    executive_summary:
      "A professional solar condition review was performed. The photos document panel, wiring, and mount conditions that affect generation and roof integrity. The solar array should be evaluated together with the supporting roof.",
    inspection_scope: COMMON_SCOPE,
    measurements:
      "System size, panel count, inverter spec, and any required electrical upgrades should be confirmed during the engineering review.",
    professional_opinion:
      "Where roof condition is compromised, panel work and roofing work should be coordinated to avoid duplicate mobilization and to protect the warranty.",
    recommended_scope:
      "Service or replace affected components, re-flash all mounts, and re-commission the array. Coordinate with roofing work where applicable.",
    next_steps: COMMON_NEXT_STEPS,
    limitations: COMMON_LIMITATIONS,
  },
  siding: {
    executive_summary:
      "A professional siding condition review was performed. The photos document panel damage, fastening issues, moisture intrusion, and aesthetic wear that affect the home's protection and curb appeal. Siding should be treated as a complete system: panels, trim, seams, and flashings all work together to keep water out.",
    inspection_scope: COMMON_SCOPE,
    measurements:
      "Total square footage of siding, linear feet of trim and fascia, number of windows and doors to wrap, and required substrate repairs should be confirmed with a field measurement or estimate.",
    professional_opinion:
      "Isolated repairs often leave the remaining cladding in the same vulnerable state. Full replacement of the affected elevations provides consistent appearance, proper flashing, and a transferable workmanship warranty.",
    recommended_scope:
      "Replace the affected siding with manufacturer-approved panels, new housewrap, flashings, trim wrap, and a workmanship warranty backed by DaBella.",
    next_steps: COMMON_NEXT_STEPS,
    limitations: COMMON_LIMITATIONS,
  },
  stucco: {
    executive_summary:
      "A professional stucco condition review was performed. The photos document the existing stucco finish texture along with cracking, discoloration, and surface imperfections that affect curb appeal and the long-term protection of the cladding. DaBella's Forever Paint system is designed to seal these conditions and color-match the existing finish — Santa Barbara, Lace, Light Lace, Heavy Lace, Light Dash, Medium Dash, Heavy Dash, or Sand — so the home looks intentional, not patched.",
    inspection_scope: COMMON_SCOPE,
    measurements:
      "Total square footage of stucco, the existing finish texture (Santa Barbara, Lace, Light Lace, Heavy Lace, Light Dash, Medium Dash, Heavy Dash, or Sand), number of cracks and repair patches, and areas requiring touch-up should be confirmed during the physical inspection.",
    professional_opinion:
      "Patch-and-paint is a temporary fix when the underlying moisture management is failing. Repair or reclad the affected elevations with proper drainage, control joints, and flashing to stop ongoing damage.",
    recommended_scope:
      "Repair or replace compromised stucco elevations with a moisture-managed system, seal penetrations, and apply a breathable, color-matched finish with a DaBella workmanship warranty.",
    next_steps: COMMON_NEXT_STEPS,
    limitations: COMMON_LIMITATIONS,
  },
  paint: {
    executive_summary:
      "A professional exterior paint condition review was performed. The photos document finish wear, substrate exposure, and moisture-related symptoms that affect curb appeal and protect the underlying siding or trim. A quality repaint restores the weather skin and prevents slow water damage.",
    inspection_scope: COMMON_SCOPE,
    measurements:
      "Square footage of wall and trim surfaces, number of stories, linear feet of fascia/soffit, and areas requiring scraping or priming should be field-verified for final scope and pricing.",
    professional_opinion:
      "Spot touch-ups leave the surrounding finish in the same degraded condition. A complete repaint of affected areas (or the whole home) provides consistent appearance and uniform protection.",
    recommended_scope:
      "Pressure-wash, scrape and prime bare or failing areas, caulk gaps, and apply two coats of premium exterior paint to walls and trim with a workmanship warranty backed by DaBella.",
    next_steps: COMMON_NEXT_STEPS,
    limitations: COMMON_LIMITATIONS,
  },
};

export const SEVERITY_LABEL: Record<"low" | "moderate" | "high", string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
};

/** Pretty-print a snake_case tag for the UI / PDF. */
export function prettyTag(tag: string) {
  return tag.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
