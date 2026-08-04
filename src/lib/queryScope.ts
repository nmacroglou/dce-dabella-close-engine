/**
 * Owner-scope helper shared by every data hook.
 *
 * Admins can view the whole team (`effectiveRepId === null`) or drill into a
 * single rep. Before this helper each hook re-implemented the same
 * `effectiveRepId ? q.eq("rep_id", id) : q` ternary, which drifted over time
 * (different column names, different null handling). Route every scoped query
 * through `scopeToRep` so the rule lives in exactly one place.
 */
export function scopeToRep<T extends { eq: (col: string, value: string) => T }>(
  query: T,
  effectiveRepId: string | null | undefined,
  column = "rep_id",
): T {
  return effectiveRepId ? query.eq(column, effectiveRepId) : query;
}

/** Shared cache windows so related screens age out at the same rate. */
export const STALE = {
  /** Fast-moving records the rep edits directly (deals, follow-ups). */
  live: 30_000,
  /** Derived aggregates and timelines — expensive, rarely urgent. */
  derived: 60_000,
  /** Reference data that barely changes within a session. */
  reference: 5 * 60_000,
} as const;
