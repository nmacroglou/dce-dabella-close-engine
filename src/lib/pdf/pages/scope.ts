import type { jsPDF } from "jspdf";
import type { EngineState } from "@/types/engine";
import { hasProduct } from "@/lib/engineHelpers";
import { SCOPE_ITEMS } from "@/data/scopeItems";
import { WINDOW_SCOPE_ITEMS } from "@/data/windowData";
import { ACCENT, FOREST_INK, INK, LIME, MIST, PH, PW, SLATE } from "../theme";
import {
  hairline, pageBg, sectionHeader, setBodyFont, setColor, setDisplayFont,
  trackedText,
} from "../primitives";

export function drawScope(pdf: jsPDF, state: EngineState) {
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

  const y = 78;
  const colW = (PW - 44 - 10) / 2;
  const rowH = 20;
  const perCol = Math.ceil(items.length / 2);

  items.forEach((item, i) => {
    const col = i < perCol ? 0 : 1;
    const row = i < perCol ? i : i - perCol;
    const x = 22 + col * (colW + 10);
    const ry = y + row * rowH;

    setDisplayFont(pdf, 16);
    setColor(pdf, LIME);
    pdf.text(String(i + 1).padStart(2, "0"), x, ry + 6);

    hairline(pdf, x + 14, ry + 2, x + colW, ry + 2, MIST, 0.2);

    setBodyFont(pdf, 8.5);
    setColor(pdf, INK);
    const lines = pdf.splitTextToSize(item, colW - 18);
    lines.slice(0, 2).forEach((ln: string, li: number) => pdf.text(ln, x + 14, ry + 7 + li * 4.3));
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
