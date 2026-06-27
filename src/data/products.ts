/** Available product types for the calculator */
export const PRODUCT_OPTIONS = [
  "Roofing System",
  "Windows",
  "Siding",
  "Stucco",
  "Paint",
  "Solar",
  "Gutters",
  "Bath",
] as const;

export type ProductType = (typeof PRODUCT_OPTIONS)[number];
