import type { jsPDF } from "jspdf";
import { MIST, PH, PW, SLATE } from "../theme";
import {
  hairline, setBodyFont, setColor, setDisplayFont, trackedText,
} from "../primitives";

/** Refined editorial footer drawn on every interior page. */
export function drawInteriorFooters(pdf: jsPDF) {
  const totalPages = pdf.getNumberOfPages();
  for (let p = 2; p <= totalPages - 1; p++) {
    pdf.setPage(p);
    hairline(pdf, 22, PH - 16, PW - 22, PH - 16, MIST, 0.2);
    setDisplayFont(pdf, 6.5);
    setColor(pdf, SLATE);
    trackedText(pdf, "DABELLA · PROPOSAL", 22, PH - 11, { charSpace: 0.45 });
    setBodyFont(pdf, 6.5);
    trackedText(
      pdf,
      `${String(p).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`,
      PW - 22, PH - 11,
      { align: "right", charSpace: 0.3 },
    );
  }
}
