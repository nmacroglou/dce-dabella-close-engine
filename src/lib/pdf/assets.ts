// Asset loaders for the PDF builder. Module-scope cache to avoid refetching
// the same URL across exports in a single session.

const _bufferCache = new Map<string, ArrayBuffer>();
const _dataUrlCache = new Map<string, string>();

export async function fetchArrayBuffer(url: string): Promise<ArrayBuffer | null> {
  if (_bufferCache.has(url)) return _bufferCache.get(url)!;
  try {
    const bunRuntime = (globalThis as { Bun?: { file: (path: string) => { arrayBuffer: () => Promise<ArrayBuffer> } } }).Bun;
    let buf: ArrayBuffer;
    if (typeof window === "undefined" && bunRuntime && url.startsWith("/dev-server/")) {
      buf = await bunRuntime.file(url).arrayBuffer();
    } else {
      const res = await fetch(url);
      buf = await res.arrayBuffer();
    }
    _bufferCache.set(url, buf);
    return buf;
  } catch {
    return null;
  }
}

export async function loadImageDataUrl(url: string): Promise<string | null> {
  if (_dataUrlCache.has(url)) return _dataUrlCache.get(url)!;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const dataUrl = await new Promise<string | null>((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
    if (dataUrl) _dataUrlCache.set(url, dataUrl);
    return dataUrl;
  } catch {
    return null;
  }
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
