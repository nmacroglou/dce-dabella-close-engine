import type { jsPDF } from "jspdf";
import { fetchArrayBuffer, arrayBufferToBase64 } from "./assets";

// Cache the base64-encoded font payloads at module scope so a second export
// in the same session skips fetch + base64 work. Each new jsPDF instance
// still needs the font files added to its private VFS.
const _b64Cache = new Map<string, string>();

type FontDef = readonly [file: string, family: string, style: "normal" | "bold" | "italic"];

/**
 * Type system for every DaBella PDF.
 *
 * ProposalSans    — Inter (Regular / Bold / Italic): body copy, labels, data.
 * ProposalSansMed — Inter SemiBold: emphasis that shouldn't shout.
 * ProposalDisplay — Plus Jakarta Sans (Bold / ExtraBold): headlines, numbers.
 *
 * Files are subset to Latin + common punctuation so all six weights together
 * add well under 400 KB to the document.
 */
export async function registerPdfFonts(pdf: jsPDF) {
  const basePath = typeof window === "undefined" ? "/dev-server/public/pdf-fonts" : "/pdf-fonts";
  const fonts: readonly FontDef[] = [
    ["Inter-Regular.ttf", "ProposalSans", "normal"],
    ["Inter-Bold.ttf", "ProposalSans", "bold"],
    ["Inter-Italic.ttf", "ProposalSans", "italic"],
    ["Inter-SemiBold.ttf", "ProposalSansMed", "normal"],
    ["Inter-SemiBold.ttf", "ProposalSansMed", "bold"],
    ["PlusJakartaSans-Bold.ttf", "ProposalDisplay", "normal"],
    ["PlusJakartaSans-ExtraBold.ttf", "ProposalDisplay", "bold"],
  ] as const;

  // Fetch all faces in parallel — they're independent network requests.
  const loaded = await Promise.all(
    fonts.map(async ([file, family, style]) => {
      const url = `${basePath}/${file}`;
      let b64 = _b64Cache.get(url);
      if (!b64) {
        const data = await fetchArrayBuffer(url);
        if (!data) return null;
        b64 = arrayBufferToBase64(data);
        _b64Cache.set(url, b64);
      }
      return { b64, file, family, style };
    }),
  );

  for (const entry of loaded) {
    if (!entry) continue;
    pdf.addFileToVFS(entry.file, entry.b64);
    pdf.addFont(entry.file, entry.family, entry.style);
  }
}
