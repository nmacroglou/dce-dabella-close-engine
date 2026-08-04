import { jsPDF } from "jspdf";
import dabellaLogoUrl from "@/assets/dabella-logo.png";
import { loadImageDataUrl } from "./assets";
import { registerPdfFonts } from "./fonts";
import {
  ACCENT, CARD, CREAM, FOREST, FOREST_INK, GRAPHITE, INK, LIME, LIME_DEEP,
  MIST, NEGATIVE, PH, PW, SLATE, WHITE,
} from "./theme";
import {
  eyebrow, hairline, pageBg, rect, reportFooter, rounded, sectionHeader,
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
  language?: "en" | "es";
}

function resolveReportTypes(input: InspectionPdfInput): InspectionReportType[] {
  if (input.reportTypes && input.reportTypes.length) return input.reportTypes;
  if (input.reportType) return [input.reportType];
  return ["roof"];
}

type Lang = "en" | "es";
const L = (lang: Lang, en: string, es: string) => (lang === "es" ? es : en);
const SEV_COLOR = { low: SLATE, moderate: ACCENT, high: NEGATIVE } as const;
const SEV_LABEL_EN = { low: "LOW", moderate: "MODERATE", high: "HIGH" } as const;
const SEV_LABEL_ES = { low: "BAJA", moderate: "MODERADA", high: "ALTA" } as const;


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

  pdf.addPage();
  drawWhyDaBella(pdf, input);

  drawFooters(pdf, (input.language ?? "en") as Lang, input.address);


  return { blob: pdf.output("blob"), doc: pdf };
}


// ─── Cover ────────────────────────────────────────────────────
function drawCover(pdf: jsPDF, input: InspectionPdfInput) {
  const lang = (input.language ?? "en") as Lang;
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

  const today = new Date().toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { year: "numeric", month: "long", day: "numeric" });
  setBodyFont(pdf, 7);
  setColor(pdf, [220, 230, 220]);
  trackedText(pdf, today.toUpperCase(), PW - 22, 22, { align: "right", charSpace: 0.45 });

  setDisplayFont(pdf, 8);
  setColor(pdf, LIME);
  trackedText(pdf, L(lang, "PROFESSIONAL INSPECTION REPORT", "INFORME DE INSPECCIÓN PROFESIONAL"), 22, 100, { charSpace: 0.6 });

  const titleTypes = resolveReportTypes(input);
  const title = combinedReportLabel(titleTypes, lang);
  // Scale down the headline when multiple trades are combined so it fits on one line.
  const titleSize = title.length > 28 ? 26 : title.length > 22 ? 30 : 38;
  setDisplayFont(pdf, titleSize);
  setColor(pdf, WHITE);
  pdf.text(title, 22, 132);
  pdf.text(L(lang, "& Home Protection", "y Protección del Hogar"), 22, 154);
  void REPORT_TYPE_LABELS;

  setFill(pdf, ACCENT);
  pdf.rect(22, 162, 30, 1.2, "F");

  setBodyFont(pdf, 10.5);
  setColor(pdf, [220, 232, 220]);
  pdf.text(L(lang, "An honest, photo-by-photo review of your home —", "Una revisión honesta, foto por foto, de su hogar —"), 22, 178);
  pdf.text(L(lang, "with recommendations to protect what matters most.", "con recomendaciones para proteger lo que más importa."), 22, 185);

  const ry = 222;
  hairline(pdf, 22, ry, PW - 22, ry, ACCENT, 0.5);
  setDisplayFont(pdf, 7);
  setColor(pdf, ACCENT);
  trackedText(pdf, L(lang, "PREPARED FOR", "PREPARADO PARA"), 22, ry + 7, { charSpace: 0.55 });

  setDisplayFont(pdf, 22);
  setColor(pdf, WHITE);
  pdf.text(input.customerName || L(lang, "Homeowner", "Propietario"), 22, ry + 22);

  if (input.address) {
    setBodyFont(pdf, 9);
    setColor(pdf, [200, 215, 200]);
    pdf.text(input.address, 22, ry + 30);
  }

  const credY = 256;
  hairline(pdf, 22, credY, PW - 22, credY, [80, 120, 85], 0.3);
  setDisplayFont(pdf, 6.5);
  setColor(pdf, [200, 215, 200]);
  const creds = lang === "es"
    ? ["GARANTÍA DE POR VIDA", "GAF MASTER ELITE", "EQUIPOS CERTIFICADOS", "EMPRESA FAMILIAR"]
    : ["LIFETIME WARRANTY", "GAF MASTER ELITE", "FACTORY-TRAINED CREWS", "FAMILY OWNED"];
  const credSpacing = (PW - 44) / creds.length;
  creds.forEach((c, i) => {
    trackedText(pdf, c, 22 + credSpacing * (i + 0.5), credY + 7, { align: "center", charSpace: 0.35 });
    if (i < creds.length - 1) {
      setFill(pdf, [120, 155, 122]);
      pdf.circle(22 + credSpacing * (i + 1), credY + 5.6, 0.35, "F");
    }
  });

  setBodyFont(pdf, 7);
  setColor(pdf, [180, 200, 180]);
  trackedText(pdf, "DABELLA.US", 22, PH - 14, { charSpace: 0.6 });
  trackedText(pdf, L(lang, "HOME IMPROVEMENT, EXPERTLY DONE", "MEJORAS DEL HOGAR, HECHAS CON MAESTRÍA"), PW - 22, PH - 14, { align: "right", charSpace: 0.35 });
}


// ─── Summary ──────────────────────────────────────────────────
function drawSummary(pdf: jsPDF, input: InspectionPdfInput) {
  const lang = (input.language ?? "en") as Lang;
  pageBg(pdf);
  sectionHeader(
    pdf,
    L(lang, "Section 1", "Sección 1"),
    L(lang, "Executive Summary", "Resumen Ejecutivo"),
    L(lang, "What we found, why it matters, and how to protect the home.", "Lo que encontramos, por qué importa y cómo proteger el hogar."),
  );

  let y = 78;
  y = drawGlanceStrip(pdf, input, y);
  y = drawBlock(pdf, L(lang, "Executive Summary", "Resumen Ejecutivo"), input.sections.executive_summary, y);
  y = drawBlock(pdf, L(lang, "Inspection Scope", "Alcance de la Inspección"), input.sections.inspection_scope, y);
  y = drawBlock(pdf, L(lang, "Measurements", "Mediciones"), input.sections.measurements, y);
}

/** Four-up stat strip summarising photo count and severity mix. */
function drawGlanceStrip(pdf: jsPDF, input: InspectionPdfInput, y: number) {
  const lang = (input.language ?? "en") as Lang;
  const photos = input.photos ?? [];
  if (!photos.length) return y;

  const count = (s: "low" | "moderate" | "high") =>
    photos.filter((p) => p.severity === s).length;

  const cells: { label: string; value: string; color: RGB }[] = [
    { label: L(lang, "Photos reviewed", "Fotos revisadas"), value: String(photos.length), color: FOREST_INK },
    { label: L(lang, "High priority", "Prioridad alta"), value: String(count("high")), color: NEGATIVE },
    { label: L(lang, "Moderate", "Moderada"), value: String(count("moderate")), color: ACCENT },
    { label: L(lang, "Low / monitor", "Baja / vigilar"), value: String(count("low")), color: SLATE },
  ];

  const stripW = PW - 44;
  const h = 24;
  const gap = 4;
  const cw = (stripW - gap * (cells.length - 1)) / cells.length;

  cells.forEach((c, i) => {
    const x = 22 + i * (cw + gap);
    rounded(pdf, x, y, cw, h, 2.4, CARD, MIST);
    setFill(pdf, c.color);
    pdf.rect(x, y + 3, 1.6, h - 6, "F");

    setDisplayFont(pdf, 17);
    setColor(pdf, c.color);
    pdf.text(c.value, x + 6, y + 13);

    setBodyFont(pdf, 6.6);
    setColor(pdf, SLATE);
    const lines = (pdf.splitTextToSize(c.label.toUpperCase(), cw - 10) as string[]).slice(0, 2);
    lines.forEach((ln, li) => trackedText(pdf, ln, x + 6, y + 18.4 + li * 3.4, { charSpace: 0.35 }));
  });

  return y + h + 10;
}



// ─── Findings (image grid) ────────────────────────────────────
async function drawFindings(pdf: jsPDF, input: InspectionPdfInput) {
  const photos = input.photos.filter((p) => p.signedUrl);
  if (photos.length === 0) return;

  const lang = (input.language ?? "en") as Lang;
  pdf.addPage();
  pageBg(pdf);
  sectionHeader(
    pdf,
    L(lang, "Section 2", "Sección 2"),
    L(lang, "Findings", "Hallazgos"),
    L(lang, "Each photo below documents an observed condition.", "Cada foto documenta una condición observada."),
  );


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
      trackedText(pdf, (lang === "es" ? SEV_LABEL_ES : SEV_LABEL_EN)[photo.severity], tx + badgeW / 2, cursorY + 4.1, {
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
  const lang = (input.language ?? "en") as Lang;
  pageBg(pdf);
  sectionHeader(
    pdf,
    L(lang, "Section 3", "Sección 3"),
    L(lang, "Professional Opinion", "Opinión Profesional"),
    L(lang, "Our recommended path to protect the home long-term.", "Nuestro camino recomendado para proteger el hogar a largo plazo."),
  );

  let y = 78;
  y = drawBlock(pdf, L(lang, "Professional Opinion", "Opinión Profesional"), input.sections.professional_opinion, y);
  y = drawBlock(pdf, L(lang, "Recommended Scope", "Alcance Recomendado"), input.sections.recommended_scope, y);
  y = drawBlock(pdf, L(lang, "Next Steps", "Próximos Pasos"), input.sections.next_steps, y);
  y = drawBlock(pdf, L(lang, "Limitations", "Limitaciones"), input.sections.limitations, y);

  if (input.rep && (input.rep.name || input.rep.email || input.rep.phone)) {
    const bannerH = 30;
    if (y + bannerH + 4 > PH - 24) {
      pdf.addPage();
      pageBg(pdf);
      y = 22;
    }
    rounded(pdf, 22, y, PW - 44, bannerH, 2, FOREST_INK);

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

    hairline(pdf, slotX + slotW + 4, y + 7, slotX + slotW + 4, y + bannerH - 7, [60, 95, 65], 0.25);

    setDisplayFont(pdf, 7.5);
    setColor(pdf, LIME);
    trackedText(pdf, L(lang, "YOUR DABELLA CONSULTANT", "SU CONSULTOR DABELLA"), textX, y + 10, { charSpace: 0.55 });
    setBodyFont(pdf, 10.5, "bold");
    setColor(pdf, WHITE);
    pdf.text(input.rep.name || L(lang, "DaBella Team", "Equipo DaBella"), textX, y + 18);
    setBodyFont(pdf, 8.5);
    setColor(pdf, [200, 215, 200]);
    const contact = [input.rep.phone, input.rep.email].filter(Boolean).join("   ·   ");
    pdf.text(contact, textX, y + 24);
  }
}


// ─── Why DaBella ───────────────────────────────────────────────
type RGB = readonly [number, number, number];

function drawReasonIcon(
  pdf: jsPDF,
  kind: "star" | "home" | "badge" | "shield" | "spark",
  cx: number,
  cy: number,
  color: RGB,
) {
  setFill(pdf, color);
  switch (kind) {
    case "star": {
      const outer = 5.2;
      const inner = outer * 0.42;
      const pts: [number, number][] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
      const rel: [number, number][] = [];
      for (let i = 1; i < pts.length; i++) {
        rel.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
      }
      rel.push([pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]]);
      pdf.lines(rel, pts[0][0], pts[0][1], [1, 1], "F", true);
      break;
    }
    case "home": {
      // Roof
      pdf.triangle(cx - 5.6, cy - 0.6, cx + 5.6, cy - 0.6, cx, cy - 5.8, "F");
      // Body
      pdf.rect(cx - 4.4, cy - 0.6, 8.8, 6.6, "F");
      // Heart (two overlapping circles + triangle) in contrast
      setFill(pdf, FOREST_INK);
      pdf.circle(cx - 1.1, cy + 1.6, 0.95, "F");
      pdf.circle(cx + 1.1, cy + 1.6, 0.95, "F");
      pdf.triangle(cx - 1.9, cy + 2.0, cx + 1.9, cy + 2.0, cx, cy + 4.1, "F");
      break;
    }
    case "badge": {
      // Ribbon tails
      pdf.triangle(cx - 3.2, cy + 1.8, cx - 4.2, cy + 5.4, cx - 1.6, cy + 3.4, "F");
      pdf.triangle(cx + 3.2, cy + 1.8, cx + 4.2, cy + 5.4, cx + 1.6, cy + 3.4, "F");
      // Medal
      pdf.circle(cx, cy - 0.4, 4.8, "F");
      // Inner check
      pdf.setDrawColor(FOREST_INK[0], FOREST_INK[1], FOREST_INK[2]);
      pdf.setLineWidth(1.0);
      pdf.setLineCap("round");
      pdf.setLineJoin("round");
      pdf.lines([[1.5, 1.6], [3.0, -3.6]], cx - 2.2, cy - 0.6);
      break;
    }
    case "shield": {
      const w = 8.4;
      const h = 10.4;
      const topH = h * 0.55;
      pdf.roundedRect(cx - w / 2, cy - h / 2, w, topH, 1.6, 1.6, "F");
      pdf.triangle(cx - w / 2, cy - h / 2 + topH, cx + w / 2, cy - h / 2 + topH, cx, cy + h / 2, "F");
      pdf.setDrawColor(FOREST_INK[0], FOREST_INK[1], FOREST_INK[2]);
      pdf.setLineWidth(1.1);
      pdf.setLineCap("round");
      pdf.setLineJoin("round");
      pdf.lines([[1.6, 1.8], [3.2, -4.0]], cx - 2.4, cy - 0.6);
      break;
    }
    case "spark": {
      // Four-point sparkle
      const s = 5.6;
      pdf.triangle(cx, cy - s, cx + s * 0.36, cy, cx, cy + s, "F");
      pdf.triangle(cx, cy - s, cx - s * 0.36, cy, cx, cy + s, "F");
      pdf.triangle(cx - s, cy, cx, cy + s * 0.36, cx + s, cy, "F");
      pdf.triangle(cx - s, cy, cx, cy - s * 0.36, cx + s, cy, "F");
      // Small companion sparkle
      const s2 = 2.0;
      pdf.triangle(cx + s + 1.4, cy - s * 0.5, cx + s + 1.4 + s2 * 0.36, cy - s * 0.5 + s2, cx + s + 1.4, cy - s * 0.5 + s2 * 2, "F");
      pdf.triangle(cx + s + 1.4, cy - s * 0.5, cx + s + 1.4 - s2 * 0.36, cy - s * 0.5 + s2, cx + s + 1.4, cy - s * 0.5 + s2 * 2, "F");
      pdf.triangle(cx + s - 0.6, cy - s * 0.5 + s2, cx + s + 1.4, cy - s * 0.5 + s2 + s2 * 0.36, cx + s + 3.4, cy - s * 0.5 + s2, "F");
      pdf.triangle(cx + s - 0.6, cy - s * 0.5 + s2, cx + s + 1.4, cy - s * 0.5 + s2 - s2 * 0.36, cx + s + 3.4, cy - s * 0.5 + s2, "F");
      break;
    }
  }
}

function drawWhyDaBella(pdf: jsPDF, input: InspectionPdfInput) {
  const lang = (input.language ?? "en") as Lang;
  pageBg(pdf);
  sectionHeader(
    pdf,
    L(lang, "Section 4", "Sección 4"),
    L(lang, "Why DaBella?", "¿Por qué DaBella?"),
    L(lang, "Five reasons homeowners choose us — and stay with us for life.", "Cinco razones por las que los propietarios nos eligen — y se quedan con nosotros de por vida."),
  );

  const reasons: Array<{
    icon: "star" | "home" | "badge" | "shield" | "spark";
    tile: RGB;
    iconColor: RGB;
    eyebrow: string;
    title: string;
    body: string;
  }> = [
    {
      icon: "star",
      tile: LIME,
      iconColor: FOREST_INK,
      eyebrow: L(lang, "REPUTATION", "REPUTACIÓN"),
      title: L(lang, "5-Star Reputation", "Reputación de 5 Estrellas"),
      body: L(lang, "Awarded the industry's highest homeowner ratings for quality, craftsmanship, and service.", "Galardonada con las calificaciones más altas de propietarios por calidad, artesanía y servicio."),
    },
    {
      icon: "home",
      tile: ACCENT,
      iconColor: WHITE,
      eyebrow: L(lang, "OUR ROOTS", "NUESTRAS RAÍCES"),
      title: L(lang, "Family Owned & Operated", "Propiedad y Operación Familiar"),
      body: L(lang, "A locally rooted company that treats every home and every homeowner like family.", "Una empresa con raíces locales que trata cada hogar y cada propietario como familia."),
    },
    {
      icon: "badge",
      tile: FOREST_INK,
      iconColor: LIME,
      eyebrow: L(lang, "CERTIFIED CREWS", "CUADROS CERTIFICADOS"),
      title: L(lang, "Factory-Trained Installers", "Instaladores Capacitados por la Fábrica"),
      body: L(lang, "Certified crews trained directly by the manufacturers we install — GAF Master Elite® and more.", "Cuadros certificados capacitados directamente por los fabricantes que instalamos, incluyendo GAF Master Elite®."),
    },
    {
      icon: "shield",
      tile: LIME_DEEP,
      iconColor: WHITE,
      eyebrow: L(lang, "PROTECTION", "PROTECCIÓN"),
      title: L(lang, "Best-in-Class Warranties", "Las Mejores Garantías de la Industria"),
      body: L(lang, "Golden Pledge® Lifetime Warranty and manufacturer-backed protection for long-term peace of mind.", "Garantía de por vida Golden Pledge® y protección respaldada por el fabricante para su tranquilidad a largo plazo."),
    },
    {
      icon: "spark",
      tile: CREAM,
      iconColor: LIME_DEEP,
      eyebrow: L(lang, "TURNKEY EXPERIENCE", "EXPERIENCIA LLAVE EN MANO"),
      title: L(lang, "Hassle-Free Experience", "Experiencia Sin Complicaciones"),
      body: L(lang, "From inspection to installation, we handle permits, materials, and clean-up so you don't have to.", "Desde la inspección hasta la instalación, nos encargamos de permisos, materiales y limpieza para que usted no tenga que hacerlo."),
    },
  ];

  const cardX = 22;
  const cardW = PW - 44;
  const gap = 6;
  const startY = 82;
  const tileSize = 22;
  const pad = 9;
  const textX = cardX + pad + tileSize + 10;
  const textW = cardW - (textX - cardX) - pad;
  let y = startY;

  for (let i = 0; i < reasons.length; i++) {
    const r = reasons[i];

    setDisplayFont(pdf, 12);
    const titleLines = pdf.splitTextToSize(r.title, textW);
    setBodyFont(pdf, 9.5);
    const bodyLines = pdf.splitTextToSize(r.body, textW);

    const eyebrowH = 4.2;
    const titleH = titleLines.length * 5.6;
    const bodyH = bodyLines.length * 4.9;
    const contentH = eyebrowH + 2.4 + titleH + 2.6 + bodyH;
    const cardH = Math.max(contentH + pad * 2, tileSize + pad * 2);

    if (y + cardH > PH - 44) {
      pdf.addPage();
      pageBg(pdf);
      y = 22;
    }

    // Card
    rounded(pdf, cardX, y, cardW, cardH, 3, CARD, MIST);

    // Left accent rail
    setFill(pdf, r.tile);
    pdf.roundedRect(cardX, y, 1.6, cardH, 0.8, 0.8, "F");

    // Icon tile
    const tileX = cardX + pad;
    const tileY = y + (cardH - tileSize) / 2;
    setFill(pdf, r.tile);
    pdf.roundedRect(tileX, tileY, tileSize, tileSize, 4, 4, "F");
    drawReasonIcon(pdf, r.icon, tileX + tileSize / 2, tileY + tileSize / 2, r.iconColor);

    // Numeric marker (small, top-right of tile)
    setDisplayFont(pdf, 7);
    setColor(pdf, SLATE);
    trackedText(pdf, `0${i + 1}`, cardX + cardW - pad, y + pad + 2, { align: "right", charSpace: 0.5 });

    // Text block — vertically centered inside card
    const blockTop = y + (cardH - contentH) / 2;
    let cy = blockTop;

    // Eyebrow
    setDisplayFont(pdf, 7);
    setColor(pdf, LIME_DEEP);
    trackedText(pdf, r.eyebrow, textX, cy + 2.6, { charSpace: 0.6 });
    cy += eyebrowH + 2.4;

    // Title
    setDisplayFont(pdf, 12);
    setColor(pdf, FOREST_INK);
    titleLines.forEach((ln: string) => {
      pdf.text(ln, textX, cy + 4);
      cy += 5.6;
    });
    cy += 2.6;

    // Body
    setBodyFont(pdf, 9.5);
    setColor(pdf, GRAPHITE);
    bodyLines.forEach((ln: string) => {
      pdf.text(ln, textX, cy + 3.4);
      cy += 4.9;
    });

    y += cardH + gap;
  }

  // Website footer
  const footerY = PH - 32;
  hairline(pdf, 22, footerY, PW - 22, footerY, ACCENT, 0.4);
  setDisplayFont(pdf, 7.5);
  setColor(pdf, LIME_DEEP);
  trackedText(pdf, L(lang, "LEARN MORE", "APRENDA MÁS"), 22, footerY + 9, { charSpace: 0.55 });
  setBodyFont(pdf, 12, "bold");
  setColor(pdf, FOREST_INK);
  pdf.text("DABELLA.US", 22, footerY + 19);

  setBodyFont(pdf, 9);
  setColor(pdf, SLATE);
  const tagline = L(lang, "Home improvement, expertly done.", "Mejoras del hogar, hechas con maestría.");
  pdf.text(tagline, PW - 22, footerY + 19, { align: "right" });
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

function drawFooters(pdf: jsPDF, lang: Lang = "en", address = "") {
  const total = pdf.getNumberOfPages();
  for (let p = 2; p <= total; p++) {
    pdf.setPage(p);
    reportFooter(
      pdf, p, total,
      L(lang, "DaBella · Inspection Report", "DaBella · Informe de Inspección"),
      address,
    );
  }
}
