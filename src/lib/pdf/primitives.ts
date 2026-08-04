import type { jsPDF } from "jspdf";
import {
  type RGB,
  ACCENT, FOREST_INK, GRAPHITE, LIME_DEEP, MIST, PAPER, PH, PW,
  SLATE,
} from "./theme";

export type BodyFontStyle = "normal" | "bold" | "italic";

// ─── Color setters ────────────────────────────────────────────
export const setColor = (pdf: jsPDF, c: RGB) => pdf.setTextColor(c[0], c[1], c[2]);
export const setFill  = (pdf: jsPDF, c: RGB) => pdf.setFillColor(c[0], c[1], c[2]);
export const setDraw  = (pdf: jsPDF, c: RGB) => pdf.setDrawColor(c[0], c[1], c[2]);

// ─── Typography ───────────────────────────────────────────────
/** Plus Jakarta Sans ExtraBold — headlines, eyebrows, big numbers. */
export function setDisplayFont(pdf: jsPDF, size: number) {
  pdf.setFont("ProposalDisplay", "bold");
  pdf.setFontSize(size);
}

/** Plus Jakarta Sans Bold — slightly quieter display weight. */
export function setDisplaySoftFont(pdf: jsPDF, size: number) {
  pdf.setFont("ProposalDisplay", "normal");
  pdf.setFontSize(size);
}

/** Inter SemiBold — emphasis inside body copy without shouting. */
export function setMediumFont(pdf: jsPDF, size: number) {
  pdf.setFont("ProposalSansMed", "normal");
  pdf.setFontSize(size);
}

/** Inter — body copy, labels, tabular data. */
export function setBodyFont(pdf: jsPDF, size: number, style: BodyFontStyle = "normal") {
  pdf.setFont("ProposalSans", style);
  pdf.setFontSize(size);
}

/**
 * Shrink the current font until `text` fits within `maxW`, never going below
 * `min`. Returns the size actually applied.
 */
export function fitFontSize(pdf: jsPDF, text: string, maxW: number, start: number, min = 7) {
  let size = start;
  pdf.setFontSize(size);
  while (size > min && pdf.getTextWidth(text) > maxW) {
    size -= 0.4;
    pdf.setFontSize(size);
  }
  return size;
}


// ─── Shapes ───────────────────────────────────────────────────
export function rect(pdf: jsPDF, x: number, y: number, w: number, h: number, fill: RGB) {
  setFill(pdf, fill);
  pdf.rect(x, y, w, h, "F");
}

export function rounded(
  pdf: jsPDF, x: number, y: number, w: number, h: number, r: number,
  fill: RGB, stroke?: RGB,
) {
  setFill(pdf, fill);
  if (stroke) {
    setDraw(pdf, stroke);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, y, w, h, r, r, "FD");
  } else {
    pdf.roundedRect(x, y, w, h, r, r, "F");
  }
}

export function shadow(
  pdf: jsPDF, x: number, y: number, w: number, h: number, r: number, opacity = 0.10,
) {
  pdf.setGState(pdf.GState({ opacity }));
  setFill(pdf, FOREST_INK);
  pdf.roundedRect(x + 0.8, y + 1.6, w, h, r, r, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));
}

export function vGradient(
  pdf: jsPDF, x: number, y: number, w: number, h: number,
  top: RGB, bottom: RGB, steps = 40,
) {
  const sh = h / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = Math.round(top[0] + (bottom[0] - top[0]) * t);
    const g = Math.round(top[1] + (bottom[1] - top[1]) * t);
    const b = Math.round(top[2] + (bottom[2] - top[2]) * t);
    pdf.setFillColor(r, g, b);
    pdf.rect(x, y + i * sh, w, sh + 0.3, "F");
  }
}

export function hairline(
  pdf: jsPDF, x1: number, y1: number, x2: number, y2: number, c: RGB, w = 0.2,
) {
  setDraw(pdf, c);
  pdf.setLineWidth(w);
  pdf.line(x1, y1, x2, y2);
}

// ─── Text helpers ─────────────────────────────────────────────
type TextOpts = Parameters<jsPDF["text"]>[3] & { charSpace?: number };

export function trackedText(
  pdf: jsPDF, text: string, x: number, y: number, options?: TextOpts,
) {
  const safeCharSpace = Math.min(Math.max(options?.charSpace ?? 0, 0), 0.8);
  const align = options?.align;
  if (align === "right" || align === "center") {
    // Place tracked text manually: jsPDF's own alignment maths drifts once
    // letter-spacing is applied, which pushed right-aligned labels off-page.
    const w = pdf.getTextWidth(text) + safeCharSpace * Math.max(text.length - 1, 0);
    const ax = align === "right" ? x - w : x - w / 2;
    pdf.text(text, ax, y, { ...options, align: "left", charSpace: safeCharSpace });
  } else {
    pdf.text(text, x, y, { ...options, charSpace: safeCharSpace });
  }
  pdf.setCharSpace(0);
}



export function eyebrow(
  pdf: jsPDF, text: string, x: number, y: number, color: RGB = SLATE, size = 7.5,
) {
  setDisplayFont(pdf, size);
  setColor(pdf, color);
  trackedText(pdf, text.toUpperCase(), x, y, { charSpace: 0.45 });
}

/** Small filled capsule with uppercase label — status chips, option tags. */
export function pill(
  pdf: jsPDF, text: string, x: number, y: number,
  fill: RGB, textColor: RGB, size = 6.6, padX = 3.4,
) {
  setDisplayFont(pdf, size);
  const w = pdf.getTextWidth(text.toUpperCase()) + padX * 2 + size * 0.12;
  const h = size * 0.62 + 3.2;
  setFill(pdf, fill);
  pdf.roundedRect(x, y - h + 1.4, w, h, h / 2, h / 2, "F");
  setColor(pdf, textColor);
  trackedText(pdf, text.toUpperCase(), x + padX, y - 1.1, { charSpace: 0.3 });
  return w;
}


export function pageBg(pdf: jsPDF) {
  rect(pdf, 0, 0, PW, PH, PAPER);
}

/**
 * Dark forest gradient panel with a brass hairline along its top edge —
 * used for the price hero, the cost-of-waiting band, and the welcome page.
 */
export function heroBand(
  pdf: jsPDF, x: number, y: number, w: number, h: number, r = 4,
  topRgb: RGB = [27, 64, 30], bottomRgb: RGB = [12, 30, 14],
) {
  shadow(pdf, x, y, w, h, r, 0.12);
  vGradient(pdf, x, y, w, h, topRgb, bottomRgb);
  setFill(pdf, ACCENT);
  pdf.rect(x, y, w, 0.7, "F");
}

// ─── Section header used on interior pages ────────────────────
export function sectionHeader(
  pdf: jsPDF, eyebrowText: string, title: string, subtitle?: string,
) {
  // Accent tick + eyebrow, set on a common baseline for a steady rhythm.
  setFill(pdf, ACCENT);
  pdf.roundedRect(22, 26.4, 2.2, 3.4, 1.1, 1.1, "F");

  setDisplayFont(pdf, 7);
  setColor(pdf, LIME_DEEP);
  trackedText(pdf, eyebrowText.toUpperCase(), 27, 29.4, { charSpace: 0.6 });

  // Headline auto-shrinks so long section titles never run off the page.
  setDisplayFont(pdf, 24);
  fitFontSize(pdf, title, PW - 44, 24, 15);
  setColor(pdf, FOREST_INK);
  pdf.text(title, 22, 45);

  let dividerY = 55;
  if (subtitle) {
    setBodyFont(pdf, 9.2);
    setColor(pdf, GRAPHITE);
    // Keep the deck narrow — long measures read poorly at this size.
    const lines = pdf.splitTextToSize(subtitle, Math.min(PW - 44, 148)) as string[];
    lines.forEach((ln, i) => pdf.text(ln, 22, 53 + i * 5.1));
    dividerY = 53 + (lines.length - 1) * 5.1 + 7.5;
  }

  hairline(pdf, 22, dividerY, PW - 22, dividerY, MIST, 0.35);
  // Short accent overlay on the rule anchors the eye at the left margin.
  hairline(pdf, 22, dividerY, 40, dividerY, ACCENT, 0.6);
}

/** Consistent editorial footer shared by every report family. */
export function reportFooter(
  pdf: jsPDF, page: number, total: number, left: string, center = "",
) {
  hairline(pdf, 22, PH - 16.5, PW - 22, PH - 16.5, MIST, 0.25);
  setDisplayFont(pdf, 6.4);
  setColor(pdf, SLATE);
  trackedText(pdf, left.toUpperCase(), 22, PH - 11.6, { charSpace: 0.5 });

  if (center) {
    setBodyFont(pdf, 6.4);
    setColor(pdf, SLATE);
    const short = (pdf.splitTextToSize(center, 88) as string[])[0] ?? "";
    pdf.text(short, PW / 2, PH - 11.6, { align: "center" });
  }

  setBodyFont(pdf, 6.4);
  setColor(pdf, SLATE);
  trackedText(
    pdf,
    `${String(page).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    PW - 22, PH - 11.6,
    { align: "right", charSpace: 0.3 },
  );
}


