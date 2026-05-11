import type { jsPDF } from "jspdf";
import type { EngineState, ComputedValues } from "@/types/engine";
import { fmt } from "@/lib/format";
import { getOptionMetrics, getProductLabel } from "@/lib/engineHelpers";
import { FEATURES_BY_OPTION } from "@/components/engine/presentation/constants";
import {
  type RGB,
  ACCENT, BORDER, CARD, CREAM, FOREST_INK, GRAPHITE, INK,
  LIME, LIME_DEEP, MIST, POSITIVE, PW, WHITE,
} from "../theme";
import { COL_LEFT_X, COL_RIGHT_X, CONTENT_W, HALF_W, MARGIN, RHYTHM } from "../layout";
import {
  eyebrow, hairline, heroBand, pageBg, rounded, sectionHeader, setBodyFont,
  setColor, setDisplayFont, setFill, trackedText,
} from "../primitives";

export function drawSelectedOption(
  pdf: jsPDF,
  state: EngineState,
  computed: ComputedValues,
  opt: { key: "A" | "B" | "C"; name: string; price: number; monthly: number },
) {
  pageBg(pdf);
  const BADGES: Record<string, string> = { A: "BEST VALUE", B: "MOST POPULAR", C: "SMART START" };

  sectionHeader(
    pdf,
    `Your Selection · Option ${opt.key}`,
    "Your Investment.",
    `A complete ${getProductLabel(state.products).toLowerCase()} system, tailored to your home and built to outlast it.`,
  );

  const heroY = 78;
  const heroH = 78;
  shadow(pdf, 22, heroY, PW - 44, heroH, 4, 0.12);
  vGradient(pdf, 22, heroY, PW - 44, heroH, FOREST, FOREST_INK);

  setFill(pdf, ACCENT);
  pdf.rect(22, heroY, PW - 44, 0.7, "F");

  rounded(pdf, 30, heroY + 10, 34, 6.5, 3, ACCENT);
  setDisplayFont(pdf, 6.5);
  setColor(pdf, FOREST_INK);
  trackedText(pdf, BADGES[opt.key] || "YOUR CHOICE", 47, heroY + 14.4, { align: "center", charSpace: 0.35 });

  setDisplayFont(pdf, 12);
  setColor(pdf, WHITE);
  pdf.text(opt.name, 30, heroY + 28);

  setDisplayFont(pdf, 34);
  setColor(pdf, WHITE);
  pdf.text(fmt(opt.price), 30, heroY + 56);

  setBodyFont(pdf, 8);
  setColor(pdf, [200, 220, 200]);
  trackedText(pdf, "TOTAL INVESTMENT — TURNKEY", 30, heroY + 65, { charSpace: 0.4 });

  const rx = PW - 30;
  hairline(pdf, rx - 60, heroY + 18, rx - 60, heroY + 70, [80, 120, 85], 0.3);

  setDisplayFont(pdf, 7);
  setColor(pdf, LIME);
  trackedText(pdf, "AS LOW AS", rx, heroY + 26, { align: "right", charSpace: 0.5 });

  setDisplayFont(pdf, 24);
  setColor(pdf, WHITE);
  pdf.text(fmt(opt.monthly), rx, heroY + 47, { align: "right" });

  setBodyFont(pdf, 7.5);
  setColor(pdf, [200, 220, 200]);
  trackedText(pdf, "PER MONTH WITH FINANCING", rx, heroY + 56, { align: "right", charSpace: 0.35 });

  const colY = heroY + heroH + 14;
  const gutter = 8;
  const colW = (PW - 44 - gutter) / 2;

  const featH = 100;
  rounded(pdf, 22, colY, colW, featH, 3, CARD, BORDER);
  setFill(pdf, LIME);
  pdf.rect(22, colY, 1.4, featH, "F");

  eyebrow(pdf, "What's Included", 30, colY + 10, LIME_DEEP, 7);
  setDisplayFont(pdf, 10.5);
  setColor(pdf, FOREST_INK);
  pdf.text("Every detail. Every guarantee.", 30, colY + 18);

  hairline(pdf, 30, colY + 22, 22 + colW - 8, colY + 22, MIST, 0.3);

  const customTexts = state.customFeatures && state.customFeatures.length > 0 ? state.customFeatures : null;
  const features = customTexts
    ? customTexts.map((text) => ({ text }))
    : (FEATURES_BY_OPTION[opt.key] || []);

  let fy = colY + 30;
  features.slice(0, 8).forEach((f) => {
    setFill(pdf, LIME);
    pdf.circle(31, fy - 1.2, 0.9, "F");
    setBodyFont(pdf, 8.5);
    setColor(pdf, INK);
    const lines = pdf.splitTextToSize(f.text, colW - 20);
    lines.slice(0, 2).forEach((ln: string, li: number) => pdf.text(ln, 35, fy + li * 4.2));
    fy += lines.slice(0, 2).length * 4.2 + 3.2;
  });

  const rxc = 22 + colW + gutter;
  rounded(pdf, rxc, colY, colW, featH, 3, CREAM, BORDER);
  setFill(pdf, ACCENT);
  pdf.rect(rxc, colY, 1.4, featH, "F");

  eyebrow(pdf, "Value Snapshot", rxc + 8, colY + 10, [150, 110, 20], 7);
  setDisplayFont(pdf, 10.5);
  setColor(pdf, FOREST_INK);
  pdf.text("What this earns you back.", rxc + 8, colY + 18);

  hairline(pdf, rxc + 8, colY + 22, rxc + colW - 8, colY + 22, MIST, 0.3);

  const optComputed = computed.options[opt.key];
  const optMetrics = getOptionMetrics(opt.key, computed);
  const rows: { label: string; value: string; valueColor?: RGB }[] = [
    { label: "Home value increase", value: `+${fmt(optComputed.roiValue)}`, valueColor: POSITIVE },
    { label: "10-yr energy savings", value: `+${fmt(computed.energySavings)}`, valueColor: POSITIVE },
    { label: "Inflation lock savings", value: `+${fmt(optMetrics.lockedInSavings)}`, valueColor: POSITIVE },
  ];

  let vy = colY + 32;
  rows.forEach((r) => {
    setBodyFont(pdf, 8.5);
    setColor(pdf, GRAPHITE);
    pdf.text(r.label, rxc + 8, vy);

    setDisplayFont(pdf, 9.5);
    setColor(pdf, r.valueColor || INK);
    pdf.text(r.value, rxc + colW - 8, vy, { align: "right" });

    hairline(pdf, rxc + 8, vy + 3, rxc + colW - 8, vy + 3, MIST, 0.2);
    vy += 10;
  });

  vy += 2;
  rounded(pdf, rxc + 6, vy, colW - 12, 18, 2, FOREST_INK);
  setDisplayFont(pdf, 6.5);
  setColor(pdf, LIME);
  trackedText(pdf, "NET EFFECTIVE COST", rxc + 12, vy + 7, { charSpace: 0.45 });
  setDisplayFont(pdf, 12.5);
  setColor(pdf, WHITE);
  pdf.text(fmt(optComputed.netCost), rxc + colW - 12, vy + 12, { align: "right" });
  void SLATE;
}
