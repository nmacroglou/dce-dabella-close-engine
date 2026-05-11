import type { jsPDF } from "jspdf";
import { fetchArrayBuffer, arrayBufferToBase64 } from "./assets";

// Cache the base64-encoded font payloads at module scope so a second export
// in the same session skips fetch + base64 work. Each new jsPDF instance
// still needs the font files added to its private VFS.
const _b64Cache = new Map<string, string>();

type FontDef = readonly [url: string, family: string, style: "normal" | "bold" | "italic"];

export async function registerPdfFonts(pdf: jsPDF) {
  const basePath = typeof window === "undefined" ? "/dev-server/public/pdf-fonts" : "/pdf-fonts";
  const fonts: readonly FontDef[] = [
    [`${basePath}/LiberationSans-Regular.ttf`, "ProposalSans", "normal"],
    [`${basePath}/LiberationSans-Bold.ttf`, "ProposalSans", "bold"],
    [`${basePath}/LiberationSans-Italic.ttf`, "ProposalSans", "italic"],
  ] as const;

  for (const [url, family, style] of fonts) {
    let b64 = _b64Cache.get(url);
    if (!b64) {
      const data = await fetchArrayBuffer(url);
      if (!data) continue;
      b64 = arrayBufferToBase64(data);
      _b64Cache.set(url, b64);
    }
    const fileName = `${family}-${style}.ttf`;
    pdf.addFileToVFS(fileName, b64);
    pdf.addFont(fileName, family, style);
  }
}
