import type { jsPDF } from "jspdf";
import type { EngineState } from "@/types/engine";
import {
  type RGB,
  CREAM, FOREST_INK, INK, LIME, LIME_DEEP, NEGATIVE, POSITIVE, PW, SLATE,
} from "../theme";
import {
  eyebrow, pageBg, rect, rounded, sectionHeader, setBodyFont, setColor,
  setDisplayFont, trackedText,
} from "../primitives";

export function drawWindowInspection(pdf: jsPDF, state: EngineState) {
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
