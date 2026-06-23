import { jsPDF } from "jspdf";
import dabellaLogoUrl from "@/assets/dabella-logo.png";
import { loadImageDataUrl } from "./assets";
import { registerPdfFonts } from "./fonts";
import {
  ACCENT, CARD, CREAM, FOREST, FOREST_INK, GRAPHITE, INK, LIME, LIME_DEEP,
  MIST, NEGATIVE, PH, PW, SLATE, WHITE,
} from "./theme";
import {
  eyebrow, hairline, pageBg, rect, rounded, sectionHeader,
  setBodyFont, setColor, setDisplayFont, setFill, trackedText, vGradient,
} from "./primitives";
import {
  REPORT_TYPE_LABELS, combinedReportLabel, prettyTag,
  type InspectionReportType, type InspectionSections,
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
  /** Single report type (legacy) — pass `reportTypes` for multi-trade reports. */
  reportType?: InspectionReportType;
  reportTypes?: InspectionReportType[];
  sections: InspectionSections;
  photos: InspectionPhoto[];
  rep?: RepInfo;
}

function resolveReportTypes(input: InspectionPdfInput): InspectionReportType[] {
  if (input.reportTypes && input.reportTypes.length) return input.reportTypes;
  if (input.reportType) return [input.reportType];
  return ["roof"];
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

  const cardW = PW - 44;
  const cardX = 22;
  const padX = 5;
  const imgW = 62;
  const imgH = 62;
  const gap = 7;
  const tx = cardX + padX + imgW + gap;
  const tw = cardW - padX * 2 - imgW - gap;
  const captionLine = 4.9;
  const tagH = 5.2;
  const tagGapX = 2;
  const tagGapY = 2;
  const sevH = 6;
  const minCardH = imgH + padX * 2 + 4; // image-driven floor

  let y = 78;

  for (const photo of photos) {
    // Pre-measure caption + tags so the card hugs its content.
    setBodyFont(pdf, 9.5, "bold");
    const captionRaw = photo.caption || "Reference photo";
    const captionLines: string[] = pdf.splitTextToSize(captionRaw, tw).slice(0, 4);

    setDisplayFont(pdf, 7);
    const TAG_CHAR_SPACE = 0.4;
    const TAG_PAD_X = 4; // mm per side inside chip
    const tagPieces = (photo.tags || []).map((t) => {
      const label = prettyTag(t).toUpperCase();
      // getTextWidth ignores charSpace, so add it back per gap so the chip
      // border actually wraps the rendered glyphs.
      const trackedW =
        pdf.getTextWidth(label) + Math.max(0, label.length - 1) * TAG_CHAR_SPACE;
      return { label, w: Math.min(trackedW + TAG_PAD_X * 2, tw) };
    });

    // Lay tag rows
    const tagRows: { label: string; w: number; x: number }[][] = [];
    let row: typeof tagRows[number] = [];
    let rowW = 0;
    const maxTagRows = 3;
    let overflow = 0;
    for (let i = 0; i < tagPieces.length; i++) {
      const p = tagPieces[i];
      const next = rowW === 0 ? p.w : rowW + tagGapX + p.w;
      if (next > tw) {
        if (row.length) tagRows.push(row);
        if (tagRows.length >= maxTagRows) { overflow = tagPieces.length - i; break; }
        row = [{ ...p, x: 0 }];
        rowW = p.w;
      } else {
        row.push({ ...p, x: rowW === 0 ? 0 : rowW + tagGapX });
        rowW = next;
      }
    }
    if (row.length && tagRows.length < maxTagRows) tagRows.push(row);

    const captionH = captionLines.length * captionLine;
    const tagsBlockH = tagRows.length * tagH + Math.max(0, tagRows.length - 1) * tagGapY;
    const textBlockH = sevH + 4 + captionH + (tagRows.length ? 4 + tagsBlockH : 0);
    const cardH = Math.max(minCardH, padX * 2 + textBlockH);

    if (y + cardH > PH - 24) {
      pdf.addPage();
      pageBg(pdf);
      y = 22;
    }

    // Card shell
    rounded(pdf, cardX, y, cardW, cardH, 2.4, CARD, MIST);

    // Image
    try {
      if (photo.signedUrl) {
        const dataUrl = await loadImageDataUrl(photo.signedUrl);
        if (dataUrl) pdf.addImage(dataUrl, "JPEG", cardX + padX, y + padX, imgW, imgH, undefined, "FAST");
      }
    } catch (e) {
      console.warn("photo failed to render", e);
    }

    let cursorY = y + padX;

    // Severity badge
    if (photo.severity) {
      const sevColor = SEV_COLOR[photo.severity];
      const badgeW = 26;
      setFill(pdf, sevColor);
      pdf.roundedRect(tx, cursorY, badgeW, sevH, 1.6, 1.6, "F");
      setDisplayFont(pdf, 7);
      setColor(pdf, WHITE);
      trackedText(pdf, SEV_LABEL[photo.severity], tx + badgeW / 2, cursorY + 4.1, {
        align: "center", charSpace: 0.5,
      });
    }
    cursorY += sevH + 4;

    // Caption
    setBodyFont(pdf, 9.5, "bold");
    setColor(pdf, INK);
    captionLines.forEach((ln, i) => pdf.text(ln, tx, cursorY + 3.6 + i * captionLine));
    cursorY += captionH;

    // Tags
    if (tagRows.length) {
      cursorY += 4;
      setDisplayFont(pdf, 7);
      tagRows.forEach((rw, ri) => {
        const ry2 = cursorY + ri * (tagH + tagGapY);
        rw.forEach((chip) => {
          rounded(pdf, tx + chip.x, ry2, chip.w, tagH, 1.2, CREAM, MIST);
          setColor(pdf, LIME_DEEP);
          trackedText(pdf, chip.label, tx + chip.x + TAG_PAD_X, ry2 + 3.6, {
            charSpace: TAG_CHAR_SPACE,
          });
        });
      });
      if (overflow > 0) {
        const lastRow = tagRows[tagRows.length - 1];
        const usedW = lastRow.reduce((acc, c) => Math.max(acc, c.x + c.w), 0);
        const overflowLabel = `+${overflow}`;
        setDisplayFont(pdf, 7);
        const ow =
          pdf.getTextWidth(overflowLabel) +
          Math.max(0, overflowLabel.length - 1) * 0.3 +
          TAG_PAD_X * 2;
        if (usedW + tagGapX + ow <= tw) {
          const ry2 = cursorY + (tagRows.length - 1) * (tagH + tagGapY);
          setColor(pdf, SLATE);
          trackedText(pdf, overflowLabel, tx + usedW + tagGapX + TAG_PAD_X, ry2 + 3.6, {
            charSpace: 0.3,
          });
        }
      }
    }

    y += cardH + 6;
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
    const bannerH = 30;
    if (y + bannerH + 4 > PH - 24) {
      pdf.addPage();
      pageBg(pdf);
      y = 22;
    }
    rounded(pdf, 22, y, PW - 44, bannerH, 2, FOREST_INK);

    // Reserved logo slot — aspect-preserved, never overlaps text.
    const slotX = 28;
    const slotW = 22;
    const slotH = 14;
    const textX = slotX + slotW + 10;
    try {
      if (logoDataUrl) {
        const props = pdf.getImageProperties(logoDataUrl);
        const ratio = props.width / props.height;
        let lw = slotH * ratio;
        let lh = slotH;
        if (lw > slotW) { lw = slotW; lh = slotW / ratio; }
        const lx = slotX + (slotW - lw) / 2;
        const ly = y + (bannerH - lh) / 2;
        pdf.addImage(logoDataUrl, "PNG", lx, ly, lw, lh);
      }
    } catch { /* ignore */ }

    // Subtle divider between logo slot and text block
    hairline(pdf, slotX + slotW + 4, y + 7, slotX + slotW + 4, y + bannerH - 7, [60, 95, 65], 0.25);

    setDisplayFont(pdf, 7.5);
    setColor(pdf, LIME);
    trackedText(pdf, "YOUR DABELLA CONSULTANT", textX, y + 10, { charSpace: 0.55 });
    setBodyFont(pdf, 10.5, "bold");
    setColor(pdf, WHITE);
    pdf.text(input.rep.name || "DaBella Team", textX, y + 18);
    setBodyFont(pdf, 8.5);
    setColor(pdf, [200, 215, 200]);
    const contact = [input.rep.phone, input.rep.email].filter(Boolean).join("   ·   ");
    pdf.text(contact, textX, y + 24);
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
  eyebrow(pdf, heading, 22, y, LIME_DEEP, 7.5);
  setBodyFont(pdf, 10);
  setColor(pdf, GRAPHITE);
  const lines = pdf.splitTextToSize(text, PW - 44);
  let cy = y + 7;
  for (const ln of lines) {
    if (cy > PH - 22) {
      pdf.addPage();
      pageBg(pdf);
      cy = 22;
    }
    pdf.text(ln, 22, cy);
    cy += 5.4;
  }
  return cy + 7;
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
