import type { jsPDF } from "jspdf";
import type { EngineState, ComputedValues } from "@/types/engine";
import { fmt } from "@/lib/format";
import { getOptionLabel, getOptionMetrics } from "@/lib/engineHelpers";
import {
  type RGB,
  ACCENT, FOREST, FOREST_INK, LIME, MIST, NEG_SOFT, NEGATIVE, POS_SOFT,
  POSITIVE, PW, SLATE, WHITE,
} from "../theme";
import {
  eyebrow, hairline, pageBg, rounded, sectionHeader, setBodyFont, setColor,
  setDisplayFont, setFill, shadow, trackedText, vGradient,
} from "../primitives";

export function drawFinancialImpact(
  pdf: jsPDF, state: EngineState, computed: ComputedValues, selectedKey: "A" | "B" | "C",
) {
  pageBg(pdf);
  const m = getOptionMetrics(selectedKey, computed);
  const label = getOptionLabel(selectedKey, state);

  sectionHeader(
    pdf,
    "10-Year Outlook",
    "The Full Picture.",
    `Option ${selectedKey} · ${label} — what happens if you move forward, vs. if you don't.`,
  );

  const ty = 78;
  const tableW = PW - 44;
  const colForward = 22 + tableW * 0.62;
  const colNothing = 22 + tableW;

  setDisplayFont(pdf, 7);
  setColor(pdf, SLATE);
  trackedText(pdf, "CATEGORY", 22, ty, { charSpace: 0.35 });
  setColor(pdf, POSITIVE);
  trackedText(pdf, "MOVE FORWARD", colForward, ty, { charSpace: 0.35 });
  setColor(pdf, NEGATIVE);
  trackedText(pdf, "DO NOTHING", colNothing, ty, { align: "right", charSpace: 0.35 });

  hairline(pdf, 22, ty + 3, PW - 22, ty + 3, FOREST_INK, 0.4);

  const rows = [
    {
      label: "Home Value Increase",
      hint: `${state.roiPercent}% ROI on ${fmt(m.price)}`,
      forward: `+${fmt(m.roi)}`,
      nothing: "$0",
      forwardColor: POSITIVE as RGB,
      nothingColor: SLATE as RGB,
    },
    {
      label: "Energy Savings (10yr)",
      hint: `${state.energySavingsPct}% of ${fmt(state.monthlyBill)}/mo × 120`,
      forward: `+${fmt(computed.energySavings)}`,
      nothing: `−${fmt(computed.tenYearCost)}`,
      forwardColor: POSITIVE as RGB,
      nothingColor: NEGATIVE as RGB,
    },
    {
      label: "Price Lock Savings",
      hint: "8% annual material inflation, 10yr",
      forward: `+${fmt(m.lockedInSavings)}`,
      nothing: `−${fmt(m.inflationPenalty)}`,
      forwardColor: POSITIVE as RGB,
      nothingColor: NEGATIVE as RGB,
    },
  ];

  let y = ty + 12;
  rows.forEach((r) => {
    setDisplayFont(pdf, 10);
    setColor(pdf, FOREST_INK);
    pdf.text(r.label, 22, y);

    setBodyFont(pdf, 7.5);
    setColor(pdf, SLATE);
    pdf.text(r.hint, 22, y + 5);

    setDisplayFont(pdf, 13);
    setColor(pdf, r.forwardColor);
    pdf.text(r.forward, colForward, y + 2);

    setColor(pdf, r.nothingColor);
    pdf.text(r.nothing, colNothing, y + 2, { align: "right" });

    hairline(pdf, 22, y + 11, PW - 22, y + 11, MIST, 0.2);
    y += 18;
  });

  y += 6;
  const halfW = (PW - 44 - 8) / 2;
  const tH = 36;

  rounded(pdf, 22, y, halfW, tH, 3, POS_SOFT, [180, 220, 185]);
  eyebrow(pdf, "Move Forward", 28, y + 10, POSITIVE, 7);
  setDisplayFont(pdf, 22);
  setColor(pdf, FOREST_INK);
  pdf.text(`+${fmt(m.moveForward)}`, 22 + halfW / 2, y + 26, { align: "center" });

  const dx = 22 + halfW + 8;
  rounded(pdf, dx, y, halfW, tH, 3, NEG_SOFT, [240, 180, 180]);
  eyebrow(pdf, "Do Nothing", dx + 6, y + 10, NEGATIVE, 7);
  setDisplayFont(pdf, 22);
  setColor(pdf, FOREST_INK);
  pdf.text(fmt(m.doNothing), dx + halfW / 2, y + 26, { align: "center" });

  y += tH + 12;
  shadow(pdf, 22, y, PW - 44, 42, 4, 0.12);
  vGradient(pdf, 22, y, PW - 44, 42, FOREST, FOREST_INK);
  setFill(pdf, ACCENT);
  pdf.rect(22, y, PW - 44, 0.7, "F");

  setDisplayFont(pdf, 7.5);
  setColor(pdf, LIME);
  trackedText(pdf, "NET ADVANTAGE OF MOVING FORWARD", PW / 2, y + 12, { align: "center", charSpace: 0.6 });

  setDisplayFont(pdf, 32);
  setColor(pdf, WHITE);
  pdf.text(`+${fmt(m.netDiff)}`, PW / 2, y + 32, { align: "center" });
}
