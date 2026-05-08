import { Activity } from "lucide-react";
import { fmt } from "@/lib/format";

export type ChartBucket = { label: string; shortDate: string; dollars: number; leads: number };

export function EarningsLeadFlowChart({
  buckets, maxDollars, maxLeads, totalLeads, avgDollars,
}: {
  buckets: ChartBucket[];
  maxDollars: number; maxLeads: number; totalLeads: number; avgDollars: number;
}) {
  const W = 800, H = 240, PAD_L = 44, PAD_R = 44, PAD_T = 16, PAD_B = 28;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const n = buckets.length;
  const stepX = innerW / Math.max(1, n - 1);
  const x = (i: number) => PAD_L + i * stepX;
  const yDollars = (v: number) => PAD_T + innerH - (v / maxDollars) * innerH;
  const barW = Math.max(6, (innerW / n) * 0.55);

  const linePath = buckets
    .map((b, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${yDollars(b.dollars).toFixed(1)}`)
    .join(" ");
  const areaPath =
    `${linePath} L ${x(n - 1).toFixed(1)} ${(PAD_T + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(PAD_T + innerH).toFixed(1)} Z`;

  return (
    <section className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-5 lg:p-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-success/30 to-primary/20 grid place-items-center border border-border">
            <Activity className="h-4 w-4 text-success" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Earnings velocity vs lead flow</h3>
            <p className="text-[11px] text-muted-foreground">Last 14 days — are inbound leads turning into dollars-per-hour?</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            <span className="text-muted-foreground">$ / hour</span>
            <span className="font-bold text-foreground">avg {fmt(Math.round(avgDollars))}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary/70" />
            <span className="text-muted-foreground">Leads</span>
            <span className="font-bold text-foreground">{totalLeads}</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[240px] min-w-[640px]" preserveAspectRatio="none">
          <defs>
            <linearGradient id="dphGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.45" />
              <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.85" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((p) => {
            const y = PAD_T + innerH * (1 - p);
            return (
              <g key={p}>
                <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="hsl(var(--border))" strokeDasharray="2 4" strokeWidth="1" />
                <text x={PAD_L - 6} y={y + 3} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 9 }}>
                  {fmt(Math.round(maxDollars * p))}
                </text>
                <text x={W - PAD_R + 6} y={y + 3} textAnchor="start" className="fill-muted-foreground" style={{ fontSize: 9 }}>
                  {Math.round(maxLeads * p)}
                </text>
              </g>
            );
          })}

          {buckets.map((b, i) => {
            const h = (b.leads / maxLeads) * innerH;
            const cx = x(i);
            return (
              <rect key={`b${i}`} x={cx - barW / 2} y={PAD_T + innerH - h} width={barW} height={h}
                rx={2} fill="url(#leadGrad)">
                <title>{`${b.shortDate} — ${b.leads} lead${b.leads === 1 ? "" : "s"}`}</title>
              </rect>
            );
          })}

          <path d={areaPath} fill="url(#dphGrad)" />
          <path d={linePath} fill="none" stroke="hsl(var(--success))" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {buckets.map((b, i) => (
            <circle key={`p${i}`} cx={x(i)} cy={yDollars(b.dollars)} r={3} fill="hsl(var(--success))"
              stroke="hsl(var(--card))" strokeWidth="1.5">
              <title>{`${b.shortDate} — ${fmt(Math.round(b.dollars))}/hr · ${b.leads} lead${b.leads === 1 ? "" : "s"}`}</title>
            </circle>
          ))}

          {buckets.map((b, i) => (
            <text key={`x${i}`} x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted-foreground"
              style={{ fontSize: 9, fontWeight: i === buckets.length - 1 ? 700 : 400 }}>
              {b.label}
            </text>
          ))}

          <text x={PAD_L - 36} y={PAD_T - 4} className="fill-success" style={{ fontSize: 9, fontWeight: 700 }}>$/HR</text>
          <text x={W - PAD_R + 6} y={PAD_T - 4} className="fill-primary" style={{ fontSize: 9, fontWeight: 700 }}>LEADS</text>
        </svg>
      </div>
    </section>
  );
}
