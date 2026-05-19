/** Pure helpers for the operator dashboard: WoW deltas, day/week buckets, summary text, CSV. */
import type { Deal } from "@/types/deal";
import { formatCurrency } from "@/lib/format";


export type Bucket = {
  date: Date;
  label: string;
  shortDate: string;
  revenue: number;
  dealsRun: number;
  won: number;
  lost: number;
  leads: number;
  dollarsPerHour: number;
};

const dayMs = 864e5;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function bucketByDay(
  deals: Deal[],
  days: number,
  weeklyHours: number,
  commissionPct: number,
): Bucket[] {
  const today = startOfDay(new Date());
  const hoursPerDay = weeklyHours / 7;
  const buckets: Bucket[] = Array.from({ length: days }, (_, i) => {
    const d = new Date(today.getTime() - (days - 1 - i) * dayMs);
    return {
      date: d,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      shortDate: `${d.getMonth() + 1}/${d.getDate()}`,
      revenue: 0,
      dealsRun: 0,
      won: 0,
      lost: 0,
      leads: 0,
      dollarsPerHour: 0,
    };
  });
  const startMs = buckets[0].date.getTime();
  for (const d of deals) {
    if (d.created_at) {
      const idx = Math.floor((new Date(d.created_at).getTime() - startMs) / dayMs);
      if (idx >= 0 && idx < days) {
        buckets[idx].dealsRun += 1;
        buckets[idx].leads += 1;
      }
    }
    if (d.closed_at) {
      const idx = Math.floor((new Date(d.closed_at).getTime() - startMs) / dayMs);
      if (idx >= 0 && idx < days) {
        if (d.stage === "won") {
          buckets[idx].won += 1;
          buckets[idx].revenue += d.closed_amount ?? 0;
          const commission = ((d.closed_amount ?? 0) * commissionPct) / 100;
          buckets[idx].dollarsPerHour += hoursPerDay > 0 ? commission / hoursPerDay : 0;
        } else if (d.stage === "lost") {
          buckets[idx].lost += 1;
        }
      }
    }
  }
  return buckets;
}

export function bucketByWeek(
  deals: Deal[],
  weeks: number,
  weeklyHours: number,
  commissionPct: number,
): Bucket[] {
  const today = startOfDay(new Date());
  // Start of this week (Sun)
  const dow = today.getDay();
  const thisWeekStart = new Date(today.getTime() - dow * dayMs);
  const buckets: Bucket[] = Array.from({ length: weeks }, (_, i) => {
    const start = new Date(thisWeekStart.getTime() - (weeks - 1 - i) * 7 * dayMs);
    return {
      date: start,
      label: `W${i + 1}`,
      shortDate: `${start.getMonth() + 1}/${start.getDate()}`,
      revenue: 0,
      dealsRun: 0,
      won: 0,
      lost: 0,
      leads: 0,
      dollarsPerHour: 0,
    };
  });
  const startMs = buckets[0].date.getTime();
  const weekMs = 7 * dayMs;
  for (const d of deals) {
    if (d.created_at) {
      const idx = Math.floor((new Date(d.created_at).getTime() - startMs) / weekMs);
      if (idx >= 0 && idx < weeks) {
        buckets[idx].dealsRun += 1;
        buckets[idx].leads += 1;
      }
    }
    if (d.closed_at) {
      const idx = Math.floor((new Date(d.closed_at).getTime() - startMs) / weekMs);
      if (idx >= 0 && idx < weeks) {
        if (d.stage === "won") {
          buckets[idx].won += 1;
          buckets[idx].revenue += d.closed_amount ?? 0;
          const commission = ((d.closed_amount ?? 0) * commissionPct) / 100;
          buckets[idx].dollarsPerHour += weeklyHours > 0 ? commission / weeklyHours : 0;
        } else if (d.stage === "lost") {
          buckets[idx].lost += 1;
        }
      }
    }
  }
  return buckets;
}

export type WowDelta = { pct: number; dir: "up" | "down" | "flat"; absolute: number };

export function wowDelta(current: number, prior: number): WowDelta {
  const absolute = current - prior;
  if (prior === 0 && current === 0) return { pct: 0, dir: "flat", absolute: 0 };
  if (prior === 0) return { pct: 100, dir: "up", absolute };
  const pct = ((current - prior) / prior) * 100;
  return {
    pct: Math.abs(pct),
    dir: pct > 1 ? "up" : pct < -1 ? "down" : "flat",
    absolute,
  };
}

export function sumBuckets<K extends keyof Bucket>(buckets: Bucket[], key: K): number {
  return buckets.reduce((s, b) => s + (b[key] as number), 0);
}

/** Splits day-buckets into current/prior halves of equal length. */
export function splitCurrentPrior(buckets: Bucket[]) {
  const half = Math.floor(buckets.length / 2);
  return { prior: buckets.slice(0, half), current: buckets.slice(buckets.length - half) };
}

export type SummaryInput = {
  rangeLabel: string;
  revenue: { current: number; prior: number };
  closedDeals: { current: number; prior: number };
  closeRate: { current: number; prior: number };
  dealsRun: { current: number; prior: number };
  dollarsPerHour: { current: number; prior: number };
  topObjection?: string;
};

const fmtUsd = (n: number) => formatCurrency(n);
const fmtPct = (n: number) => `${Math.round(n * 100)}%`;


export function weeklySummaryText(s: SummaryInput): string {
  const arrow = (cur: number, prior: number) => {
    const d = wowDelta(cur, prior);
    if (d.dir === "flat") return "flat";
    return `${d.dir === "up" ? "▲" : "▼"} ${d.pct.toFixed(0)}%`;
  };
  return [
    `DaBella — ${s.rangeLabel} recap`,
    "",
    `• Revenue: ${fmtUsd(s.revenue.current)} (${arrow(s.revenue.current, s.revenue.prior)} vs prior)`,
    `• Closed deals: ${s.closedDeals.current} (${arrow(s.closedDeals.current, s.closedDeals.prior)})`,
    `• Close rate: ${fmtPct(s.closeRate.current)} (${arrow(s.closeRate.current, s.closeRate.prior)})`,
    `• Deals run: ${s.dealsRun.current} (${arrow(s.dealsRun.current, s.dealsRun.prior)})`,
    `• $/hour: ${fmtUsd(s.dollarsPerHour.current)} (${arrow(s.dollarsPerHour.current, s.dollarsPerHour.prior)})`,
    s.topObjection ? `• Top objection: ${s.topObjection}` : "",
  ].filter(Boolean).join("\n");
}

export function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ].join("\n");
}
