// Thin re-export shim. The real implementation lives in src/lib/pdf/*.
// Existing imports (`@/lib/exportPdf`) continue to work unchanged.
export { buildCustomerPdf, exportCustomerPdf } from "./pdf";
export type { ProposalOption, BuildOptions } from "./pdf";
