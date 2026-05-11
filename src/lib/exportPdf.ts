import { jsPDF } from "jspdf";
import type { EngineState, ComputedValues } from "@/types/engine";
import { FEATURES_BY_OPTION } from "@/components/engine/presentation/constants";
import { SCOPE_ITEMS } from "@/data/scopeItems";
import { WINDOW_SCOPE_ITEMS } from "@/data/windowData";
import { fmt } from "@/lib/format";
import { getNames, getOptionMetrics, getOptionLabel, getProductLabel, hasProduct } from "@/lib/engineHelpers";
import dabellaLogoUrl from "@/assets/dabella-logo.png";

async function fetchArrayBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const bunRuntime = (globalThis as { Bun?: { file: (path: string) => { arrayBuffer: () => Promise<ArrayBuffer> } } }).Bun;
    if (typeof window === "undefined" && bunRuntime && url.startsWith("/dev-server/")) {
      return await bunRuntime.file(url).arrayBuffer();
    }
    const res = await fetch(url);
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

async function loadImageDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/* ════════════════════════════════════════════════════════════════
   DABELLA CUSTOMER PROPOSAL — Editorial / Magazine-grade PDF
   Designed as a high-end, art-directed document.
   ════════════════════════════════════════════════════════════════ */

// ─── Brand palette ────────────────────────────────────────────
const LIME       = [141, 198, 63] as const;   // DaBella signature
const LIME_DEEP  = [108, 158, 42] as const;
const FOREST     = [27, 64, 30] as const;     // Deep forest — primary dark
const FOREST_INK = [12, 30, 14] as const;     // Near-black green
const INK        = [15, 23, 17] as const;     // Body text
const GRAPHITE   = [71, 85, 75] as const;
const SLATE      = [120, 134, 122] as const;  // Muted body
const MIST       = [196, 207, 197] as const;  // Hairline
const PAPER      = [251, 250, 246] as const;  // Warm off-white background
const CARD       = [255, 255, 255] as const;
const CREAM      = [241, 244, 235] as const;  // Card alt
const SAND       = [228, 232, 219] as const;
const BORDER     = [220, 226, 215] as const;
const WHITE      = [255, 255, 255] as const;
const ACCENT     = [218, 165, 32] as const;   // Brass accent (rare, premium)
const POSITIVE   = [46, 125, 50] as const;
const NEGATIVE   = [185, 28, 28] as const;
const NEG_SOFT   = [253, 237, 237] as const;
const POS_SOFT   = [233, 246, 234] as const;

type RGB = readonly [number, number, number];
type BodyFontStyle = "normal" | "bold" | "italic";

const PW = 210;
const PH = 297;

// ─── Low-level helpers ────────────────────────────────────────
const setColor = (pdf: jsPDF, c: RGB) => pdf.setTextColor(c[0], c[1], c[2]);
const setFill  = (pdf: jsPDF, c: RGB) => pdf.setFillColor(c[0], c[1], c[2]);
const setDraw  = (pdf: jsPDF, c: RGB) => pdf.setDrawColor(c[0], c[1], c[2]);

function setDisplayFont(pdf: jsPDF, size: number) {
  pdf.setFont("ProposalSans", "bold");
  pdf.setFontSize(size);
}

function setBodyFont(pdf: jsPDF, size: number, style: BodyFontStyle = "normal") {
  pdf.setFont("ProposalSans", style);
  pdf.setFontSize(size);
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function registerPdfFonts(pdf: jsPDF) {
  const basePath = typeof window === "undefined" ? "/dev-server/public/pdf-fonts" : "/pdf-fonts";
  const fonts = [
    [`${basePath}/LiberationSans-Regular.ttf`, "ProposalSans", "normal"],
    [`${basePath}/LiberationSans-Bold.ttf`, "ProposalSans", "bold"],
    [`${basePath}/LiberationSans-Italic.ttf`, "ProposalSans", "italic"],
  ] as const;

  for (const [url, family, style] of fonts) {
    const data = await fetchArrayBuffer(url);
    if (!data) continue;
    const fileName = `${family}-${style}.ttf`;
    pdf.addFileToVFS(fileName, arrayBufferToBase64(data));
    pdf.addFont(fileName, family, style);
  }
}

function rect(pdf: jsPDF, x: number, y: number, w: number, h: number, fill: RGB) {
  setFill(pdf, fill);
  pdf.rect(x, y, w, h, "F");
}

function rounded(pdf: jsPDF, x: number, y: number, w: number, h: number, r: number, fill: RGB, stroke?: RGB) {
  setFill(pdf, fill);
  if (stroke) {
    setDraw(pdf, stroke);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, y, w, h, r, r, "FD");
  } else {
    pdf.roundedRect(x, y, w, h, r, r, "F");
  }
}

function shadow(pdf: jsPDF, x: number, y: number, w: number, h: number, r: number, opacity = 0.10) {
  pdf.setGState(pdf.GState({ opacity }));
  setFill(pdf, FOREST_INK);
  pdf.roundedRect(x + 0.8, y + 1.6, w, h, r, r, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));
}

function vGradient(pdf: jsPDF, x: number, y: number, w: number, h: number, top: RGB, bottom: RGB, steps = 40) {
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

function hairline(pdf: jsPDF, x1: number, y1: number, x2: number, y2: number, c: RGB, w = 0.2) {
  setDraw(pdf, c);
  pdf.setLineWidth(w);
  pdf.line(x1, y1, x2, y2);
}

function trackedText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: Parameters<jsPDF["text"]>[3] & { charSpace?: number },
) {
  const safeCharSpace = Math.min(Math.max(options?.charSpace ?? 0, 0), 0.8);
  pdf.text(text, x, y, { ...options, charSpace: safeCharSpace });
  pdf.setCharSpace(0);
}

function eyebrow(pdf: jsPDF, text: string, x: number, y: number, color: RGB = SLATE, size = 7.5) {
  setDisplayFont(pdf, size);
  setColor(pdf, color);
  trackedText(pdf, text.toUpperCase(), x, y, { charSpace: 0.55 });
}

function pageBg(pdf: jsPDF) {
  rect(pdf, 0, 0, PW, PH, PAPER);
}

// ════════════════════════════════════════════════════════════
//  PAGE 1 — COVER (editorial)
// ════════════════════════════════════════════════════════════
function drawCover(pdf: jsPDF, state: EngineState) {
  const names = getNames(state);

  // Full-bleed gradient — deep forest to ink
  vGradient(pdf, 0, 0, PW, PH, FOREST, FOREST_INK);

  // Soft decorative orbs
  pdf.setGState(pdf.GState({ opacity: 0.07 }));
  setFill(pdf, LIME);
  pdf.circle(180, 30, 90, "F");
  pdf.circle(-10, 230, 75, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));

  // Top brass hairline
  rect(pdf, 0, 0, PW, 0.6, ACCENT);

  // Tiny corner registration marks (editorial detail)
  setDraw(pdf, [255, 255, 255]);
  pdf.setLineWidth(0.2);
  pdf.setGState(pdf.GState({ opacity: 0.35 }));
  pdf.line(15, 15, 22, 15); pdf.line(15, 15, 15, 22);
  pdf.line(PW - 15, 15, PW - 22, 15); pdf.line(PW - 15, 15, PW - 15, 22);
  pdf.line(15, PH - 15, 22, PH - 15); pdf.line(15, PH - 15, 15, PH - 22);
  pdf.line(PW - 15, PH - 15, PW - 22, PH - 15); pdf.line(PW - 15, PH - 15, PW - 15, PH - 22);
  pdf.setGState(pdf.GState({ opacity: 1 }));

  // Header — issue/date band
  setDisplayFont(pdf, 7);
  setColor(pdf, LIME);
  trackedText(pdf, "DABELLA", 22, 22, { charSpace: 0.7 });
  setBodyFont(pdf, 7);
  setColor(pdf, [220, 230, 220]);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  trackedText(pdf, today.toUpperCase(), PW - 22, 22, { align: "right", charSpace: 0.45 });

  // Eyebrow
  setDisplayFont(pdf, 8);
  setColor(pdf, LIME);
  trackedText(pdf, "PRIVATE PROPOSAL · NO. 001", 22, 100, { charSpace: 0.6 });

  // Editorial headline — sized to fit
  setDisplayFont(pdf, 38);
  setColor(pdf, WHITE);
  pdf.text("A Home", 22, 132);
  pdf.text("Built To Last.", 22, 154);

  // Brass underscore
  setFill(pdf, ACCENT);
  pdf.rect(22, 162, 30, 1.2, "F");

  // Subhead
  setBodyFont(pdf, 10.5);
  setColor(pdf, [220, 232, 220]);
  pdf.text(`A bespoke ${getProductLabel(state.products).toLowerCase()} proposal`, 22, 178);
  pdf.text("crafted for your home — and your future.", 22, 185);

  // Recipient block — full-width line, name auto-sized to fit
  const ry = 222;
  hairline(pdf, 22, ry, PW - 22, ry, ACCENT, 0.5);
  setDisplayFont(pdf, 7);
  setColor(pdf, ACCENT);
  trackedText(pdf, "PREPARED FOR", 22, ry + 7, { charSpace: 0.55 });

  // Auto-fit name
  let nameSize = 22;
  setDisplayFont(pdf, nameSize);
  const maxNameW = PW - 44;
  while (pdf.getTextWidth(names) > maxNameW && nameSize > 12) {
    nameSize -= 1;
    setDisplayFont(pdf, nameSize);
  }
  setColor(pdf, WHITE);
  pdf.text(names, 22, ry + 22);

  // Credentials — bottom strip (single horizontal row)
  const credY = 256;
  hairline(pdf, 22, credY, PW - 22, credY, [80, 120, 85], 0.3);
  setDisplayFont(pdf, 6.5);
  setColor(pdf, [200, 215, 200]);
  const creds = ["LIFETIME WARRANTY", "GAF MASTER ELITE", "TOP-RATED CREWS", "LOCALLY OWNED"];
  const credSpacing = (PW - 44) / creds.length;
  creds.forEach((c, i) => {
    trackedText(pdf, c, 22 + credSpacing * (i + 0.5), credY + 7, { align: "center", charSpace: 0.4 });
  });

  // Footer
  setBodyFont(pdf, 7);
  setColor(pdf, [180, 200, 180]);
  trackedText(pdf, "DABELLA.US", 22, PH - 14, { charSpace: 0.6 });
  trackedText(pdf, "HOME IMPROVEMENT, EXPERTLY DONE", PW - 22, PH - 14, { align: "right", charSpace: 0.35 });
}

// ════════════════════════════════════════════════════════════
//  Section header used on interior pages
// ════════════════════════════════════════════════════════════
function sectionHeader(pdf: jsPDF, eyebrowText: string, title: string, subtitle?: string) {
  // Top brass mark
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

// ════════════════════════════════════════════════════════════
//  PAGE 2 — SELECTED OPTION
// ════════════════════════════════════════════════════════════
function drawSelectedOption(
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

  // ─── HERO PRICE PANEL ──────────────────────────────────────
  const heroY = 78;
  const heroH = 78;
  shadow(pdf, 22, heroY, PW - 44, heroH, 4, 0.12);
  vGradient(pdf, 22, heroY, PW - 44, heroH, FOREST, FOREST_INK);

  // Brass hairline at top of hero
  setFill(pdf, ACCENT);
  pdf.rect(22, heroY, PW - 44, 0.7, "F");

  // Badge pill
  rounded(pdf, 30, heroY + 10, 34, 6.5, 3, ACCENT);
  setDisplayFont(pdf, 6.5);
  setColor(pdf, FOREST_INK);
  trackedText(pdf, BADGES[opt.key] || "YOUR CHOICE", 47, heroY + 14.4, { align: "center", charSpace: 0.35 });

  // Option name
  setDisplayFont(pdf, 12);
  setColor(pdf, WHITE);
  pdf.text(opt.name, 30, heroY + 28);

  // Big price (left aligned, oversized)
  setDisplayFont(pdf, 34);
  setColor(pdf, WHITE);
  pdf.text(fmt(opt.price), 30, heroY + 56);

  setBodyFont(pdf, 8);
  setColor(pdf, [200, 220, 200]);
  trackedText(pdf, "TOTAL INVESTMENT — TURNKEY", 30, heroY + 65, { charSpace: 0.4 });

  // Right side — monthly callout
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

  // ─── TWO COLUMN: FEATURES | VALUE SNAPSHOT ─────────────────
  const colY = heroY + heroH + 14;
  const gutter = 8;
  const colW = (PW - 44 - gutter) / 2;

  // LEFT — Features card
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

  // RIGHT — Value snapshot
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

  // Net effective cost — highlight
  vy += 2;
  rounded(pdf, rxc + 6, vy, colW - 12, 18, 2, FOREST_INK);
  setDisplayFont(pdf, 6.5);
  setColor(pdf, LIME);
  trackedText(pdf, "NET EFFECTIVE COST", rxc + 12, vy + 7, { charSpace: 0.45 });
  setDisplayFont(pdf, 12.5);
  setColor(pdf, WHITE);
  pdf.text(fmt(optComputed.netCost), rxc + colW - 12, vy + 12, { align: "right" });
}

// ════════════════════════════════════════════════════════════
//  PAGE 3 — T-CLOSE / PRICE LOCK
// ════════════════════════════════════════════════════════════
function drawTClose(pdf: jsPDF, state: EngineState, computed: ComputedValues, selectedKey: "A" | "B" | "C") {
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

  // Pull quote (editorial)
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

  // Two big price columns
  const py = 118;
  const pH = 60;
  const halfW = (PW - 44 - 8) / 2;

  // TODAY
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

  // FUTURE
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

  // Cost of waiting — dramatic centerpiece
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
}

// ════════════════════════════════════════════════════════════
//  PAGE 4 — 10-YEAR FINANCIAL IMPACT
// ════════════════════════════════════════════════════════════
function drawFinancialImpact(pdf: jsPDF, state: EngineState, computed: ComputedValues, selectedKey: "A" | "B" | "C") {
  pageBg(pdf);
  const m = getOptionMetrics(selectedKey, computed);
  const label = getOptionLabel(selectedKey, state);

  sectionHeader(
    pdf,
    "10-Year Outlook",
    "The Full Picture.",
    `Option ${selectedKey} · ${label} — what happens if you move forward, vs. if you don't.`,
  );

  // Two-column header — full table width
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
      forwardColor: POSITIVE,
      nothingColor: SLATE,
    },
    {
      label: "Energy Savings (10yr)",
      hint: `${state.energySavingsPct}% of ${fmt(state.monthlyBill)}/mo × 120`,
      forward: `+${fmt(computed.energySavings)}`,
      nothing: `−${fmt(computed.tenYearCost)}`,
      forwardColor: POSITIVE,
      nothingColor: NEGATIVE as RGB,
    },
    {
      label: "Price Lock Savings",
      hint: "8% annual material inflation, 10yr",
      forward: `+${fmt(m.lockedInSavings)}`,
      nothing: `−${fmt(m.inflationPenalty)}`,
      forwardColor: POSITIVE,
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

  // Totals — two large blocks
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

  // Net advantage hero
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

// ════════════════════════════════════════════════════════════
//  WINDOW INSPECTION
// ════════════════════════════════════════════════════════════
function drawWindowInspection(pdf: jsPDF, state: EngineState) {
  pageBg(pdf);
  sectionHeader(
    pdf,
    "Window Inspection",
    "What We Found.",
    "An honest, item-by-item review of your existing windows.",
  );

  const STATUS_COLORS: Record<string, RGB> = {
    yes: POSITIVE,
    no: NEGATIVE,
    na: SLATE,
  };
  const STATUS_LABELS: Record<string, string> = { yes: "YES", no: "NO", na: "N/A" };

  let y = 78;
  const colW = (PW - 44 - 8) / 2;
  state.windowInspection.forEach((entry, i) => {
    const col = i < 7 ? 0 : 1;
    const row = i < 7 ? i : i - 7;
    const x = 22 + col * (colW + 8);
    const ry = y + row * 11;

    if (row % 2 === 0) rounded(pdf, x, ry - 3, colW, 10, 1.5, CREAM);

    setBodyFont(pdf, 8);
    setColor(pdf, INK);
    pdf.text(`${i + 1}. ${entry.label}`, x + 5, ry + 3.5);

    setDisplayFont(pdf, 7);
    setColor(pdf, STATUS_COLORS[entry.status] || SLATE);
    trackedText(pdf, STATUS_LABELS[entry.status] || "N/A", x + colW - 5, ry + 3.5, { align: "right", charSpace: 0.3 });
  });

  if (state.windowItems.length > 0) {
    y += 88;
    eyebrow(pdf, "Window Schedule", 22, y, LIME_DEEP, 7.5);
    setDisplayFont(pdf, 12);
    setColor(pdf, FOREST_INK);
    pdf.text(`${state.windowItems.length} Window${state.windowItems.length !== 1 ? "s" : ""}`, 22, y + 8);

    y += 14;
    const tableW = PW - 44;
    const cols = [10, 18, 30, 42, 24, 22, 24];
    const headers = ["#", "LEVEL", "ROOM", "STYLE", "SIZE", "GRIDS", "NOTES"];

    rect(pdf, 22, y, tableW, 7, FOREST_INK);
    setDisplayFont(pdf, 6.5);
    setColor(pdf, LIME);
    let hx = 22 + 2;
    headers.forEach((h, ci) => {
      trackedText(pdf, h, hx + 1, y + 4.8, { charSpace: 0.25 });
      hx += cols[ci];
    });

    y += 8;
    state.windowItems.forEach((item, i) => {
      if (i % 2 === 0) rect(pdf, 22, y - 2, tableW, 7, CREAM);

      setBodyFont(pdf, 7);
      setColor(pdf, INK);
      let cx = 22 + 2;
      const vals = [
        String(item.number),
        item.level || "—",
        item.room || "—",
        item.style.split(" - ").pop() || item.style,
        item.width && item.height ? `${item.width}×${item.height}` : "—",
        item.gridPattern,
        item.observations || "—",
      ];
      vals.forEach((v, ci) => {
        const txt = pdf.splitTextToSize(v, cols[ci] - 3)[0];
        pdf.text(txt, cx + 1, y + 3);
        cx += cols[ci];
      });
      y += 7;
    });
  }
}

// ════════════════════════════════════════════════════════════
//  SCOPE OF WORK
// ════════════════════════════════════════════════════════════
function drawScope(pdf: jsPDF, state: EngineState) {
  pageBg(pdf);
  const isWindows = hasProduct(state.products, "Windows");
  const items = isWindows ? [...WINDOW_SCOPE_ITEMS] : [...SCOPE_ITEMS];

  sectionHeader(
    pdf,
    "Scope of Work",
    "What to Expect.",
    isWindows
      ? "Your complete window project — from measure to final walkthrough."
      : "Every step we will take, in order, to bring your project home.",
  );

  // Two-column scope list — numbered editorial
  let y = 78;
  const colW = (PW - 44 - 10) / 2;
  const rowH = 20;
  const perCol = Math.ceil(items.length / 2);

  items.forEach((item, i) => {
    const col = i < perCol ? 0 : 1;
    const row = i < perCol ? i : i - perCol;
    const x = 22 + col * (colW + 10);
    const ry = y + row * rowH;

    // Number
    setDisplayFont(pdf, 16);
    setColor(pdf, LIME);
    pdf.text(String(i + 1).padStart(2, "0"), x, ry + 6);

    // Hairline
    hairline(pdf, x + 14, ry + 2, x + colW, ry + 2, MIST, 0.2);

    setBodyFont(pdf, 8.5);
    setColor(pdf, INK);
    const lines = pdf.splitTextToSize(item, colW - 18);
    lines.slice(0, 2).forEach((ln: string, li: number) => pdf.text(ln, x + 14, ry + 7 + li * 4.3));
  });

  // Pull quote at bottom
  const qy = PH - 50;
  hairline(pdf, 22, qy, PW - 22, qy, ACCENT, 0.4);
  setBodyFont(pdf, 12, "italic");
  setColor(pdf, FOREST_INK);
  pdf.text('"Does that sound like everything we spoke about today?"', PW / 2, qy + 12, { align: "center" });

  setDisplayFont(pdf, 7);
  setColor(pdf, SLATE);
  trackedText(pdf, "YOUR DABELLA PROJECT MANAGER", PW / 2, qy + 19, { align: "center", charSpace: 0.45 });
}

// ════════════════════════════════════════════════════════════
//  WELCOME — Closing page
// ════════════════════════════════════════════════════════════
function drawWelcome(pdf: jsPDF, state: EngineState, logoDataUrl: string | null) {
  const names = getNames(state);

  // Full-bleed deep gradient
  vGradient(pdf, 0, 0, PW, PH, FOREST, FOREST_INK);

  // Soft orbs
  pdf.setGState(pdf.GState({ opacity: 0.06 }));
  setFill(pdf, LIME);
  pdf.circle(40, 50, 60, "F");
  pdf.circle(180, 250, 70, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));

  // Brass top
  rect(pdf, 0, 0, PW, 0.6, ACCENT);

  // Butterfly logo — centered hero
  if (logoDataUrl) {
    const logoW = 44;
    const logoH = logoW * (120 / 192); // preserve aspect
    pdf.addImage(logoDataUrl, "PNG", (PW - logoW) / 2, 56, logoW, logoH);
  }

  // Wordmark below logo
  setDisplayFont(pdf, 8);
  setColor(pdf, LIME);
  trackedText(pdf, "DABELLA", PW / 2, 92, { align: "center", charSpace: 0.7 });

  // Eyebrow
  setDisplayFont(pdf, 7.5);
  setColor(pdf, ACCENT);
  trackedText(pdf, "CHAPTER ONE", PW / 2, 122, { align: "center", charSpace: 0.6 });

  // Headline — single line, tightly set
  setDisplayFont(pdf, 34);
  setColor(pdf, WHITE);
  pdf.text("Welcome Home.", PW / 2, 146, { align: "center" });

  // Brass underscore
  setFill(pdf, ACCENT);
  pdf.rect(PW / 2 - 14, 154, 28, 1.2, "F");

  // Personal note
  setBodyFont(pdf, 10.5);
  setColor(pdf, [220, 232, 220]);
  const note = pdf.splitTextToSize(
    `${names}, thank you for trusting us with your home.`,
    PW - 60,
  );
  note.forEach((ln: string, i: number) => pdf.text(ln, PW / 2, 170 + i * 6, { align: "center" }));

  setBodyFont(pdf, 10);
  setColor(pdf, [190, 210, 195]);
  pdf.text("We are honored to be part of your story.", PW / 2, 170 + note.length * 6 + 4, { align: "center" });

  // Three perks
  const perks = [
    { top: "LIFETIME", bot: "Warranty" },
    { top: "FIVE-STAR", bot: "Service" },
    { top: "EXPERT", bot: "Install" },
  ];
  const py = 212;
  const cardW = 46;
  const gap = 8;
  const totalW = perks.length * cardW + (perks.length - 1) * gap;
  let cx = (PW - totalW) / 2;
  perks.forEach(({ top, bot }) => {
    pdf.setGState(pdf.GState({ opacity: 0.10 }));
    setFill(pdf, WHITE);
    pdf.roundedRect(cx, py, cardW, 28, 2, 2, "F");
    pdf.setGState(pdf.GState({ opacity: 1 }));
    setDraw(pdf, [80, 120, 85]);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(cx, py, cardW, 28, 2, 2, "S");

    setDisplayFont(pdf, 7);
    setColor(pdf, LIME);
    trackedText(pdf, top, cx + cardW / 2, py + 11, { align: "center", charSpace: 0.45 });

    setDisplayFont(pdf, 10.5);
    setColor(pdf, WHITE);
    pdf.text(bot, cx + cardW / 2, py + 21, { align: "center" });

    cx += cardW + gap;
  });

  // Closing italic line
  setBodyFont(pdf, 10.5, "italic");
  setColor(pdf, [200, 220, 205]);
  pdf.text('"We don\'t just build homes — we build relationships."', PW / 2, PH - 28, { align: "center" });

  setBodyFont(pdf, 7);
  setColor(pdf, [160, 185, 165]);
  trackedText(pdf, "DABELLA.US", PW / 2, PH - 16, { align: "center", charSpace: 0.65 });
}

// ════════════════════════════════════════════════════════════
//  MAIN BUILDER
// ════════════════════════════════════════════════════════════
export async function buildCustomerPdf(
  state: EngineState,
  computed: ComputedValues,
  options: { key: "A" | "B" | "C"; name: string; price: number; monthly: number }[],
  selectedOption?: "A" | "B" | "C" | null,
): Promise<{ blob: Blob; doc: jsPDF }> {
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
  const isWindows = hasProduct(state.products, "Windows");
  await registerPdfFonts(pdf);
  const logoDataUrl = await loadImageDataUrl(dabellaLogoUrl);

  drawCover(pdf, state);

  const chosenKey = selectedOption || "A";
  const chosenOpt = options.find((o) => o.key === chosenKey) || options[0];

  pdf.addPage();
  drawSelectedOption(pdf, state, computed, chosenOpt);

  pdf.addPage();
  drawTClose(pdf, state, computed, chosenKey);

  pdf.addPage();
  drawFinancialImpact(pdf, state, computed, chosenKey);

  if (isWindows) {
    pdf.addPage();
    drawWindowInspection(pdf, state);
  }

  pdf.addPage();
  drawScope(pdf, state);

  pdf.addPage();
  drawWelcome(pdf, state, logoDataUrl);

  // Refined editorial footer on interior pages
  const totalPages = pdf.getNumberOfPages();
  for (let p = 2; p <= totalPages - 1; p++) {
    pdf.setPage(p);
    hairline(pdf, 22, PH - 16, PW - 22, PH - 16, MIST, 0.2);
    setDisplayFont(pdf, 6.5);
    setColor(pdf, SLATE);
    trackedText(pdf, "DABELLA · PROPOSAL", 22, PH - 11, { charSpace: 0.45 });
    setBodyFont(pdf, 6.5);
    trackedText(pdf, `${String(p).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`, PW - 22, PH - 11, { align: "right", charSpace: 0.3 });
  }

  return { blob: pdf.output("blob"), doc: pdf };
}

// ════════════════════════════════════════════════════════════
//  EXPORT (download)
// ════════════════════════════════════════════════════════════
export async function exportCustomerPdf(
  state: EngineState,
  computed: ComputedValues,
  options: { key: "A" | "B" | "C"; name: string; price: number; monthly: number }[],
  filename = "DaBella-Proposal.pdf",
  selectedOption?: "A" | "B" | "C" | null,
) {
  const { doc } = await buildCustomerPdf(state, computed, options, selectedOption);
  doc.save(filename);
}
