import type { jsPDF } from "jspdf";
import type { EngineState, ComputedValues } from "@/types/engine";
import { fmt } from "@/lib/format";
import { getOptionLabel, getOptionMetrics } from "@/lib/engineHelpers";
import {
  ACCENT, BORDER, CARD, CREAM, FOREST_INK, GRAPHITE, LIME, LIME_DEEP,
  NEG_SOFT, NEGATIVE, PW, SLATE,
} from "../theme";
import { COL_LEFT_X, COL_RIGHT_X, CONTENT_W, HALF_W, MARGIN, RHYTHM } from "../layout";
import {
  eyebrow, pageBg, rounded, sectionHeader, setBodyFont, setColor,
  setDisplayFont, setDraw, setFill, shadow, trackedText, vGradient,
} from "../primitives";

export function drawTClose(
  pdf: jsPDF, state: EngineState, computed: ComputedValues, selectedKey: "A" | "B" | "C",
) {
  pageBg(pdf);
  const m = getOptionMetrics(selectedKey, computed);
  const label = getOptionLabel(selectedKey, state);
  const futurePrice = m.price + m.inflationPenalty;

  sectionHeader(
    pdf,
    "The Cost of Waiting",
    "Lock In. Or Lose Out.",
    `Option ${selectedKey} · ${label} — here's why acting today is worth more than tomorrow.`,
  );

  const qy = 78;
  rounded(pdf, 22, qy, PW - 44, 28, 3, CREAM);
  setFill(pdf, ACCENT);
  pdf.rect(22, qy, 1.4, 28, "F");

  setBodyFont(pdf, 11, "italic");
  setColor(pdf, FOREST_INK);
  const quote = pdf.splitTextToSize(
    '"Most people aren\'t deciding if they\'re doing the project. They\'re deciding whether the money feels right."',
    PW - 60,
  );
  quote.forEach((ln: string, i: number) => pdf.text(ln, 30, qy + 12 + i * 5));

  const py = 118;
  const pH = 60;
  const halfW = (PW - 44 - 8) / 2;

  rounded(pdf, 22, py, halfW, pH, 3, CARD, BORDER);
  setFill(pdf, LIME);
  pdf.rect(22, py, halfW, 1.2, "F");
  eyebrow(pdf, "Today's Price · Locked", 28, py + 11, LIME_DEEP, 7);
  setDisplayFont(pdf, 30);
  setColor(pdf, FOREST_INK);
  pdf.text(fmt(m.price), 22 + halfW / 2, py + 36, { align: "center" });
  setBodyFont(pdf, 8);
  setColor(pdf, SLATE);
  pdf.text("Price guaranteed at signing", 22 + halfW / 2, py + 48, { align: "center" });

  const fx = 22 + halfW + 8;
  rounded(pdf, fx, py, halfW, pH, 3, CARD, BORDER);
  setFill(pdf, NEGATIVE);
  pdf.rect(fx, py, halfW, 1.2, "F");
  eyebrow(pdf, "Same Project · 10 Years", fx + 6, py + 11, NEGATIVE, 7);
  setDisplayFont(pdf, 30);
  setColor(pdf, NEGATIVE);
  pdf.text(fmt(futurePrice), fx + halfW / 2, py + 36, { align: "center" });
  setBodyFont(pdf, 8);
  setColor(pdf, SLATE);
  pdf.text("8% material inflation, compounded", fx + halfW / 2, py + 48, { align: "center" });

  const cy = py + pH + 14;
  shadow(pdf, 38, cy, PW - 76, 50, 4, 0.10);
  vGradient(pdf, 38, cy, PW - 76, 50, [255, 240, 240], NEG_SOFT);
  setDraw(pdf, [240, 180, 180]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(38, cy, PW - 76, 50, 4, 4, "S");

  setDisplayFont(pdf, 8);
  setColor(pdf, NEGATIVE);
  trackedText(pdf, "COST OF WAITING", PW / 2, cy + 11, { align: "center", charSpace: 0.7 });

  setDisplayFont(pdf, 34);
  setColor(pdf, NEGATIVE);
  pdf.text(`+${fmt(m.inflationPenalty)}`, PW / 2, cy + 35, { align: "center" });

  setBodyFont(pdf, 8.5);
  setColor(pdf, GRAPHITE);
  pdf.text(`${fmt(futurePrice)} − ${fmt(m.price)} = the price of hesitation`, PW / 2, cy + 44, { align: "center" });
  void PH;
}
