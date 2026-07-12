import type { jsPDF } from "jspdf";
import type { EngineState, ComputedValues } from "@/types/engine";
import { fmt } from "@/lib/format";
import { getProductLabel } from "@/lib/engineHelpers";
import { getDefaultFeatureTexts } from "@/components/engine/presentation/constants";
import {
  ACCENT, BORDER, CARD, CREAM, FOREST_INK, GRAPHITE, INK,
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

export function drawAllOptionsIncludedComparison(
  pdf: jsPDF,
  state: EngineState,
  options: { key: "A" | "B" | "C"; name: string; price: number; monthly: number }[],
) {
  pageBg(pdf);

  sectionHeader(
    pdf,
    "What's Included · Side by Side",
    "Option A vs B vs C.",
    "Every column below is the complete included list for that option, including any custom edits made before sharing.",
  );

  const topY = RHYTHM.sectionTop;
  const columnGap = 5;
  const colW = (CONTENT_W - columnGap * 2) / 3;
  const colH = 190;
  const keys: ("A" | "B" | "C")[] = ["A", "B", "C"];

  keys.forEach((key, i) => {
    const opt = options.find((o) => o.key === key);
    const x = MARGIN + i * (colW + columnGap);
    const customKey = `customFeatures${key}` as keyof EngineState;
    const customTexts =
      (state[customKey] as string[] | undefined) &&
      (state[customKey] as string[]).length > 0
        ? (state[customKey] as string[])
        : null;
    const sharedTexts = state.customFeatures && state.customFeatures.length > 0 ? state.customFeatures : null;
    const defaultTexts = getDefaultFeatureTexts(state.products, state.roofMaterial, key);
    const features = customTexts ?? sharedTexts ?? defaultTexts;

    drawIncludedColumn(pdf, x, topY, colW, colH, key, opt?.name ?? `Option ${key}`, features);
  });
}

function drawIncludedColumn(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  key: "A" | "B" | "C",
  name: string,
  features: string[],
) {
  rounded(pdf, x, y, w, h, 3, CARD, BORDER);
  setFill(pdf, key === "A" ? LIME : key === "B" ? ACCENT : CREAM);
  pdf.rect(x, y, w, 1.2, "F");

  rounded(pdf, x + 5, y + 7, 24, 6.5, 3, key === "B" ? ACCENT : LIME);
  setDisplayFont(pdf, 6.2);
  setColor(pdf, key === "B" ? WHITE : FOREST_INK);
  trackedText(pdf, `OPTION ${key}`, x + 17, y + 11.4, { align: "center", charSpace: 0.35 });

  setDisplayFont(pdf, 9.5);
  setColor(pdf, FOREST_INK);
  const nameLines = pdf.splitTextToSize(name, w - 10).slice(0, 2);
  nameLines.forEach((line: string, idx: number) => pdf.text(line, x + 5, y + 21 + idx * 4.6));

  hairline(pdf, x + 5, y + 31, x + w - 5, y + 31, MIST, 0.3);

  let fy = y + 39;
  const bottomY = y + h - 8;
  features.forEach((text, idx) => {
    if (fy > bottomY) return;
    const remaining = bottomY - fy;
    const lines = pdf.splitTextToSize(text, w - 15);
    const visibleLines = lines.slice(0, remaining < 9 ? 1 : 2);

    setFill(pdf, LIME);
    pdf.circle(x + 6.5, fy - 1.3, 0.75, "F");
    setBodyFont(pdf, 7.2);
    setColor(pdf, INK);
    visibleLines.forEach((line: string, lineIdx: number) => {
      const suffix = lineIdx === visibleLines.length - 1 && visibleLines.length < lines.length ? "…" : "";
      pdf.text(`${line}${suffix}`, x + 10, fy + lineIdx * 3.7);
    });
    fy += visibleLines.length * 3.7 + (idx === features.length - 1 ? 0 : 2.9);
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

  // Price block (right) — draw first so we can clip the name to avoid overlap
  const rx = x + w - 8;

  setDisplayFont(pdf, 6.5);
  setColor(pdf, LIME_DEEP);
  trackedText(pdf, "AS LOW AS", rx, y + 10, { align: "right", charSpace: 0.5 });

  setDisplayFont(pdf, 20);
  setColor(pdf, FOREST_INK);
  const monthlyStr = fmt(opt.monthly);
  const monthlyW = pdf.getTextWidth(monthlyStr);
  pdf.text(monthlyStr, rx, y + 22, { align: "right" });

  // Option name — constrained, auto-shrink then wrap to prevent overlap
  const nameFull = `Option ${opt.key} · ${opt.name}`;
  const nameLeft = x + 8;
  const nameMaxW = Math.max(40, rx - monthlyW - 6 - nameLeft);
  let nameSize = 13;
  setDisplayFont(pdf, nameSize);
  setColor(pdf, FOREST_INK);
  while (nameSize > 9 && pdf.getTextWidth(nameFull) > nameMaxW) {
    nameSize -= 0.5;
    setDisplayFont(pdf, nameSize);
  }
  const nameLines = pdf.splitTextToSize(nameFull, nameMaxW).slice(0, 2);
  nameLines.forEach((ln: string, i: number) => {
    pdf.text(ln, nameLeft, y + 22 + i * (nameSize * 0.42));
  });

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
