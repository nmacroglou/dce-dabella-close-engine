import jsPDF from "jspdf";
import type { EngineState, ComputedValues } from "@/hooks/useCloseEngine";
import { FEATURES_BY_OPTION } from "@/components/engine/presentation/constants";
import dabellaLogoUrl from "@/assets/dabella-logo.png";

async function loadImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// Brand colors
const BLUE = [37, 99, 235] as const;     // primary
const DARK = [15, 23, 42] as const;      // headings
const GRAY = [100, 116, 139] as const;   // body text
const LIGHT_BG = [248, 250, 252] as const;
const WHITE = [255, 255, 255] as const;
const GREEN = [16, 185, 129] as const;
const AMBER = [245, 158, 11] as const;
const BORDER = [226, 232, 240] as const;

type RGB = readonly [number, number, number];

function setColor(pdf: jsPDF, c: RGB) {
  pdf.setTextColor(c[0], c[1], c[2]);
}

function setFill(pdf: jsPDF, c: RGB) {
  pdf.setFillColor(c[0], c[1], c[2]);
}

function setDraw(pdf: jsPDF, c: RGB) {
  pdf.setDrawColor(c[0], c[1], c[2]);
}

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
function drawCover(pdf: jsPDF, state: EngineState, logoData: string) {
  const pw = 210, ph = 297;
  const names = state.homeowner2 ? `${state.homeowner1} & ${state.homeowner2}` : state.homeowner1;

  // Full-page blue gradient bar at top
  setFill(pdf, BLUE);
  pdf.rect(0, 0, pw, 100, "F");

  // Subtle lighter overlay
  pdf.setGState(pdf.GState({ opacity: 0.08 }));
  setFill(pdf, WHITE);
  pdf.circle(160, 20, 60, "F");
  pdf.circle(30, 80, 40, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));

  // Logo image
  const logoW = 70;
  const logoH = logoW * (512 / 1024);
  pdf.addImage(logoData, "PNG", (pw - logoW) / 2, 18, logoW, logoH);

  // Main content area
  const cy = 140;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  setColor(pdf, BLUE);
  pdf.text("PREPARED EXCLUSIVELY FOR", pw / 2, cy, { align: "center" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  setColor(pdf, DARK);
  pdf.text(names, pw / 2, cy + 18, { align: "center" });

  // Divider
  drawLine(pdf, 70, cy + 30, 140, cy + 30, BORDER);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  setColor(pdf, DARK);
  pdf.text(`${state.product} Proposal`, pw / 2, cy + 48, { align: "center" });

  // Date
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  setColor(pdf, GRAY);
  pdf.text(today, pw / 2, cy + 62, { align: "center" });

  // Bottom trust badges
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
  const colW = (pw - margin * 2 - 12) / 3; // 3 cols with 6px gaps

  // Header
  let y = 18;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  setColor(pdf, DARK);
  pdf.text(`Your ${state.product} Options`, pw / 2, y, { align: "center" });

  y += 8;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  setColor(pdf, GRAY);
  const names = state.homeowner2 ? `${state.homeowner1} & ${state.homeowner2}` : state.homeowner1;
  pdf.text(`${names} — a side-by-side comparison tailored for your home`, pw / 2, y, { align: "center" });

  y += 10;

  const OPTION_COLORS: Record<string, RGB> = {
    A: BLUE,
    B: GREEN,
    C: AMBER,
  };

  const OPTION_BADGES: Record<string, string> = {
    A: "BEST VALUE",
    B: "MOST POPULAR",
    C: "SMART START",
  };

  options.forEach((opt, i) => {
    const x = margin + i * (colW + 6);
    const cardTop = y;
    const color = OPTION_COLORS[opt.key];

    // Card background
    roundedRect(pdf, x, cardTop, colW, 175, 4, WHITE, BORDER);

    // Top color bar
    setFill(pdf, color);
    pdf.roundedRect(x, cardTop, colW, 6, 4, 4, "F");
    // Cover bottom corners of the bar
    pdf.rect(x, cardTop + 3, colW, 3, "F");

    // Badge
    const badgeW = 28;
    setFill(pdf, color);
    pdf.roundedRect(x + (colW - badgeW) / 2, cardTop + 1, badgeW, 8, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(5.5);
    setColor(pdf, WHITE);
    pdf.text(OPTION_BADGES[opt.key], x + colW / 2, cardTop + 6, { align: "center" });

    // Option label
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
    nameLines.forEach((line: string, li: number) => {
      pdf.text(line, x + 8, cy + li * 5);
    });
    cy += nameLines.length * 5 + 4;

    // Price box
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

    // Features
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
      fLines.forEach((line: string, li: number) => {
        pdf.text(line, x + 14, cy + li * 3.5);
      });
      cy += fLines.length * 3.5 + 2;
    });

    // Value snapshot
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
const SCOPE_ITEMS = [
  "Supply Dumpster",
  "Tear-off of existing roofing to wood deck",
  "Replace damaged wood decking as needed",
  "Replace/install flashing",
  "Install drip and rake edge metal",
  "Install new pipe jacks and boots",
  "Install WEATHER WATCH Mineral Surfaced Leak Barrier on valleys, around skylights, chimney & all penetrations",
  "Underlayment over roof deck: TIGER PAW Roof Deck Protection or DECK ARMOR",
  "Install PRO START/WEATHER BLOCKER starter strips on all eaves and rakes",
  "Replace attic ventilation with COBRA SNOW COUNTRY exhaust Ridge Vent System and bring to code",
  "Install GAF Timberline shingles with StainGuard Algae Discoloration Protection",
  "Cap ridges and hips with RIDGLASS Premium Ridge Cap Shingles",
  "Installed by GAF Factory Certified Installers",
  "Haul away job debris, magnetically sweep yard, driveway, etc.",
];

function drawScope(pdf: jsPDF) {
  const pw = 210;
  const margin = 20;

  let y = 18;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  setColor(pdf, DARK);
  pdf.text("What to Expect", pw / 2, y, { align: "center" });

  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  setColor(pdf, GRAY);
  pdf.text("Your complete scope of work — everything included in your project", pw / 2, y, { align: "center" });

  y += 12;

  // Scope card
  roundedRect(pdf, margin, y, pw - margin * 2, SCOPE_ITEMS.length * 13 + 16, 5, WHITE, BORDER);

  let sy = y + 10;
  SCOPE_ITEMS.forEach((item, i) => {
    const rowX = margin + 8;
    const rowW = pw - margin * 2 - 16;

    // Alternating background
    if (i % 2 === 0) {
      roundedRect(pdf, margin + 4, sy - 3.5, pw - margin * 2 - 8, 12, 2, LIGHT_BG);
    }

    // Checkbox
    setFill(pdf, BLUE);
    pdf.roundedRect(rowX, sy - 2.5, 5, 5, 1, 1, "F");
    // Checkmark
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    setColor(pdf, WHITE);
    pdf.text("✓", rowX + 2.5, sy + 1, { align: "center" });

    // Text
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    setColor(pdf, DARK);
    const lines = pdf.splitTextToSize(item, rowW - 12);
    lines.forEach((line: string, li: number) => {
      pdf.text(line, rowX + 9, sy + li * 4);
    });
    sy += Math.max(lines.length * 4, 12) + 1;
  });

  // Confirmation prompt
  sy += 8;
  roundedRect(pdf, 40, sy, pw - 80, 14, 3, LIGHT_BG);
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(9);
  setColor(pdf, DARK);
  pdf.text('"Does that sound like everything we have spoken about today?"', pw / 2, sy + 9, { align: "center" });
}

// ─── PAGE 4: WELCOME ─────────────────────────────────────────
function drawWelcome(pdf: jsPDF, state: EngineState, logoData: string) {
  const pw = 210, ph = 297;
  const names = state.homeowner2 ? `${state.homeowner1} & ${state.homeowner2}` : state.homeowner1;

  // Full blue background
  setFill(pdf, BLUE);
  pdf.rect(0, 0, pw, ph, "F");

  // Decorative circles
  pdf.setGState(pdf.GState({ opacity: 0.06 }));
  setFill(pdf, WHITE);
  pdf.circle(40, 60, 50, "F");
  pdf.circle(170, 240, 60, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));

  // Logo image
  let y = 75;
  const logoW = 60;
  const logoH = logoW * (512 / 1024);
  pdf.addImage(logoData, "PNG", (pw - logoW) / 2, y, logoW, logoH);

  y += 40;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  setColor(pdf, WHITE);
  pdf.text("Welcome to the Family!", pw / 2, y, { align: "center" });

  y += 14;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  setColor(pdf, [200, 220, 255]);
  const msg = `${names}, congratulations on investing in your home's future.`;
  pdf.text(msg, pw / 2, y, { align: "center" });
  y += 6;
  pdf.text("We're honored to earn your trust.", pw / 2, y, { align: "center" });

  // Perk cards
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

  // Quote
  y += 50;
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(10);
  setColor(pdf, [180, 200, 255]);
  pdf.text('"We don\'t just build homes — we build relationships."', pw / 2, y, { align: "center" });

  // Footer
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  setColor(pdf, [150, 180, 255]);
  pdf.text("www.dabella.us", pw / 2, ph - 20, { align: "center" });
}

// ─── MAIN EXPORT ──────────────────────────────────────────────
export async function exportCustomerPdf(
  state: EngineState,
  computed: ComputedValues,
  options: { key: "A" | "B" | "C"; name: string; price: number; monthly: number }[],
  filename = "DaBella-Proposal.pdf",
) {
  const logoData = await loadImageAsBase64(dabellaLogoUrl);
  const pdf = new jsPDF("p", "mm", "a4");

  // Page 1: Cover
  drawCover(pdf, state, logoData);

  // Page 2: Options
  pdf.addPage();
  drawOptions(pdf, state, computed, options);

  // Page 3: Scope of Work
  pdf.addPage();
  drawScope(pdf);

  // Page 4: Welcome
  pdf.addPage();
  drawWelcome(pdf, state);

  // Footer on pages 2 & 3
  [2, 3].forEach((p) => {
    pdf.setPage(p);
    drawLine(pdf, 20, 285, 190, 285, BORDER);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    setColor(pdf, GRAY);
    pdf.text("DaBella — Home Improvement Experts", 20, 290);
    pdf.text(`Page ${p} of 4`, 190, 290, { align: "right" });
  });

  pdf.save(filename);
}
