/**
 * Extract a human-readable message from any thrown value.
 * Standard helper for toast.error callbacks so every mutation reports
 * the underlying error consistently instead of a generic string.
 */
export function errMsg(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "string") return err || fallback;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m) return m;
  }
  return fallback;
}
