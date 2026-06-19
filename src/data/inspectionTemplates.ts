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
