/** Pure helpers powering the Dashboard "Earnings vs lead flow" chart and rep economics. */

export type DealLite = {
  created_at?: string | null;
  closed_at?: string | null;
  closed_amount?: number | null;
  stage?: string;
};

export type TrendBucket = {
  date: Date;
  label: string;
  shortDate: string;
  dollars: number;
  leads: number;
};

export type TrendSeries = {
  buckets: TrendBucket[];
  maxDollars: number;
  maxLeads: number;
  totalLeads: number;
  avgDollars: number;
};

/** Build the 14-day series of $/hr (from won deals) and lead count (from created_at). */
export function buildTrendSeries(
  deals: DealLite[],
  weeklyHours: number,
  commissionPct: number,
  days = 14,
): TrendSeries {
  const dayMs = 864e5;
  const hoursPerDay = weeklyHours / 7;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const buckets: TrendBucket[] = Array.from({ length: days }, (_, i) => {
    const d = new Date(today.getTime() - (days - 1 - i) * dayMs);
    return {
      date: d,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      shortDate: `${d.getMonth() + 1}/${d.getDate()}`,
      dollars: 0,
      leads: 0,
    };
  });
  const startMs = buckets[0].date.getTime();
  for (const d of deals) {
    if (d.created_at) {
      const t = new Date(d.created_at).getTime();
      const idx = Math.floor((t - startMs) / dayMs);
      if (idx >= 0 && idx < days) buckets[idx].leads += 1;
    }
    if (d.stage === "won" && d.closed_at) {
      const t = new Date(d.closed_at).getTime();
      const idx = Math.floor((t - startMs) / dayMs);
      if (idx >= 0 && idx < days) {
        const commission = ((d.closed_amount ?? 0) * commissionPct) / 100;
        buckets[idx].dollars += hoursPerDay > 0 ? commission / hoursPerDay : 0;
      }
    }
  }
  const maxDollars = Math.max(1, ...buckets.map((b) => b.dollars));
  const maxLeads = Math.max(1, ...buckets.map((b) => b.leads));
  const totalLeads = buckets.reduce((s, b) => s + b.leads, 0);
  const avgDollars = buckets.reduce((s, b) => s + b.dollars, 0) / days;
  return { buckets, maxDollars, maxLeads, totalLeads, avgDollars };
}
