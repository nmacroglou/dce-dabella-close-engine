import { jsPDF } from "jspdf";
import dabellaLogoUrl from "@/assets/dabella-logo.png";
import { loadImageDataUrl } from "./assets";
import { registerPdfFonts } from "./fonts";
import {
  ACCENT, CARD, CREAM, FOREST, FOREST_INK, GRAPHITE, INK, LIME, LIME_DEEP,
  MIST, NEGATIVE, PAPER, PH, POSITIVE, PW, SLATE, WHITE,
} from "./theme";
import {
  eyebrow, hairline, hairline as _h, pageBg, rect, rounded, sectionHeader,
  setBodyFont, setColor, setDisplayFont, setDraw, setFill, trackedText, vGradient,
} from "./primitives";
import {
  REPORT_TYPE_LABELS, prettyTag, type InspectionReportType, type InspectionSections,
} from "@/data/inspectionTemplates";
import type { RepInfo } from "./build";

export interface InspectionPhoto {
  signedUrl?: string;
  tags: string[];
  severity: "low" | "moderate" | "high" | null;
  caption: string | null;
}

export interface InspectionPdfInput {
  customerName: string;
  address: string;
  reportType: InspectionReportType;
  sections: InspectionSections;
  photos: InspectionPhoto[];
  rep?: RepInfo;
}

const SEV_COLOR = { low: SLATE, moderate: ACCENT, high: NEGATIVE } as const;
const SEV_LABEL = { low: "LOW", moderate: "MODERATE", high: "HIGH" } as const;

export async function buildInspectionPdf(input: InspectionPdfInput): Promise<{ blob: Blob; doc: jsPDF }> {
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
  const [, logoDataUrlRaw] = await Promise.all([
    registerPdfFonts(pdf),
    loadImageDataUrl(dabellaLogoUrl),
  ]);
  const logoDataUrl = logoDataUrlRaw ?? "";

  drawCover(pdf, input);

  pdf.addPage();
  drawSummary(pdf, input);

  await drawFindings(pdf, input);

  pdf.addPage();
  drawOpinion(pdf, input, logoDataUrl);

  drawFooters(pdf);

  return { blob: pdf.output("blob"), doc: pdf };
}

// ─── Cover ────────────────────────────────────────────────────
function drawCover(pdf: jsPDF, input: InspectionPdfInput) {
  vGradient(pdf, 0, 0, PW, PH, FOREST, FOREST_INK);

  pdf.setGState(pdf.GState({ opacity: 0.07 }));
  setFill(pdf, LIME);
  pdf.circle(180, 30, 90, "F");
  pdf.circle(-10, 230, 75, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));

  rect(pdf, 0, 0, PW, 0.6, ACCENT);

  setDisplayFont(pdf, 7);
  setColor(pdf, LIME);
  trackedText(pdf, "DABELLA", 22, 22, { charSpace: 0.7 });

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  setBodyFont(pdf, 7);
  setColor(pdf, [220, 230, 220]);
  trackedText(pdf, today.toUpperCase(), PW - 22, 22, { align: "right", charSpace: 0.45 });

  setDisplayFont(pdf, 8);
  setColor(pdf, LIME);
  trackedText(pdf, "PROFESSIONAL INSPECTION REPORT", 22, 100, { charSpace: 0.6 });

  setDisplayFont(pdf, 38);
  setColor(pdf, WHITE);
  pdf.text(REPORT_TYPE_LABELS[input.reportType], 22, 132);
  pdf.text("& Home Protection", 22, 154);

  setFill(pdf, ACCENT);
  pdf.rect(22, 162, 30, 1.2, "F");

  setBodyFont(pdf, 10.5);
  setColor(pdf, [220, 232, 220]);
  pdf.text("An honest, photo-by-photo review of your home —", 22, 178);
  pdf.text("with recommendations to protect what matters most.", 22, 185);

  const ry = 222;
  hairline(pdf, 22, ry, PW - 22, ry, ACCENT, 0.5);
  setDisplayFont(pdf, 7);
  setColor(pdf, ACCENT);
  trackedText(pdf, "PREPARED FOR", 22, ry + 7, { charSpace: 0.55 });

  setDisplayFont(pdf, 22);
  setColor(pdf, WHITE);
  pdf.text(input.customerName || "Homeowner", 22, ry + 22);

  if (input.address) {
    setBodyFont(pdf, 9);
    setColor(pdf, [200, 215, 200]);
    pdf.text(input.address, 22, ry + 30);
  }

  setBodyFont(pdf, 7);
  setColor(pdf, [180, 200, 180]);
  trackedText(pdf, "DABELLA.US", 22, PH - 14, { charSpace: 0.6 });
  trackedText(pdf, "HOME IMPROVEMENT, EXPERTLY DONE", PW - 22, PH - 14, { align: "right", charSpace: 0.35 });
}

// ─── Summary ──────────────────────────────────────────────────
function drawSummary(pdf: jsPDF, input: InspectionPdfInput) {
  pageBg(pdf);
  sectionHeader(pdf, "Section 1", "Executive Summary", "What we found, why it matters, and how to protect the home.");

  let y = 78;
  y = drawBlock(pdf, "Executive Summary", input.sections.executive_summary, y);
  y = drawBlock(pdf, "Inspection Scope", input.sections.inspection_scope, y);
  y = drawBlock(pdf, "Measurements", input.sections.measurements, y);
}

// ─── Findings (image grid) ────────────────────────────────────
async function drawFindings(pdf: jsPDF, input: InspectionPdfInput) {
  const photos = input.photos.filter((p) => p.signedUrl);
  if (photos.length === 0) return;

  pdf.addPage();
  pageBg(pdf);
  sectionHeader(pdf, "Section 2", "Findings", "Each photo below documents an observed condition.");

  let y = 78;
  const cardW = PW - 44;
  const cardH = 75;
  const imgW = 60;
  const imgH = 60;

  for (const photo of photos) {
    if (y + cardH > PH - 24) {
      pdf.addPage();
      pageBg(pdf);
      y = 22;
    }
    rounded(pdf, 22, y, cardW, cardH, 2, CARD, MIST);

    // Image
    try {
      if (photo.signedUrl) {
        const dataUrl = await loadImageDataUrl(photo.signedUrl);
        pdf.addImage(dataUrl, "JPEG", 26, y + 7.5, imgW, imgH, undefined, "FAST");
      }
    } catch (e) {
      console.warn("photo failed to render", e);
    }

    const tx = 26 + imgW + 8;
    const tw = cardW - imgW - 16;

    // Severity badge
    if (photo.severity) {
      const sevColor = SEV_COLOR[photo.severity];
      setFill(pdf, sevColor);
      pdf.roundedRect(tx, y + 7, 22, 5.5, 1.4, 1.4, "F");
      setDisplayFont(pdf, 6.5);
      setColor(pdf, WHITE);
      trackedText(pdf, SEV_LABEL[photo.severity], tx + 11, y + 10.8, { align: "center", charSpace: 0.4 });
    }

    // Caption
    setBodyFont(pdf, 9, "bold");
    setColor(pdf, INK);
    const captionLines = pdf.splitTextToSize(photo.caption || "Reference photo", tw);
    captionLines.slice(0, 3).forEach((ln: string, i: number) => pdf.text(ln, tx, y + 20 + i * 4.6));

    // Tags
    if (photo.tags.length > 0) {
      let tagY = y + 20 + Math.min(captionLines.length, 3) * 4.6 + 4;
      let tagX = tx;
      setDisplayFont(pdf, 6.5);
      photo.tags.slice(0, 6).forEach((tag) => {
        const label = prettyTag(tag).toUpperCase();
        const w = pdf.getTextWidth(label) + 6;
        if (tagX + w > tx + tw) {
          tagX = tx;
          tagY += 6;
        }
        rounded(pdf, tagX, tagY - 3.6, w, 4.6, 1, CREAM, MIST);
        setColor(pdf, LIME_DEEP);
        trackedText(pdf, label, tagX + 3, tagY, { charSpace: 0.35 });
        tagX += w + 2;
      });
    }

    y += cardH + 5;
  }
}

// ─── Professional Opinion + Welcome ───────────────────────────
function drawOpinion(pdf: jsPDF, input: InspectionPdfInput, logoDataUrl: string) {
  pageBg(pdf);
  sectionHeader(pdf, "Section 3", "Professional Opinion", "Our recommended path to protect the home long-term.");

  let y = 78;
  y = drawBlock(pdf, "Professional Opinion", input.sections.professional_opinion, y);
  y = drawBlock(pdf, "Recommended Scope", input.sections.recommended_scope, y);
  y = drawBlock(pdf, "Next Steps", input.sections.next_steps, y);
  y = drawBlock(pdf, "Limitations", input.sections.limitations, y);

  if (input.rep && (input.rep.name || input.rep.email || input.rep.phone)) {
    if (y + 30 > PH - 24) {
      pdf.addPage();
      pageBg(pdf);
      y = 22;
    }
    rounded(pdf, 22, y, PW - 44, 26, 2, FOREST_INK);
    try {
      pdf.addImage(logoDataUrl, "PNG", 27, y + 5, 16, 16);
    } catch { /* ignore */ }
    setDisplayFont(pdf, 9);
    setColor(pdf, LIME);
    trackedText(pdf, "YOUR DABELLA CONSULTANT", 48, y + 9, { charSpace: 0.5 });
    setBodyFont(pdf, 10, "bold");
    setColor(pdf, WHITE);
    pdf.text(input.rep.name || "DaBella Team", 48, y + 16);
    setBodyFont(pdf, 8);
    setColor(pdf, [200, 215, 200]);
    const contact = [input.rep.phone, input.rep.email].filter(Boolean).join("   ·   ");
    pdf.text(contact, 48, y + 21);
  }
}

// ─── Helpers ──────────────────────────────────────────────────
function drawBlock(pdf: jsPDF, heading: string, text: string, y: number): number {
  if (!text) return y;
  if (y + 24 > PH - 24) {
    pdf.addPage();
    pageBg(pdf);
    y = 22;
  }
  eyebrow(pdf, heading, 22, y, LIME_DEEP, 7);
  setBodyFont(pdf, 9.5);
  setColor(pdf, GRAPHITE);
  const lines = pdf.splitTextToSize(text, PW - 44);
  let cy = y + 6;
  for (const ln of lines) {
    if (cy > PH - 22) {
      pdf.addPage();
      pageBg(pdf);
      cy = 22;
    }
    pdf.text(ln, 22, cy);
    cy += 5;
  }
  return cy + 6;
}

function drawFooters(pdf: jsPDF) {
  const total = pdf.getNumberOfPages();
  for (let p = 2; p <= total; p++) {
    pdf.setPage(p);
    hairline(pdf, 22, PH - 16, PW - 22, PH - 16, MIST, 0.2);
    setDisplayFont(pdf, 6.5);
    setColor(pdf, SLATE);
    trackedText(pdf, "DABELLA · INSPECTION REPORT", 22, PH - 11, { charSpace: 0.45 });
    setBodyFont(pdf, 6.5);
    trackedText(
      pdf,
      `${String(p).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
      PW - 22, PH - 11,
      { align: "right", charSpace: 0.3 },
    );
  }
}
