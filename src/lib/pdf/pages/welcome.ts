import type { jsPDF } from "jspdf";
import type { EngineState } from "@/types/engine";
import { getNames } from "@/lib/engineHelpers";
import { ACCENT, FOREST, FOREST_INK, LIME, PH, PW, WHITE } from "../theme";
import {
  rect, setBodyFont, setColor, setDisplayFont, setDraw, setFill, trackedText,
  vGradient,
} from "../primitives";

export type RepInfo = { name?: string; email?: string; phone?: string };

export function drawWelcome(pdf: jsPDF, state: EngineState, logoDataUrl: string | null, rep?: RepInfo) {
  const names = getNames(state);

  vGradient(pdf, 0, 0, PW, PH, FOREST, FOREST_INK);

  pdf.setGState(pdf.GState({ opacity: 0.06 }));
  setFill(pdf, LIME);
  pdf.circle(40, 50, 60, "F");
  pdf.circle(180, 250, 70, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));

  rect(pdf, 0, 0, PW, 0.6, ACCENT);

  if (logoDataUrl) {
    const logoW = 44;
    const logoH = logoW * (120 / 192);
    pdf.addImage(logoDataUrl, "PNG", (PW - logoW) / 2, 56, logoW, logoH);
  }

  setDisplayFont(pdf, 8);
  setColor(pdf, LIME);
  trackedText(pdf, "DABELLA", PW / 2, 92, { align: "center", charSpace: 0.7 });

  setDisplayFont(pdf, 7.5);
  setColor(pdf, ACCENT);
  trackedText(pdf, "CHAPTER ONE", PW / 2, 122, { align: "center", charSpace: 0.6 });

  setDisplayFont(pdf, 34);
  setColor(pdf, WHITE);
  pdf.text("Welcome Home.", PW / 2, 146, { align: "center" });

  setFill(pdf, ACCENT);
  pdf.rect(PW / 2 - 14, 154, 28, 1.2, "F");

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

  setBodyFont(pdf, 10.5, "italic");
  setColor(pdf, [200, 220, 205]);
  pdf.text('"We don\'t just build homes — we build relationships."', PW / 2, PH - 28, { align: "center" });

  setBodyFont(pdf, 7);
  setColor(pdf, [160, 185, 165]);
  trackedText(pdf, "DABELLA.US", PW / 2, PH - 16, { align: "center", charSpace: 0.65 });
  void FOREST_INK;
}
