import type { jsPDF } from "jspdf";
import type { EngineState } from "@/types/engine";
import { hasProduct } from "@/lib/engineHelpers";
import {
  SCOPE_ITEMS,
  TILE_ROOF_SCOPE_ITEMS,
  TPO_ROOF_SCOPE_ITEMS,
  STUCCO_SCOPE_ITEMS,
  PAINT_SCOPE_ITEMS,
  SIDING_SCOPE_ITEMS,
  BATH_SCOPE_ITEMS,
  SOLAR_SCOPE_ITEMS,
  GUTTER_SCOPE_ITEMS,
} from "@/data/scopeItems";
import { WINDOW_SCOPE_ITEMS } from "@/data/windowData";
import { ACCENT, FOREST_INK, INK, LIME, MIST, PH, PW, SLATE } from "../theme";
import {
  hairline, pageBg, sectionHeader, setBodyFont, setColor, setDisplayFont,
  trackedText,
} from "../primitives";

export function drawScope(pdf: jsPDF, state: EngineState) {
  pageBg(pdf);
  const isWindows = hasProduct(state.products, "Windows");
  const isRoofing = hasProduct(state.products, "Roofing System");
  const isStucco = hasProduct(state.products, "Stucco");
  const isPaint = hasProduct(state.products, "Paint");
  const isSiding = hasProduct(state.products, "Siding");
  const isBath = hasProduct(state.products, "Bath");
  const isSolar = hasProduct(state.products, "Solar");
  const isGutters = hasProduct(state.products, "Gutters");
  const isTile = isRoofing && state.roofMaterial === "tile";
  const isTpo = isRoofing && state.roofMaterial === "tpo";

  const items: string[] = [];
  const pushUnique = (arr: readonly string[]) => {
    for (const it of arr) if (!items.includes(it)) items.push(it);
  };
  if (isRoofing) {
    if (isTile) pushUnique(TILE_ROOF_SCOPE_ITEMS);
    else if (isTpo) pushUnique(TPO_ROOF_SCOPE_ITEMS);
    else pushUnique(SCOPE_ITEMS);
  }
  if (isWindows) pushUnique(WINDOW_SCOPE_ITEMS);
  if (isStucco) pushUnique(STUCCO_SCOPE_ITEMS);
  if (isPaint) pushUnique(PAINT_SCOPE_ITEMS);
  if (isSiding) pushUnique(SIDING_SCOPE_ITEMS);
  if (isBath) pushUnique(BATH_SCOPE_ITEMS);
  if (isSolar) pushUnique(SOLAR_SCOPE_ITEMS);
  if (isGutters) pushUnique(GUTTER_SCOPE_ITEMS);
  if (items.length === 0) pushUnique(SCOPE_ITEMS);

  const subtitle = isTile
    ? "Every step of your Westlake Royal Roofing Cool Roof tile installation, in order."
    : isTpo
    ? "Every step of your TPO low-slope roof system, in order."
    : isRoofing
    ? "Every step we will take, in order, to bring your project home."
    : isWindows
    ? "Your complete window project — from measure to final walkthrough."
    : isStucco
    ? "Your complete stucco restoration — from prep to final coat."
    : isPaint
    ? "Your complete exterior paint project — from prep to final coat."
    : isSiding
    ? "Your complete siding replacement — from tear-off to trim-out."
    : isBath
    ? "Your complete bath remodel — from demo to final walkthrough."
    : isSolar
    ? "Your complete solar installation — from permit to PTO."
    : isGutters
    ? "Your complete gutter project — from tear-off to clean-up."
    : "Every step we will take, in order, to bring your project home.";

  sectionHeader(pdf, "Scope of Work", "What to Expect.", subtitle);


  const y = 78;
  const colW = (PW - 44 - 10) / 2;
  const lineH = 4.3;
  const perCol = Math.ceil(items.length / 2);
  const maxY = PH - 56;

  // Pre-measure so long steps get the vertical room they need instead of clipping.
  setBodyFont(pdf, 8.5);
  const measured = items.map((item) => pdf.splitTextToSize(item, colW - 18) as string[]);
  const colY = [y, y];

  items.forEach((item, i) => {
    const col = i < perCol ? 0 : 1;
    const lines = measured[i];
    const rowH = Math.max(20, lines.length * lineH + 9);
    const x = 22 + col * (colW + 10);
    let ry = colY[col];
    if (ry + rowH > maxY) return; // never overrun the closing quote
    colY[col] = ry + rowH;

    setDisplayFont(pdf, 16);
    setColor(pdf, LIME);
    pdf.text(String(i + 1).padStart(2, "0"), x, ry + 6);

    hairline(pdf, x + 14, ry + 2, x + colW, ry + 2, MIST, 0.2);

    setBodyFont(pdf, 8.5);
    setColor(pdf, INK);
    lines.forEach((ln: string, li: number) => pdf.text(ln, x + 14, ry + 7 + li * lineH));
  });


  const qy = PH - 50;
  hairline(pdf, 22, qy, PW - 22, qy, ACCENT, 0.4);
  setBodyFont(pdf, 12, "italic");
  setColor(pdf, FOREST_INK);
  pdf.text('"Does that sound like everything we spoke about today?"', PW / 2, qy + 12, { align: "center" });

  setDisplayFont(pdf, 7);
  setColor(pdf, SLATE);
  trackedText(pdf, "YOUR DABELLA PROJECT MANAGER", PW / 2, qy + 19, { align: "center", charSpace: 0.45 });
}
