import type { jsPDF } from "jspdf";
import { reportFooter } from "../primitives";

/** Refined editorial footer drawn on every interior page. */
export function drawInteriorFooters(pdf: jsPDF) {
  const totalPages = pdf.getNumberOfPages();
  for (let p = 2; p <= totalPages - 1; p++) {
    pdf.setPage(p);
    reportFooter(pdf, p, totalPages, "DaBella · Proposal");
  }
}
