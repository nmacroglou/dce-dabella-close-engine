import jsPDF from "jspdf";
import type { EngineState, ComputedValues } from "@/types/engine";
import { FEATURES_BY_OPTION } from "@/components/engine/presentation/constants";
import { SCOPE_ITEMS } from "@/data/scopeItems";
import { WINDOW_SCOPE_ITEMS } from "@/data/windowData";
import { fmt } from "@/lib/format";
import { getNames, getOptionMetrics, getOptionLabel, getProductLabel, hasProduct } from "@/lib/engineHelpers";

// Brand colors
const BLUE = [37, 99, 235] as const;
const DARK = [15, 23, 42] as const;
const GRAY = [100, 116, 139] as const;
const LIGHT_BG = [248, 250, 252] as const;
const WHITE = [255, 255, 255] as const;
const GREEN = [16, 185, 129] as const;
const AMBER = [245, 158, 11] as const;
const BORDER = [226, 232, 240] as const;

type RGB = readonly [number, number, number];

// ─── Helpers ──────────────────────────────────────────────────
function setColor(pdf: jsPDF, c: RGB) { pdf.setTextColor(c[0], c[1], c[2]); }
function setFill(pdf: jsPDF, c: RGB) { pdf.setFillColor(c[0], c[1], c[2]); }
function setDraw(pdf: jsPDF, c: RGB) { pdf.setDrawColor(c[0], c[1], c[2]); }

function roundedRect(pdf: jsPDF, x: number, y: number, w: number, h: number, r: number, fill: RGB, stroke?: RGB) {
  setFill(pdf, fill);
  if (stroke) {
    setDraw(pdf, stroke);
    pdf.roundedRect(x, y, w, h, r, r, "FD");
  } else {
    pdf.roundedRect(x, y, w, h, r, r, "F");
  }
}

function drawLine(pdf: jsPDF, x1: number, y1: number, x2: number, y2: number, c: RGB) {
  setDraw(pdf, c);
  pdf.setLineWidth(0.3);
  pdf.line(x1, y1, x2, y2);
}

// ─── PAGE 1: COVER ────────────────────────────────────────────
function drawCover(pdf: jsPDF, state: EngineState) {
  const pw = 210;
  const names = getNames(state);

  setFill(pdf, BLUE);
  pdf.rect(0, 0, pw, 100, "F");

  pdf.setGState(pdf.GState({ opacity: 0.08 }));
  setFill(pdf, WHITE);
  pdf.circle(160, 20, 60, "F");
  pdf.circle(30, 80, 40, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(32);
  setColor(pdf, WHITE);
  pdf.text("DaBella", pw / 2, 40, { align: "center" });

  pdf.setFontSize(13);
  pdf.setFont("helvetica", "normal");
  setColor(pdf, [200, 220, 255]);
  pdf.text("HOME IMPROVEMENT EXPERTS", pw / 2, 52, { align: "center" });

  const cy = 140;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  setColor(pdf, BLUE);
  pdf.text("PREPARED EXCLUSIVELY FOR", pw / 2, cy, { align: "center" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  setColor(pdf, DARK);
  pdf.text(names, pw / 2, cy + 18, { align: "center" });

  drawLine(pdf, 70, cy + 30, 140, cy + 30, BORDER);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  setColor(pdf, DARK);
  pdf.text(`${getProductLabel(state.products)} Proposal`, pw / 2, cy + 48, { align: "center" });

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  setColor(pdf, GRAY);
  pdf.text(today, pw / 2, cy + 62, { align: "center" });

  const ph = 297;
  const badgeY = ph - 50;
  const badges = ["Lifetime Warranty", "GAF Master Elite", "Top-Rated Crews", "Locally Owned"];
  const badgeWidth = 40;
  const totalWidth = badges.length * badgeWidth + (badges.length - 1) * 6;
  let bx = (pw - totalWidth) / 2;

  badges.forEach((label) => {
    roundedRect(pdf, bx, badgeY, badgeWidth, 20, 3, LIGHT_BG, BORDER);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    setColor(pdf, DARK);
    const lines = pdf.splitTextToSize(label, badgeWidth - 6);
    const textY = badgeY + 10 - ((lines.length - 1) * 3.5) / 2;
    lines.forEach((line: string, li: number) => {
      pdf.text(line, bx + badgeWidth / 2, textY + li * 3.5, { align: "center" });
    });
    bx += badgeWidth + 6;
  });
}

// ─── PAGE 2: OPTIONS ──────────────────────────────────────────
function drawOptions(
  pdf: jsPDF,
  state: EngineState,
  computed: ComputedValues,
  options: { key: "A" | "B" | "C"; name: string; price: number; monthly: number }[],
) {
  const pw = 210;
  const margin = 15;
  const colW = (pw - margin * 2 - 12) / 3;
  const names = getNames(state);

  let y = 18;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  setColor(pdf, DARK);
  pdf.text(`Your ${getProductLabel(state.products)} Options`, pw / 2, y, { align: "center" });

  y += 8;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  setColor(pdf, GRAY);
  pdf.text(`${names} — a side-by-side comparison tailored for your home`, pw / 2, y, { align: "center" });

  y += 10;

  const OPTION_COLORS: Record<string, RGB> = { A: BLUE, B: GREEN, C: AMBER };
  const OPTION_BADGES: Record<string, string> = { A: "BEST VALUE", B: "MOST POPULAR", C: "SMART START" };

  options.forEach((opt, i) => {
    const x = margin + i * (colW + 6);
    const cardTop = y;
    const color = OPTION_COLORS[opt.key];

    roundedRect(pdf, x, cardTop, colW, 175, 4, WHITE, BORDER);

    setFill(pdf, color);
    pdf.roundedRect(x, cardTop, colW, 6, 4, 4, "F");
    pdf.rect(x, cardTop + 3, colW, 3, "F");

    const badgeW = 28;
    setFill(pdf, color);
    pdf.roundedRect(x + (colW - badgeW) / 2, cardTop + 1, badgeW, 8, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(5.5);
    setColor(pdf, WHITE);
    pdf.text(OPTION_BADGES[opt.key], x + colW / 2, cardTop + 6, { align: "center" });

    let cy = cardTop + 18;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    setColor(pdf, GRAY);
    pdf.text(`OPTION ${opt.key}`, x + 8, cy);

    cy += 6;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    setColor(pdf, DARK);
    const nameLines = pdf.splitTextToSize(opt.name, colW - 16);
    nameLines.forEach((line: string, li: number) => { pdf.text(line, x + 8, cy + li * 5); });
    cy += nameLines.length * 5 + 4;

    roundedRect(pdf, x + 6, cy, colW - 12, 24, 3, LIGHT_BG);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    setColor(pdf, color);
    pdf.text(fmt(opt.price), x + colW / 2, cy + 10, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    setColor(pdf, GRAY);
    pdf.text(`as low as ${fmt(opt.monthly)}/mo with financing`, x + colW / 2, cy + 18, { align: "center" });
    cy += 30;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    setColor(pdf, GRAY);
    pdf.text("WHAT'S INCLUDED", x + 8, cy);
    cy += 5;

    const features = FEATURES_BY_OPTION[opt.key] || [];
    features.forEach((f) => {
      setFill(pdf, color);
      pdf.circle(x + 10, cy - 0.8, 1.2, "F");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      setColor(pdf, DARK);
      const fLines = pdf.splitTextToSize(f.text, colW - 22);
      fLines.forEach((line: string, li: number) => { pdf.text(line, x + 14, cy + li * 3.5); });
      cy += fLines.length * 3.5 + 2;
    });

    cy = cardTop + 142;
    roundedRect(pdf, x + 6, cy, colW - 12, 28, 3, LIGHT_BG);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    setColor(pdf, GRAY);
    pdf.text("VALUE SNAPSHOT", x + 10, cy + 5);

    const roi = Math.round(opt.price * (state.roiPercent / 100));
    const netCost = opt.price - roi - computed.energySavings;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    setColor(pdf, DARK);
    pdf.text("Home value increase", x + 10, cy + 11);
    pdf.text(`+${fmt(roi)}`, x + colW - 10, cy + 11, { align: "right" });
    pdf.text("10-yr energy savings", x + 10, cy + 16);
    pdf.text(`+${fmt(computed.energySavings)}`, x + colW - 10, cy + 16, { align: "right" });

    drawLine(pdf, x + 10, cy + 19, x + colW - 10, cy + 19, BORDER);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    setColor(pdf, BLUE);
    pdf.text("Net effective cost", x + 10, cy + 24);
    pdf.text(fmt(netCost), x + colW - 10, cy + 24, { align: "right" });
  });
}

// ─── PAGE 3: SCOPE OF WORK ───────────────────────────────────
function drawScope(pdf: jsPDF, state: EngineState) {
  const pw = 210;
  const margin = 20;
  const isWindows = state.product === "Windows";
  const scopeItems = isWindows ? [...WINDOW_SCOPE_ITEMS] : [...SCOPE_ITEMS];

  let y = 18;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  setColor(pdf, DARK);
  pdf.text("What to Expect", pw / 2, y, { align: "center" });

  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  setColor(pdf, GRAY);
  pdf.text(
    isWindows
      ? "Your complete window project scope — from measure to final walkthrough"
      : "Your complete scope of work — everything included in your project",
    pw / 2, y, { align: "center" }
  );

  y += 12;

  roundedRect(pdf, margin, y, pw - margin * 2, scopeItems.length * 13 + 16, 5, WHITE, BORDER);

  let sy = y + 10;
  scopeItems.forEach((item, i) => {
    const rowX = margin + 8;
    const rowW = pw - margin * 2 - 16;

    if (i % 2 === 0) {
      roundedRect(pdf, margin + 4, sy - 3.5, pw - margin * 2 - 8, 12, 2, LIGHT_BG);
    }

    setFill(pdf, BLUE);
    pdf.roundedRect(rowX, sy - 2.5, 5, 5, 1, 1, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    setColor(pdf, WHITE);
    pdf.text("✓", rowX + 2.5, sy + 1, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    setColor(pdf, DARK);
    const lines = pdf.splitTextToSize(item, rowW - 12);
    lines.forEach((line: string, li: number) => { pdf.text(line, rowX + 9, sy + li * 4); });
    sy += Math.max(lines.length * 4, 12) + 1;
  });

  sy += 8;
  roundedRect(pdf, 40, sy, pw - 80, 14, 3, LIGHT_BG);
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(9);
  setColor(pdf, DARK);
  pdf.text('"Does that sound like everything we have spoken about today?"', pw / 2, sy + 9, { align: "center" });
}

// ─── PAGE: WINDOW INSPECTION ─────────────────────────────────
function drawWindowInspection(pdf: jsPDF, state: EngineState) {
  const pw = 210;
  const margin = 20;

  let y = 18;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  setColor(pdf, DARK);
  pdf.text("Window Inspection Results", pw / 2, y, { align: "center" });

  y += 8;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  setColor(pdf, GRAY);
  pdf.text("Here's what we found during our inspection of your windows", pw / 2, y, { align: "center" });

  // Inspection checklist
  y += 12;
  const STATUS_COLORS: Record<string, RGB> = {
    yes: GREEN,
    no: [220, 38, 38],
    na: GRAY,
  };
  const STATUS_LABELS: Record<string, string> = { yes: "YES", no: "NO", na: "N/A" };

  const colW = (pw - margin * 2 - 8) / 2;
  state.windowInspection.forEach((entry, i) => {
    const col = i < 7 ? 0 : 1;
    const row = i < 7 ? i : i - 7;
    const x = margin + col * (colW + 8);
    const ry = y + row * 11;

    if (row % 2 === 0) {
      roundedRect(pdf, x, ry - 3, colW, 10, 2, LIGHT_BG);
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    setColor(pdf, DARK);
    pdf.text(`${i + 1}. ${entry.label}`, x + 4, ry + 3);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    setColor(pdf, STATUS_COLORS[entry.status] || GRAY);
    pdf.text(STATUS_LABELS[entry.status] || "N/A", x + colW - 4, ry + 3, { align: "right" });
  });

  // Window schedule table
  if (state.windowItems.length > 0) {
    y += 85;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    setColor(pdf, DARK);
    pdf.text(`Window Schedule — ${state.windowItems.length} Window${state.windowItems.length !== 1 ? "s" : ""}`, pw / 2, y, { align: "center" });

    y += 8;
    const tableW = pw - margin * 2;
    const cols = [12, 18, 30, 40, 25, 22, 23]; // #, Level, Room, Style, Size, Grids, Notes
    const headers = ["#", "Level", "Room", "Style", "Size", "Grids", "Notes"];

    // Header row
    roundedRect(pdf, margin, y, tableW, 8, 2, BLUE);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    setColor(pdf, WHITE);
    let hx = margin + 2;
    headers.forEach((h, ci) => {
      pdf.text(h, hx + 1, y + 5.5);
      hx += cols[ci];
    });

    y += 9;
    state.windowItems.forEach((item, i) => {
      if (i % 2 === 0) {
        roundedRect(pdf, margin, y - 2, tableW, 8, 1, LIGHT_BG);
      }

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      setColor(pdf, DARK);
      let cx = margin + 2;
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
        pdf.text(txt, cx + 1, y + 3.5);
        cx += cols[ci];
      });
      y += 8;
    });
  }
}

// ─── PAGE 4: WELCOME ─────────────────────────────────────────
function drawWelcome(pdf: jsPDF, state: EngineState) {
  const pw = 210, ph = 297;
  const names = getNames(state);

  setFill(pdf, BLUE);
  pdf.rect(0, 0, pw, ph, "F");

  pdf.setGState(pdf.GState({ opacity: 0.06 }));
  setFill(pdf, WHITE);
  pdf.circle(40, 60, 50, "F");
  pdf.circle(170, 240, 60, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));

  let y = 80;
  roundedRect(pdf, (pw - 50) / 2, y, 50, 20, 5, [30, 80, 210]);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  setColor(pdf, WHITE);
  pdf.text("DaBella", pw / 2, y + 13, { align: "center" });

  y += 40;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  setColor(pdf, WHITE);
  pdf.text("Welcome to the Family!", pw / 2, y, { align: "center" });

  y += 14;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  setColor(pdf, [200, 220, 255]);
  pdf.text(`${names}, congratulations on investing in your home's future.`, pw / 2, y, { align: "center" });
  y += 6;
  pdf.text("We're honored to earn your trust.", pw / 2, y, { align: "center" });

  y += 20;
  const perks = [
    { top: "Lifetime", bottom: "Warranty" },
    { top: "5-Star", bottom: "Service" },
    { top: "Expert", bottom: "Install" },
  ];

  const cardW = 40;
  const gap = 10;
  const totalW = perks.length * cardW + (perks.length - 1) * gap;
  let cx = (pw - totalW) / 2;

  perks.forEach(({ top, bottom }) => {
    pdf.setGState(pdf.GState({ opacity: 0.15 }));
    setFill(pdf, WHITE);
    pdf.roundedRect(cx, y, cardW, 30, 4, 4, "F");
    pdf.setGState(pdf.GState({ opacity: 1 }));

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    setColor(pdf, [200, 220, 255]);
    pdf.text(top.toUpperCase(), cx + cardW / 2, y + 12, { align: "center" });

    pdf.setFontSize(10);
    setColor(pdf, WHITE);
    pdf.text(bottom, cx + cardW / 2, y + 22, { align: "center" });

    cx += cardW + gap;
  });

  y += 50;
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(10);
  setColor(pdf, [180, 200, 255]);
  pdf.text('"We don\'t just build homes — we build relationships."', pw / 2, y, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  setColor(pdf, [150, 180, 255]);
  pdf.text("www.dabella.us", pw / 2, ph - 20, { align: "center" });
}

// ─── PAGE: T-CLOSE BOARD ─────────────────────────────────────
function drawTClose(pdf: jsPDF, state: EngineState, computed: ComputedValues, selectedKey: "A" | "B" | "C") {
  const pw = 210;
  const margin = 20;
  const m = getOptionMetrics(selectedKey, computed);
  const label = getOptionLabel(selectedKey, state);
  const futurePrice = m.price + m.inflationPenalty;

  let y = 18;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  setColor(pdf, DARK);
  pdf.text("T-Close Board", pw / 2, y, { align: "center" });

  y += 8;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  setColor(pdf, GRAY);
  pdf.text(`Option ${selectedKey}: ${label} — why acting today saves you money`, pw / 2, y, { align: "center" });

  // Coach script
  y += 12;
  roundedRect(pdf, margin, y, pw - margin * 2, 22, 4, LIGHT_BG, BORDER);
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8);
  setColor(pdf, DARK);
  const scriptLines = pdf.splitTextToSize(
    '"Most people at this point aren\'t deciding if they\'re doing the project — they\'re deciding whether the money feels right. Let me show you what the numbers actually look like…"',
    pw - margin * 2 - 16
  );
  scriptLines.forEach((line: string, i: number) => {
    pdf.text(line, margin + 8, y + 7 + i * 4);
  });

  // The Math section
  y += 30;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  setColor(pdf, DARK);
  pdf.text(`The Math — ${label}`, pw / 2, y, { align: "center" });

  y += 10;
  const halfW = (pw - margin * 2 - 8) / 2;

  // Today's price box
  roundedRect(pdf, margin, y, halfW, 30, 4, WHITE, BORDER);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setColor(pdf, GRAY);
  pdf.text("TODAY'S PRICE", margin + halfW / 2, y + 7, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  setColor(pdf, GRAY);
  pdf.text(`Locked in = ${fmt(m.price)}`, margin + halfW / 2, y + 14, { align: "center" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  setColor(pdf, BLUE);
  pdf.text(fmt(m.price), margin + halfW / 2, y + 25, { align: "center" });

  // Future price box
  const rx = margin + halfW + 8;
  roundedRect(pdf, rx, y, halfW, 30, 4, WHITE, BORDER);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setColor(pdf, GRAY);
  pdf.text("SAME ROOF IN 10 YEARS", rx + halfW / 2, y + 7, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  setColor(pdf, GRAY);
  pdf.text(`${fmt(m.price)} x 1.08^10 = ${fmt(futurePrice)}`, rx + halfW / 2, y + 14, { align: "center" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  setColor(pdf, [220, 38, 38]);
  pdf.text(fmt(futurePrice), rx + halfW / 2, y + 25, { align: "center" });

  // Cost of waiting
  y += 38;
  const RED: RGB = [220, 38, 38];
  roundedRect(pdf, margin + 20, y, pw - margin * 2 - 40, 32, 4, [254, 242, 242], [252, 165, 165]);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setColor(pdf, RED);
  pdf.text("COST OF WAITING", pw / 2, y + 7, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  setColor(pdf, GRAY);
  pdf.text(`${fmt(futurePrice)} - ${fmt(m.price)} = ${fmt(m.inflationPenalty)}`, pw / 2, y + 14, { align: "center" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  setColor(pdf, RED);
  pdf.text(fmt(m.inflationPenalty), pw / 2, y + 26, { align: "center" });

  // Yes vs No comparison
  y += 40;
  const compW = (pw - margin * 2 - 8) / 2;

  // Say Yes
  roundedRect(pdf, margin, y, compW, 40, 4, [240, 253, 244], [134, 239, 172]);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setColor(pdf, GREEN);
  pdf.text("SAY YES TODAY", margin + compW / 2, y + 8, { align: "center" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  setColor(pdf, DARK);
  pdf.text(fmt(m.price), margin + compW / 2, y + 20, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  setColor(pdf, GRAY);
  pdf.text(`Lock in & add ${fmt(m.roi)}`, margin + compW / 2, y + 28, { align: "center" });
  pdf.text("in home value", margin + compW / 2, y + 33, { align: "center" });

  // Wait & Pay More
  const nx = margin + compW + 8;
  roundedRect(pdf, nx, y, compW, 40, 4, [254, 242, 242], [252, 165, 165]);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setColor(pdf, RED);
  pdf.text("WAIT & PAY MORE", nx + compW / 2, y + 8, { align: "center" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  setColor(pdf, DARK);
  pdf.text(fmt(futurePrice), nx + compW / 2, y + 20, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  setColor(pdf, GRAY);
  pdf.text(`Same roof costs more &`, nx + compW / 2, y + 28, { align: "center" });
  pdf.text(`you lose ${fmt(m.inflationPenalty)}`, nx + compW / 2, y + 33, { align: "center" });
}

// ─── PAGE: 10-YEAR FINANCIAL IMPACT ──────────────────────────
function drawFinancialImpact(pdf: jsPDF, state: EngineState, computed: ComputedValues, selectedKey: "A" | "B" | "C") {
  const pw = 210;
  const margin = 20;
  const m = getOptionMetrics(selectedKey, computed);
  const label = getOptionLabel(selectedKey, state);

  let y = 18;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  setColor(pdf, DARK);
  pdf.text("10-Year Financial Impact", pw / 2, y, { align: "center" });

  y += 8;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  setColor(pdf, GRAY);
  pdf.text(`Option ${selectedKey}: ${label} — the full picture over 10 years`, pw / 2, y, { align: "center" });

  // Impact rows table
  y += 14;
  const colW = pw - margin * 2;
  const rowH = 18;

  // Header
  roundedRect(pdf, margin, y, colW, 10, 3, BLUE);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setColor(pdf, WHITE);
  pdf.text("CATEGORY", margin + 8, y + 7);
  pdf.text("MOVE FORWARD", margin + colW * 0.55, y + 7);
  pdf.text("DO NOTHING", margin + colW * 0.8, y + 7);
  y += 12;

  const rows = [
    {
      label: "Home Value Increase",
      hint: `${state.roiPercent}% ROI on ${fmt(m.price)}`,
      forward: `+${fmt(m.roi)}`,
      nothing: "$0",
      forwardColor: GREEN,
      nothingColor: GRAY,
    },
    {
      label: "Energy Savings (10yr)",
      hint: `${state.energySavingsPct}% of ${fmt(state.monthlyBill)}/mo x 120`,
      forward: `+${fmt(computed.energySavings)}`,
      nothing: `-${fmt(computed.tenYearCost)}`,
      forwardColor: GREEN,
      nothingColor: [220, 38, 38] as RGB,
    },
    {
      label: "Price Lock Savings",
      hint: "8% annual material inflation over 10 years",
      forward: `+${fmt(m.lockedInSavings)}`,
      nothing: `-${fmt(m.inflationPenalty)}`,
      forwardColor: GREEN,
      nothingColor: [220, 38, 38] as RGB,
    },
  ];

  rows.forEach((row, i) => {
    if (i % 2 === 0) {
      roundedRect(pdf, margin, y, colW, rowH, 2, LIGHT_BG);
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    setColor(pdf, DARK);
    pdf.text(row.label, margin + 8, y + 7);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    setColor(pdf, GRAY);
    pdf.text(row.hint, margin + 8, y + 13);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    setColor(pdf, row.forwardColor);
    pdf.text(row.forward, margin + colW * 0.55, y + 10);

    setColor(pdf, row.nothingColor);
    pdf.text(row.nothing, margin + colW * 0.8, y + 10);

    y += rowH;
  });

  // Totals
  y += 6;
  const totalH = 30;
  const halfW = (colW - 8) / 2;

  // Move Forward total
  roundedRect(pdf, margin, y, halfW, totalH, 4, [240, 253, 244], [134, 239, 172]);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setColor(pdf, GREEN);
  pdf.text("MOVE FORWARD", margin + halfW / 2, y + 8, { align: "center" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  setColor(pdf, DARK);
  pdf.text(`+${fmt(m.moveForward)}`, margin + halfW / 2, y + 22, { align: "center" });

  // Do Nothing total
  const RED: RGB = [220, 38, 38];
  const dnx = margin + halfW + 8;
  roundedRect(pdf, dnx, y, halfW, totalH, 4, [254, 242, 242], [252, 165, 165]);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setColor(pdf, RED);
  pdf.text("DO NOTHING", dnx + halfW / 2, y + 8, { align: "center" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  setColor(pdf, DARK);
  pdf.text(fmt(m.doNothing), dnx + halfW / 2, y + 22, { align: "center" });

  // Net advantage
  y += totalH + 10;
  roundedRect(pdf, margin + 20, y, colW - 40, 28, 5, BLUE);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setColor(pdf, [200, 220, 255]);
  pdf.text("NET ADVANTAGE OF MOVING FORWARD", pw / 2, y + 8, { align: "center" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  setColor(pdf, WHITE);
  pdf.text(`+${fmt(m.netDiff)}`, pw / 2, y + 22, { align: "center" });
}

// ─── MAIN EXPORT ──────────────────────────────────────────────
export async function exportCustomerPdf(
  state: EngineState,
  computed: ComputedValues,
  options: { key: "A" | "B" | "C"; name: string; price: number; monthly: number }[],
  filename = "DaBella-Proposal.pdf",
  selectedOption?: "A" | "B" | "C" | null,
) {
  const pdf = new jsPDF("p", "mm", "a4");
  const isWindows = state.product === "Windows";
  let pageCount = selectedOption ? 6 : 4;
  if (isWindows) pageCount += 1; // window inspection page

  drawCover(pdf, state);

  pdf.addPage();
  drawOptions(pdf, state, computed, options);

  if (selectedOption) {
    pdf.addPage();
    drawTClose(pdf, state, computed, selectedOption);

    pdf.addPage();
    drawFinancialImpact(pdf, state, computed, selectedOption);
  }

  if (isWindows) {
    pdf.addPage();
    drawWindowInspection(pdf, state);
  }

  pdf.addPage();
  drawScope(pdf, state);

  pdf.addPage();
  drawWelcome(pdf, state);

  // Footer on content pages (all except cover and welcome)
  const totalPages = pdf.getNumberOfPages();
  for (let p = 2; p <= totalPages - 1; p++) {
    pdf.setPage(p);
    drawLine(pdf, 20, 285, 190, 285, BORDER);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    setColor(pdf, GRAY);
    pdf.text("DaBella — Home Improvement Experts", 20, 290);
    pdf.text(`Page ${p} of ${totalPages}`, 190, 290, { align: "right" });
  }

  pdf.save(filename);
}
