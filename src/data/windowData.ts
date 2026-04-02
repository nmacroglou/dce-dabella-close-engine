/** Window styles matching the DaBella inspection form */
export const WINDOW_STYLES = [
  "CO - Casement",
  "PW/C - Picture Window",
  "AW - Awning",
  "TW - Twin-Casement",
  "TR 1/3-1/3-1/3 - Triple-Casement",
  "TR 1/4-1/2-1/4 - Triple-Casement",
  "Bay",
  "Bow",
  "Garden",
  "SPD - Sliding Patio Door",
  "DH - Double Hung",
  "2-Lite Slider",
  "EV - 3-Lite End Vent",
  "MDL - Welded Dead Lite",
  "HD - Hopper",
] as const;

/** Grid pattern options */
export const GRID_PATTERNS = ["None", "Colonial", "Perimeter", "Prairie"] as const;

/** Inspection checklist items — 14 standard items from the DaBella form */
export const WINDOW_INSPECTION_ITEMS = [
  "Looseness in the sashes and frame",
  "All the locks work",
  "Water/sun damage",
  "Looseness of the glass inside the sash",
  "Cracked glass",
  "Exterior glazing strips",
  "Soft wood/dry rot",
  "All windows operate properly",
  "Blown Seals",
  "Caulking",
  "Proper Installation",
  "Egress",
  "Screens",
  "Square",
] as const;

/** Window-specific scope of work items */
export const WINDOW_SCOPE_ITEMS = [
  "Reasons for replacement reviewed with homeowner",
  "Company credentials and certifications reviewed",
  "Frame type and material selected",
  "Warranty coverage explained and confirmed",
  "Glass type and energy rating selected",
  "Critical measure visit to ensure proper fit",
  "Custom built to exact specifications at manufacturing plant",
  "Installation department will schedule appointment",
  "Crew will prepare home and protect surfaces with drop cloths",
  "Drop cloths placed inside and outside each window opening",
  "Remove each existing window and prepare opening for installation",
  "Install new windows, caulk and seal in place",
  "Final walkthrough to confirm everything meets your satisfaction",
] as const;

/** Represents a single window line item */
export interface WindowLineItem {
  id: string;
  number: number;
  level: string;
  room: string;
  style: string;
  woodGrainColorIn: string;
  woodGrainColorOut: string;
  width: string;
  height: string;
  gridPattern: string;
  observations: string;
}

export type InspectionStatus = "yes" | "no" | "na";

export interface WindowInspectionEntry {
  label: string;
  status: InspectionStatus;
}

export function createEmptyWindowItem(num: number): WindowLineItem {
  return {
    id: crypto.randomUUID(),
    number: num,
    level: "",
    room: "",
    style: "DH - Double Hung",
    woodGrainColorIn: "",
    woodGrainColorOut: "",
    width: "",
    height: "",
    gridPattern: "None",
    observations: "",
  };
}
