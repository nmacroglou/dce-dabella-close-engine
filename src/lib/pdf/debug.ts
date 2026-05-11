import type { jsPDF } from "jspdf";

export type TextBox = { page: number; x: number; y: number; w: number; h: number; sample: string };

const PT_TO_MM = 0.3527777778;

type TextArgs = Parameters<jsPDF["text"]>;
type TextOpts = TextArgs[3];

/**
 * Monkey-patches `pdf.text` to record an approximate bounding box for every
 * text call. Returns the mutable boxes array; pass it to drawDebugOverlay
 * after the document is built.
 */
export function installDebugRecorder(pdf: jsPDF): TextBox[] {
  const boxes: TextBox[] = [];
  const origText = pdf.text.bind(pdf);

  const wrapped: jsPDF["text"] = function (
    this: jsPDF,
    text: string | string[],
    x: number,
    y: number,
    options?: TextOpts,
    ...rest: unknown[]
  ) {
    try {
      const lines = Array.isArray(text) ? text : String(text).split("\n");
      const sizePt = pdf.getFontSize();
      const lineH = sizePt * PT_TO_MM * 1.15;
      const align = (options as { align?: string } | undefined)?.align ?? "left";
      const charSpace = (options as { charSpace?: number } | undefined)?.charSpace ?? 0;
      let maxW = 0;
      for (const ln of lines) {
        const w = pdf.getTextWidth(ln) + charSpace * Math.max(0, ln.length - 1);
        if (w > maxW) maxW = w;
      }
      let bx = x;
      if (align === "center") bx = x - maxW / 2;
      else if (align === "right") bx = x - maxW;
      const ascent = sizePt * PT_TO_MM * 0.8;
      const by = y - ascent;
      const bh = ascent + lineH * (lines.length - 1) + sizePt * PT_TO_MM * 0.25;
      boxes.push({
        page: pdf.getCurrentPageInfo().pageNumber,
        x: bx, y: by, w: maxW, h: bh,
        sample: String(lines[0]).slice(0, 24),
      });
    } catch { /* no-op */ }
    return (origText as (...a: unknown[]) => jsPDF)(text, x, y, options, ...rest);
  };

  (pdf as unknown as { text: jsPDF["text"] }).text = wrapped;
  return boxes;
}

export function drawDebugOverlay(pdf: jsPDF, boxes: TextBox[]) {
  const total = pdf.getNumberOfPages();
  const overlapsByPage = new Map<number, Set<number>>();

  for (let p = 1; p <= total; p++) {
    const idxs: number[] = [];
    boxes.forEach((b, i) => { if (b.page === p) idxs.push(i); });
    const flagged = new Set<number>();
    for (let i = 0; i < idxs.length; i++) {
      for (let j = i + 1; j < idxs.length; j++) {
        const a = boxes[idxs[i]], b = boxes[idxs[j]];
        if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
          flagged.add(idxs[i]); flagged.add(idxs[j]);
        }
      }
    }
    overlapsByPage.set(p, flagged);
  }

  for (let p = 1; p <= total; p++) {
    pdf.setPage(p);
    pdf.setLineWidth(0.1);
    const flagged = overlapsByPage.get(p) ?? new Set<number>();
    boxes.forEach((b, i) => {
      if (b.page !== p) return;
      const hit = flagged.has(i);
      pdf.setGState(pdf.GState({ opacity: hit ? 0.9 : 0.55 }));
      pdf.setDrawColor(hit ? 220 : 0, hit ? 38 : 132, hit ? 38 : 255);
      pdf.rect(b.x, b.y, b.w, b.h, "S");
    });
    pdf.setGState(pdf.GState({ opacity: 1 }));

    pdf.setFillColor(0, 0, 0);
    pdf.rect(2, 2, 60, 5, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("ProposalSans", "bold");
    pdf.setFontSize(7);
    pdf.text(
      `DEBUG p${p} · ${boxes.filter((b) => b.page === p).length} blocks · ${flagged.size} collisions`,
      3, 5.6,
    );
  }
}
