import { jsPDF } from "jspdf";
import type { EngineState, ComputedValues } from "@/types/engine";
import { hasProduct } from "@/lib/engineHelpers";
import dabellaLogoUrl from "@/assets/dabella-logo.png";

import { loadImageDataUrl } from "./assets";
import { registerPdfFonts } from "./fonts";
import { drawDebugOverlay, installDebugRecorder } from "./debug";
import { drawCover } from "./pages/cover";
import { drawSelectedOption } from "./pages/selectedOption";
import { drawTClose } from "./pages/tClose";
import { drawFinancialImpact } from "./pages/financialImpact";
import { drawWindowInspection } from "./pages/windowInspection";
import { drawScope } from "./pages/scope";
import { drawWelcome } from "./pages/welcome";
import { drawInteriorFooters } from "./pages/footer";

export type ProposalOption = { key: "A" | "B" | "C"; name: string; price: number; monthly: number };
export type RepInfo = { name?: string; email?: string; phone?: string };
export type BuildOptions = { debug?: boolean; rep?: RepInfo };

export async function buildCustomerPdf(
  state: EngineState,
  computed: ComputedValues,
  options: ProposalOption[],
  selectedOption?: "A" | "B" | "C" | null,
  opts?: BuildOptions,
): Promise<{ blob: Blob; doc: jsPDF }> {
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
  const isWindows = hasProduct(state.products, "Windows");
  await registerPdfFonts(pdf);
  const logoDataUrl = await loadImageDataUrl(dabellaLogoUrl);

  const debugBoxes = opts?.debug ? installDebugRecorder(pdf) : null;

  // Cover
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

  drawInteriorFooters(pdf);

  if (debugBoxes) drawDebugOverlay(pdf, debugBoxes);

  return { blob: pdf.output("blob"), doc: pdf };
}

export async function exportCustomerPdf(
  state: EngineState,
  computed: ComputedValues,
  options: ProposalOption[],
  filename = "DaBella-Proposal.pdf",
  selectedOption?: "A" | "B" | "C" | null,
) {
  const { doc } = await buildCustomerPdf(state, computed, options, selectedOption);
  doc.save(filename);
}
