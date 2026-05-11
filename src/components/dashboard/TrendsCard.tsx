import { memo, useMemo, useState } from "react";
import { LineChart } from "lucide-react";
import { fmt } from "@/lib/format";
import { bucketByDay, bucketByWeek, sumBuckets, splitCurrentPrior, wowDelta, type Bucket } from "@/lib/dashboardSeries";
import type { Deal } from "@/types/deal";

type RangeKey = "7d" | "4w" | "12w";
type MetricKey = "revenue" | "dealsRun" | "won" | "leads" | "dollarsPerHour";

const METRICS: { key: MetricKey; label: string; isCurrency?: boolean; isCount?: boolean }[] = [
  { key: "revenue", label: "Revenue", isCurrency: true },
  { key: "dollarsPerHour", label: "$/Hour", isCurrency: true },
  { key: "won", label: "Wins", isCount: true },
  { key: "dealsRun", label: "Deals Run", isCount: true },
  { key: "leads", label: "Leads", isCount: true },
];

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7d" },
  { key: "4w", label: "4w" },
  { key: "12w", label: "12w" },
];

function formatVal(n: number, metric: MetricKey) {
  const m = METRICS.find((x) => x.key === metric)!;
  if (m.isCurrency) return fmt(Math.round(n));
  return String(Math.round(n));
}

function MainChart({ buckets, metric }: { buckets: Bucket[]; metric: MetricKey }) {
  const W = 800, H = 220, PAD_L = 44, PAD_R = 16, PAD_T = 16, PAD_B = 26;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const { current, prior } = splitCurrentPrior(buckets);
  const len = current.length;
  if (len === 0) return null;

  const allVals = [...current, ...prior].map((b) => b[metric] as number);
  const max = Math.max(1, ...allVals);
  const x = (i: number) => PAD_L + (innerW * i) / Math.max(1, len - 1);
  const y = (v: number) => PAD_T + innerH - (v / max) * innerH;

  const path = (arr: Bucket[]) =>
    arr.map((b, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(b[metric] as number).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[220px] min-w-[560px]" preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((p) => {
        const yy = PAD_T + innerH * (1 - p);
        return (
          <g key={p}>
            <line x1={PAD_L} x2={W - PAD_R} y1={yy} y2={yy} stroke="hsl(var(--border))" strokeDasharray="2 4" strokeWidth="1" />
            <text x={PAD_L - 6} y={yy + 3} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 9 }}>
              {formatVal(max * p, metric)}
            </text>
          </g>
        );
      })}
      {/* Prior period — dashed muted */}
      <path d={path(prior)} fill="none" stroke="hsl(var(--muted-foreground))" strokeOpacity="0.55"
        strokeWidth="2" strokeDasharray="4 4" strokeLinejoin="round" />
      {/* Current period — solid + area */}
      <path d={`${path(current)} L ${x(len - 1).toFixed(1)} ${(PAD_T + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(PAD_T + innerH).toFixed(1)} Z`} fill="url(#trendGrad)" />
      <path d={path(current)} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {current.map((b, i) => (
        <circle key={i} cx={x(i)} cy={y(b[metric] as number)} r={2.5} fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth="1.5">
          <title>{`${b.shortDate} — ${formatVal(b[metric] as number, metric)}`}</title>
        </circle>
      ))}
      {current.map((b, i) => (
        <text key={`x${i}`} x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9 }}>
          {b.shortDate}
        </text>
      ))}
    </svg>
  );
}

function Sparkline({ buckets, metric }: { buckets: Bucket[]; metric: MetricKey }) {
  const W = 120, H = 32;
  const { current } = splitCurrentPrior(buckets);
  const vals = current.map((b) => b[metric] as number);
  const max = Math.max(1, ...vals);
  const path = vals.map((v, i) => {
    const x = (W * i) / Math.max(1, vals.length - 1);
    const y = H - (v / max) * H;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-8" preserveAspectRatio="none">
      <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendsCardBase({ deals, weeklyHours, commissionPct }: {
  deals: Deal[]; weeklyHours: number; commissionPct: number;
}) {
  const [range, setRange] = useState<RangeKey>("4w");
  const [metric, setMetric] = useState<MetricKey>("revenue");

  const buckets = useMemo(() => {
    if (range === "7d") return bucketByDay(deals, 14, weeklyHours, commissionPct); // 7 cur vs 7 prior
    if (range === "4w") return bucketByWeek(deals, 8, weeklyHours, commissionPct);
    return bucketByWeek(deals, 24, weeklyHours, commissionPct); // 12 cur vs 12 prior
  }, [deals, range, weeklyHours, commissionPct]);

  const { current, prior } = useMemo(() => splitCurrentPrior(buckets), [buckets]);
  const cur = sumBuckets(current, metric);
  const pri = sumBuckets(prior, metric);
  const delta = wowDelta(cur, pri);
  const deltaTone = delta.dir === "up" ? "text-success" : delta.dir === "down" ? "text-destructive" : "text-muted-foreground";

  return (
    <section className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-5 lg:p-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary/15 grid place-items-center border border-border">
            <LineChart className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Trends — period over period</h3>
            <p className="text-[11px] text-muted-foreground">Solid = current period · dashed = prior period</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="inline-flex rounded-lg border border-border bg-background/60 p-0.5">
            {RANGES.map((r) => (
              <button key={r.key} onClick={() => setRange(r.key)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                  range === r.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{METRICS.find((m) => m.key === metric)?.label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-display font-extrabold text-foreground tabular-nums">{formatVal(cur, metric)}</p>
            <span className={`text-xs font-bold ${deltaTone}`}>
              {delta.dir === "flat" ? "—" : `${delta.dir === "up" ? "▲" : "▼"} ${delta.pct.toFixed(0)}%`}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">prior {formatVal(pri, metric)}</p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-background/60 p-0.5 flex-wrap">
          {METRICS.map((m) => (
            <button key={m.key} onClick={() => setMetric(m.key)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                metric === m.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <MainChart buckets={buckets} metric={metric} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
        {METRICS.filter((m) => m.key !== metric).slice(0, 4).map((m) => {
          const c = sumBuckets(current, m.key);
          const p = sumBuckets(prior, m.key);
          const d = wowDelta(c, p);
          const tone = d.dir === "up" ? "text-success" : d.dir === "down" ? "text-destructive" : "text-muted-foreground";
          return (
            <button key={m.key} onClick={() => setMetric(m.key)}
              className="text-left rounded-xl border border-border bg-background/40 hover:bg-background/70 p-3 transition-colors">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">{m.label}</p>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-display font-extrabold text-foreground tabular-nums">{formatVal(c, m.key)}</p>
                <span className={`text-[10px] font-bold ${tone}`}>
                  {d.dir === "flat" ? "—" : `${d.dir === "up" ? "▲" : "▼"}${d.pct.toFixed(0)}%`}
                </span>
              </div>
              <Sparkline buckets={buckets} metric={m.key} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

export const TrendsCard = memo(TrendsCardBase);
