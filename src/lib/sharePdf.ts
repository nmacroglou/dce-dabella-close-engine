import { supabase } from "@/integrations/supabase/client";

/** Upload a PDF blob to public storage and return its public URL. */
export async function uploadProposalPdf(blob: Blob, filename: string): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("You must be signed in to share a proposal.");

  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/proposals/${Date.now()}-${safe}`;

  const { error } = await supabase.storage
    .from("followup-attachments")
    .upload(path, blob, {
      contentType: "application/pdf",
      cacheControl: "3600",
      upsert: false,
    });
  if (error) throw error;

  const { data } = supabase.storage.from("followup-attachments").getPublicUrl(path);
  return data.publicUrl;
}

/** Try the native Web Share API with a file. Falls back to URL-only share. */
export async function nativeShare(opts: {
  title: string;
  text: string;
  url?: string;
  file?: File;
}): Promise<boolean> {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (!nav.share) return false;
  try {
    if (opts.file && nav.canShare?.({ files: [opts.file] })) {
      await nav.share({ title: opts.title, text: opts.text, files: [opts.file] });
      return true;
    }
    await nav.share({ title: opts.title, text: opts.text, url: opts.url });
    return true;
  } catch {
    return false;
  }
}

export function buildEmailLink(to: string, subject: string, body: string) {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${encodeURIComponent(to)}?${params.toString()}`;
}

export function buildSmsLink(to: string, body: string) {
  // iOS uses &, Android uses ?body= — both accept ?body= reliably
  return `sms:${encodeURIComponent(to)}?body=${encodeURIComponent(body)}`;
}
