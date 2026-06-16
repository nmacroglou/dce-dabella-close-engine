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

  // Fetch all three fonts in parallel — they're independent network requests.
  const loaded = await Promise.all(
    fonts.map(async ([url, family, style]) => {
      let b64 = _b64Cache.get(url);
      if (!b64) {
        const data = await fetchArrayBuffer(url);
        if (!data) return null;
        b64 = arrayBufferToBase64(data);
        _b64Cache.set(url, b64);
      }
      return { b64, family, style };
    }),
  );

  for (const entry of loaded) {
    if (!entry) continue;
    const fileName = `${entry.family}-${entry.style}.ttf`;
    pdf.addFileToVFS(fileName, entry.b64);
    pdf.addFont(fileName, entry.family, entry.style);
  }
}
