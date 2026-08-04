import type { jsPDF } from "jspdf";
import type { EngineState } from "@/types/engine";
import {
  type RGB,
  CARD, CREAM, FOREST_INK, GRAPHITE, INK, LIME, LIME_DEEP, MIST,
  NEG_SOFT, NEGATIVE, PH, POS_SOFT, POSITIVE, PW, SAND, SLATE,
} from "../theme";
import {
  eyebrow, hairline, pageBg, pill, rect, rounded, sectionHeader, setBodyFont,
  setColor, setDisplayFont, setFill, trackedText,
} from "../primitives";

const M = 22;
const CW = PW - M * 2;
const BOTTOM = PH - 24;

const STATUS_COLORS: Record<string, RGB> = { yes: POSITIVE, no: NEGATIVE, na: SLATE };
const STATUS_SOFT: Record<string, RGB> = { yes: POS_SOFT, no: NEG_SOFT, na: SAND };
const STATUS_LABELS: Record<string, string> = { yes: "YES", no: "NO", na: "N/A" };

/** Trim a string to fit `maxW` at the current font, appending an ellipsis. */
function ellipsize(pdf: jsPDF, text: string, maxW: number) {
  if (pdf.getTextWidth(text) <= maxW) return text;
  let t = text;
  while (t.length > 1 && pdf.getTextWidth(`${t}…`) > maxW) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

/** Four-up counts of the inspection outcome. */
function drawGlance(pdf: jsPDF, state: EngineState, y: number) {
  const items = [
    ["Items reviewed", String(state.windowInspection.length), LIME_DEEP] as const,
    ["Confirmed", String(state.windowInspection.filter((e) => e.status === "yes").length), POSITIVE] as const,
    ["Needs attention", String(state.windowInspection.filter((e) => e.status === "no").length), NEGATIVE] as const,
    ["Not applicable", String(state.windowInspection.filter((e) => e.status === "na").length), SLATE] as const,
  ];
  const gap = 5;
  const w = (CW - gap * 3) / 4;
  items.forEach(([label, value, color], i) => {
    const x = M + i * (w + gap);
    rounded(pdf, x, y, w, 20, 2.5, CARD, MIST);
    setFill(pdf, color as RGB);
    pdf.rect(x, y, w, 1.1, "F");
    setDisplayFont(pdf, 15);
    setColor(pdf, color as RGB);
    pdf.text(value, x + 5, y + 11.5);
    setBodyFont(pdf, 6.6);
    setColor(pdf, SLATE);
    trackedText(pdf, label.toUpperCase(), x + 5, y + 16.6, { charSpace: 0.35 });
  });
  return y + 20 + 10;
}

export function drawWindowInspection(pdf: jsPDF, state: EngineState) {
  pageBg(pdf);
  sectionHeader(
    pdf,
    "Window Inspection",
    "What We Found.",
    "An honest, item-by-item review of your existing windows.",
  );

  let y = drawGlance(pdf, state, 74);

  // ── Checklist: two balanced columns, wrapping labels, status pills
  const colGap = 8;
  const colW = (CW - colGap) / 2;
  const half = Math.ceil(state.windowInspection.length / 2);
  const rowH = 10.4;

  const drawColumn = (entries: typeof state.windowInspection, offset: number, x: number) => {
    entries.forEach((entry, i) => {
      const ry = y + i * rowH;
      if (i % 2 === 0) rounded(pdf, x, ry, colW, rowH - 1, 1.6, CREAM);

      const status = entry.status ?? "na";
      const pillLabel = STATUS_LABELS[status] ?? "N/A";
      setDisplayFont(pdf, 6.4);
      const pillW = pdf.getTextWidth(pillLabel) + 7.6;

      setBodyFont(pdf, 8);
      setColor(pdf, INK);
      const label = `${offset + i + 1}. ${entry.label}`;
      pdf.text(ellipsize(pdf, label, colW - pillW - 12), x + 5, ry + 6);

      pill(
        pdf, pillLabel, x + colW - 5 - pillW, ry + 7.4,
        STATUS_SOFT[status] ?? SAND, STATUS_COLORS[status] ?? SLATE, 6.4, 3.2,
      );
    });
  };

  drawColumn(state.windowInspection.slice(0, half), 0, M);
  drawColumn(state.windowInspection.slice(half), half, M + colW + colGap);
  y += half * rowH + 10;

  if (state.windowItems.length === 0) return;

  // ── Window schedule table
  const header = () => {
    eyebrow(pdf, "Window Schedule", M, y, LIME_DEEP, 7.2);
    setDisplayFont(pdf, 12);
    setColor(pdf, FOREST_INK);
    pdf.text(
      `${state.windowItems.length} Window${state.windowItems.length !== 1 ? "s" : ""}`,
      M, y + 8,
    );
    y += 14;
  };

  // Column widths sum exactly to the content width.
  const weights = [9, 19, 26, 30, 18, 18, 36];
  const total = weights.reduce((a, b) => a + b, 0);
  const cols = weights.map((w) => (w / total) * CW);
  const headers = ["#", "LEVEL", "ROOM", "STYLE", "SIZE", "GRIDS", "NOTES"];

  const tableHead = () => {
    rect(pdf, M, y, CW, 7.6, FOREST_INK);
    setDisplayFont(pdf, 6.4);
    setColor(pdf, LIME);
    let hx = M;
    headers.forEach((h, ci) => {
      trackedText(pdf, h, hx + 3, y + 5, { charSpace: 0.25 });
      hx += cols[ci];
    });
    y += 8.4;
  };

  header();
  tableHead();

  state.windowItems.forEach((item, i) => {
    if (y + 8 > BOTTOM) {
      pdf.addPage();
      pageBg(pdf);
      sectionHeader(pdf, "Window Inspection", "Window Schedule (cont.)");
      y = 74;
      tableHead();
    }

    const vals = [
      String(item.number),
      item.level || "—",
      item.room || "—",
      item.style.split(" - ").pop() || item.style,
      item.width && item.height ? `${item.width}×${item.height}` : "—",
      item.gridPattern || "—",
      item.observations || "—",
    ];

    // Notes may wrap to two lines; the row grows to fit.
    setBodyFont(pdf, 7);
    const noteLines = (pdf.splitTextToSize(vals[6], cols[6] - 6) as string[]).slice(0, 2);
    const rh = Math.max(7.6, noteLines.length * 3.9 + 4.2);

    if (i % 2 === 0) rect(pdf, M, y - 2, CW, rh, CREAM);

    let cx = M;
    vals.forEach((v, ci) => {
      setBodyFont(pdf, 7, ci === 0 ? "bold" : "normal");
      setColor(pdf, ci === 0 ? FOREST_INK : ci === 6 ? GRAPHITE : INK);
      if (ci === 6) {
        noteLines.forEach((ln, li) => {
          const last = li === noteLines.length - 1;
          const clipped = last && noteLines.join(" ").length < vals[6].length ? `${ln}…` : ln;
          pdf.text(clipped, cx + 3, y + 2.6 + li * 3.9);
        });
      } else {
        pdf.text(ellipsize(pdf, v, cols[ci] - 5), cx + 3, y + 2.6);
      }
      cx += cols[ci];
    });

    y += rh;
    hairline(pdf, M, y - 2, PW - M, y - 2, MIST, 0.2);
  });
}
