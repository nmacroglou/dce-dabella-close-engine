import type { jsPDF } from "jspdf";
import type { EngineState, ComputedValues } from "@/types/engine";
import { fmt } from "@/lib/format";
import { getProductLabel } from "@/lib/engineHelpers";
import { getDefaultFeatureTexts } from "@/components/engine/presentation/constants";
import {
  ACCENT, BORDER, CARD, FOREST_INK, GRAPHITE, INK,
  LIME, LIME_DEEP, MIST, PW, WHITE,
} from "../theme";
import { CONTENT_W, MARGIN, RHYTHM } from "../layout";
import {
  eyebrow, hairline, pageBg, rounded, sectionHeader,
  setBodyFont, setColor, setDisplayFont, setFill, trackedText,
} from "../primitives";

const BADGES: Record<string, string> = {
  A: "BEST VALUE",
  B: "MOST POPULAR",
  C: "SMART START",
};

export function drawAllOptions(
  pdf: jsPDF,
  state: EngineState,
  computed: ComputedValues,
  options: { key: "A" | "B" | "C"; name: string; price: number; monthly: number }[],
  originalComputed?: ComputedValues,
) {
  pageBg(pdf);

  sectionHeader(
    pdf,
    "Your Three Options",
    "Choose the plan that fits.",
    `Every option is a complete ${getProductLabel(state.products).toLowerCase()} system, backed by the same guarantees.`,
  );

  const startY = RHYTHM.sectionTop;
  const cardH = 62;
  const gap = 6;

  options.forEach((opt, i) => {
    const y = startY + i * (cardH + gap);
    drawOptionCard(pdf, state, computed, opt, y, cardH, originalComputed);
  });
}

function drawOptionCard(
  pdf: jsPDF,
  state: EngineState,
  computed: ComputedValues,
  opt: { key: "A" | "B" | "C"; name: string; price: number; monthly: number },
  y: number,
  h: number,
  originalComputed?: ComputedValues,
) {
  const x = MARGIN;
  const w = CONTENT_W;

  // Card frame
  rounded(pdf, x, y, w, h, 3, CARD, BORDER);
  setFill(pdf, LIME);
  pdf.rect(x, y, 1.4, h, "F");

  // Badge
  rounded(pdf, x + 8, y + 6, 34, 6.5, 3, ACCENT);
  setDisplayFont(pdf, 6.5);
  setColor(pdf, FOREST_INK);
  trackedText(pdf, BADGES[opt.key] || `OPTION ${opt.key}`, x + 25, y + 10.4, {
    align: "center",
    charSpace: 0.35,
  });

  // Option name
  setDisplayFont(pdf, 13);
  setColor(pdf, FOREST_INK);
  pdf.text(`Option ${opt.key} · ${opt.name}`, x + 8, y + 22);

  // Price block (right)
  const rx = x + w - 8;

  setDisplayFont(pdf, 6.5);
  setColor(pdf, LIME_DEEP);
  trackedText(pdf, "AS LOW AS", rx, y + 10, { align: "right", charSpace: 0.5 });

  setDisplayFont(pdf, 20);
  setColor(pdf, FOREST_INK);
  pdf.text(fmt(opt.monthly), rx, y + 22, { align: "right" });

  setBodyFont(pdf, 7);
  setColor(pdf, GRAPHITE);
  trackedText(pdf, "PER MONTH WITH FINANCING", rx, y + 27, {
    align: "right",
    charSpace: 0.35,
  });

  // Divider
  hairline(pdf, x + 8, y + 28, x + w - 8, y + 28, MIST, 0.3);

  // Total price + savings
  setBodyFont(pdf, 7.5);
  setColor(pdf, GRAPHITE);
  trackedText(pdf, "TOTAL INVESTMENT — TURNKEY", x + 8, y + 34, { charSpace: 0.4 });

  setDisplayFont(pdf, 16);
  setColor(pdf, INK);
  pdf.text(fmt(opt.price), x + 8, y + 44);

  const originalPrice = originalComputed?.options[opt.key]?.price;
  if (originalPrice && originalPrice > opt.price) {
    const savings = originalPrice - opt.price;
    const pct = Math.round((savings / originalPrice) * 100);
    setBodyFont(pdf, 7);
    setColor(pdf, LIME_DEEP);
    trackedText(
      pdf,
      `WAS ${fmt(originalPrice)}  ·  SAVE ${fmt(savings)} (${pct}% OFF)`,
      x + 8,
      y + 50,
      { charSpace: 0.35 },
    );
  }

  // Top 3 features (right column)
  const customKey = `customFeatures${opt.key}` as keyof EngineState;
  const customTexts =
    (state[customKey] as string[] | undefined) &&
    (state[customKey] as string[]).length > 0
      ? (state[customKey] as string[])
      : null;
  const defaultTexts = getDefaultFeatureTexts(state.products, state.roofMaterial, opt.key);
  const features = (customTexts ?? defaultTexts).slice(0, 3);

  eyebrow(pdf, "Included", x + w / 2 + 4, y + 34, LIME_DEEP, 6.5);

  let fy = y + 40;
  features.forEach((text) => {
    setFill(pdf, LIME);
    pdf.circle(x + w / 2 + 5, fy - 1.1, 0.8, "F");
    setBodyFont(pdf, 8);
    setColor(pdf, INK);
    const lines = pdf.splitTextToSize(text, w / 2 - 16);
    pdf.text(lines[0], x + w / 2 + 9, fy);
    fy += 5;
  });

  // subtle "compare" footnote for the best value badge
  if (opt.key === "A") {
    setBodyFont(pdf, 6.5);
    setColor(pdf, WHITE);
    // no-op reserved
  }
}
