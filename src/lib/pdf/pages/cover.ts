import type { jsPDF } from "jspdf";
import type { EngineState } from "@/types/engine";
import { getNames, getProductLabel } from "@/lib/engineHelpers";
import {
  ACCENT, FOREST, FOREST_INK, LIME, PH, PW, WHITE,
} from "../theme";
import {
  hairline, rect, setBodyFont, setColor, setDisplayFont, setDraw, setFill,
  trackedText, vGradient,
} from "../primitives";

export function drawCover(pdf: jsPDF, state: EngineState) {
  const names = getNames(state);

  vGradient(pdf, 0, 0, PW, PH, FOREST, FOREST_INK);

  pdf.setGState(pdf.GState({ opacity: 0.07 }));
  setFill(pdf, LIME);
  pdf.circle(180, 30, 90, "F");
  pdf.circle(-10, 230, 75, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));

  rect(pdf, 0, 0, PW, 0.6, ACCENT);

  setDraw(pdf, [255, 255, 255]);
  pdf.setLineWidth(0.2);
  pdf.setGState(pdf.GState({ opacity: 0.22 }));
  pdf.line(15, 15, 22, 15); pdf.line(15, 15, 15, 22);
  pdf.line(PW - 15, 15, PW - 22, 15); pdf.line(PW - 15, 15, PW - 15, 22);
  pdf.line(15, PH - 15, 22, PH - 15); pdf.line(15, PH - 15, 15, PH - 22);
  pdf.line(PW - 15, PH - 15, PW - 22, PH - 15); pdf.line(PW - 15, PH - 15, PW - 15, PH - 22);
  pdf.setGState(pdf.GState({ opacity: 1 }));

  setDisplayFont(pdf, 7);
  setColor(pdf, LIME);
  trackedText(pdf, "DABELLA", 22, 22, { charSpace: 0.7 });
  setBodyFont(pdf, 7);
  setColor(pdf, [220, 230, 220]);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  trackedText(pdf, today.toUpperCase(), PW - 22, 22, { align: "right", charSpace: 0.45 });

  setDisplayFont(pdf, 8);
  setColor(pdf, LIME);
  trackedText(pdf, "PRIVATE PROPOSAL · NO. 001", 22, 100, { charSpace: 0.6 });

  setDisplayFont(pdf, 38);
  setColor(pdf, WHITE);
  pdf.text("A Home", 22, 132);
  pdf.text("Built To Last.", 22, 153);

  setFill(pdf, ACCENT);
  pdf.rect(22, 162, 30, 1.2, "F");

  setBodyFont(pdf, 10.5);
  setColor(pdf, [220, 232, 220]);
  pdf.text(`A bespoke ${getProductLabel(state.products).toLowerCase()} proposal`, 22, 178);
  pdf.text("crafted for your home — and your future.", 22, 185);

  const ry = 222;
  hairline(pdf, 22, ry, PW - 22, ry, ACCENT, 0.5);
  setDisplayFont(pdf, 7);
  setColor(pdf, ACCENT);
  trackedText(pdf, "PREPARED FOR", 22, ry + 7, { charSpace: 0.55 });

  let nameSize = 22;
  setDisplayFont(pdf, nameSize);
  const maxNameW = PW - 44;
  while (pdf.getTextWidth(names) > maxNameW && nameSize > 12) {
    nameSize -= 1;
    setDisplayFont(pdf, nameSize);
  }
  setColor(pdf, WHITE);
  pdf.text(names, 22, ry + 22);

  const credY = 256;
  hairline(pdf, 22, credY, PW - 22, credY, [80, 120, 85], 0.3);
  setDisplayFont(pdf, 6.5);
  setColor(pdf, [200, 215, 200]);
  const creds = ["LIFETIME WARRANTY", "GAF MASTER ELITE", "TOP-RATED CREWS", "LOCALLY OWNED"];
  const credSpacing = (PW - 44) / creds.length;
  creds.forEach((c, i) => {
    trackedText(pdf, c, 22 + credSpacing * (i + 0.5), credY + 7, { align: "center", charSpace: 0.4 });
    // Hairline dot between credentials keeps the row reading as one lockup.
    if (i < creds.length - 1) {
      setFill(pdf, [120, 155, 122]);
      pdf.circle(22 + credSpacing * (i + 1), credY + 5.6, 0.35, "F");
    }
  });

  setBodyFont(pdf, 7);
  setColor(pdf, [180, 200, 180]);
  trackedText(pdf, "DABELLA.US", 22, PH - 14, { charSpace: 0.6 });
  trackedText(pdf, "HOME IMPROVEMENT, EXPERTLY DONE", PW - 22, PH - 14, { align: "right", charSpace: 0.35 });
}
