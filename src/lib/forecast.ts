import type { Deal } from "@/types/deal";

// Pure forecast math extracted from the Forecast page so the numbers can be
// unit-tested and reused without pulling in the page's React tree.

export const DAY_MS = 86_400_000;
export const RESOLVE_DAYS = 14;
export const LS_KEY = "forecast:v2";

export type PresetKey = "7d" | "30d" | "90d" | "mtd" | "qtd" | "ytd" | "all" | "custom";

export const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "7d", label: "Last 7d" },
  { key: "30d", label: "Last 30d" },
  { key: "90d", label: "Last 90d" },
  { key: "mtd", label: "MTD" },
  { key: "qtd", label: "QTD" },
  { key: "ytd", label: "YTD" },
  { key: "all", label: "All time" },
];

export function startOfDay(d: Date): Date {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}
export function endOfDay(d: Date): Date {
  const x = new Date(d); x.setHours(23, 59, 59, 999); return x;
}

export function rangeFromPreset(key: PresetKey): { from: Date; to: Date } {
  const now = new Date();
  const to = endOfDay(now);
  let from = startOfDay(now);
  switch (key) {
    case "7d":  from = startOfDay(new Date(now.getTime() - 7 * DAY_MS));  break;
    case "30d": from = startOfDay(new Date(now.getTime() - 30 * DAY_MS)); break;
    case "90d": from = startOfDay(new Date(now.getTime() - 90 * DAY_MS)); break;
    case "mtd": from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)); break;
    case "qtd": {
      const q = Math.floor(now.getMonth() / 3) * 3;
      from = startOfDay(new Date(now.getFullYear(), q, 1));
      break;
    }
    case "ytd": from = startOfDay(new Date(now.getFullYear(), 0, 1)); break;
    case "all":
    case "custom":
      from = new Date(2000, 0, 1); break;
  }
  return { from, to };
}

export function wonValue(d: Deal): number {
  if (d.closed_amount && d.closed_amount > 0) return d.closed_amount;
  const opt = d.selected_option;
  const optPrice = opt === "A" ? d.price_a : opt === "B" ? d.price_b : opt === "C" ? d.price_c : null;
  if (optPrice && optPrice > 0) return optPrice;
  return Math.max(d.price_a ?? 0, d.price_b ?? 0, d.price_c ?? 0);
}

export function isPostSaleCancel(d: Deal): boolean {
  return d.stage === "disqualified" && (
    !!d.selected_option || (d.closed_amount ?? 0) > 0 || d.was_demoed
  );
}

/** Full stat computation for a date window. Extracted so we can compute a
 *  prior period identical to the current one for delta arrows. */
export function computeStats(
  deals: Deal[],
  from: Date,
  to: Date,
  strictLeads: boolean,
) {
  const fromMs = from.getTime();
  const toMs = to.getTime();
  const inRangeCreated = (d: Deal) => {
    const t = d.created_at ? new Date(d.created_at).getTime() : 0;
    return t >= fromMs && t <= toMs;
  };
  const inRangeClosed = (d: Deal) => {
    const t = d.closed_at ? new Date(d.closed_at).getTime() : 0;
    return t >= fromMs && t <= toMs;
  };

  const allCreated = deals.filter(inRangeCreated);
  // Lead = every deal card created in range. Strict = only ones that reached a sit
  // (any stage past inspecting, OR flagged demoed/presented). This mirrors how
  // Workday counts "leads run" vs "leads assigned".
  const isSit = (d: Deal) =>
    d.was_demoed || d.was_presented ||
    d.stage === "presented" || d.stage === "follow_up" ||
    d.stage === "won" || d.stage === "lost";
  const leadDeals = strictLeads ? allCreated.filter(isSit) : allCreated;
  const leads = leadDeals.length;
  const pitched = leadDeals.filter((d) => d.was_presented || d.stage === "presented" || d.stage === "follow_up" || d.stage === "won" || d.stage === "lost").length;
  const dqInRange = allCreated.filter((d) => d.stage === "disqualified").length;
  const pitchDenom = strictLeads ? leads : Math.max(0, leads - dqInRange);
  const pitchRate = pitchDenom > 0 ? pitched / pitchDenom : 0;

  const wonInWin = deals.filter((d) => d.stage === "won" && inRangeClosed(d));
  const lostInWin = deals.filter((d) => d.stage === "lost" && inRangeClosed(d));

  const now = Date.now();
  const resolveCutoff = now - RESOLVE_DAYS * DAY_MS;
  const presentationsInWin = allCreated.filter(
    (d) => d.stage === "presented" || d.stage === "follow_up" || d.stage === "won" || d.stage === "lost",
  );
  const cohort = presentationsInWin.filter((d) =>
    d.stage === "won" || d.stage === "lost" ||
    new Date(d.stage_changed_at).getTime() <= resolveCutoff
  );
  const cohortWon = cohort.filter((d) => d.stage === "won").length;
  const closeRate = cohort.length > 0 ? cohortWon / cohort.length : 0;
  const stillDeciding = presentationsInWin.length - cohort.length;

  const gross = wonInWin.reduce((s, d) => s + wonValue(d), 0);
  const avgTicket = wonInWin.length > 0 ? gross / wonInWin.length : 0;

  const cancels = allCreated.filter(isPostSaleCancel).length;
  const soldOrCancelled = wonInWin.length + cancels;
  const retentionRate = soldOrCancelled > 0 ? wonInWin.length / soldOrCancelled : 1;
  const nis = gross * retentionRate;

  const spanEnd = Math.min(now, toMs);
  const spanDays = Math.max(1, Math.ceil((spanEnd - fromMs) / DAY_MS));
  const weeksActive = spanDays / 7;
  const monthsActive = spanDays / 30;

  return {
    leads, pitched, pitchDenom, dqInRange,
    won: wonInWin.length, lost: lostInWin.length,
    cohortSize: cohort.length, cohortWon, stillDeciding,
    gross, avgTicket, cancels, retentionRate, nis,
    pitchRate, closeRate,
    spanDays, weeksActive, monthsActive,
    nisPerWeek: nis / weeksActive,
    nisPerMonth: nis / monthsActive,
    leadsPerWeek: leads / weeksActive,
  };
}

export function delta(cur: number, prev: number): { dir: "up" | "down" | "flat"; pct: number } {
  if (!isFinite(prev) || (prev === 0 && cur === 0)) return { dir: "flat", pct: 0 };
  if (prev === 0) return { dir: "up", pct: 100 };
  const p = ((cur - prev) / prev) * 100;
  if (Math.abs(p) < 1) return { dir: "flat", pct: 0 };
  return { dir: p > 0 ? "up" : "down", pct: Math.abs(p) };
}

export type Scenario = {
  nisPerWeek: number; nisPerMonth: number;
  weeksToGoal: number; projectedDate: Date | null;
};

export type S = { leads: number; pitchRate: number; closeRate: number; avgTicket: number; retentionRate: number };
export function projectNIS(s: S, o: { close?: number; pitch?: number; extraLeads?: number }) {
  const leads = s.leads + (o.extraLeads ?? 0);
  const pitch = o.pitch ?? s.pitchRate;
  const close = o.close ?? s.closeRate;
  return leads * pitch * close * s.avgTicket * s.retentionRate;
}
