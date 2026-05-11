import type { jsPDF } from "jspdf";
import {
  type RGB,
  ACCENT, FOREST_INK, GRAPHITE, LIME_DEEP, MIST, PAPER, PW,
  SLATE,
} from "./theme";

export type BodyFontStyle = "normal" | "bold" | "italic";

// ─── Color setters ────────────────────────────────────────────
export const setColor = (pdf: jsPDF, c: RGB) => pdf.setTextColor(c[0], c[1], c[2]);
export const setFill  = (pdf: jsPDF, c: RGB) => pdf.setFillColor(c[0], c[1], c[2]);
export const setDraw  = (pdf: jsPDF, c: RGB) => pdf.setDrawColor(c[0], c[1], c[2]);

// ─── Typography ───────────────────────────────────────────────
export function setDisplayFont(pdf: jsPDF, size: number) {
  pdf.setFont("ProposalSans", "bold");
  pdf.setFontSize(size);
}

export function setBodyFont(pdf: jsPDF, size: number, style: BodyFontStyle = "normal") {
  pdf.setFont("ProposalSans", style);
  pdf.setFontSize(size);
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
  pdf.text(text, x, y, { ...options, charSpace: safeCharSpace });
  pdf.setCharSpace(0);
}

export function eyebrow(
  pdf: jsPDF, text: string, x: number, y: number, color: RGB = SLATE, size = 7.5,
) {
  setDisplayFont(pdf, size);
  setColor(pdf, color);
  trackedText(pdf, text.toUpperCase(), x, y, { charSpace: 0.55 });
}

export function pageBg(pdf: jsPDF) {
  rect(pdf, 0, 0, PW, 297, PAPER);
}

// ─── Section header used on interior pages ────────────────────
export function sectionHeader(
  pdf: jsPDF, eyebrowText: string, title: string, subtitle?: string,
) {
  setFill(pdf, ACCENT);
  pdf.rect(22, 22, 14, 0.9, "F");

  setDisplayFont(pdf, 7.5);
  setColor(pdf, LIME_DEEP);
  trackedText(pdf, eyebrowText.toUpperCase(), 22, 30, { charSpace: 0.7 });

  setDisplayFont(pdf, 24);
  setColor(pdf, FOREST_INK);
  pdf.text(title, 22, 45);

  let dividerY = 65;
  if (subtitle) {
    setBodyFont(pdf, 9.5);
    setColor(pdf, GRAPHITE);
    const lines = pdf.splitTextToSize(subtitle, PW - 44);
    lines.forEach((ln: string, i: number) => pdf.text(ln, 22, 53 + i * 5.2));
    dividerY = 57 + lines.length * 5.2 + 4;
  }

  hairline(pdf, 22, dividerY, PW - 22, dividerY, MIST, 0.3);
}
