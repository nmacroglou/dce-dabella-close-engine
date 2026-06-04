import * as Recharts from "recharts";
import { formatCurrency as fmtCurrency } from "@/lib/format";

interface TrendMonth {
  label: string;
  expected: number;
  paid: number;
  rate: number;
}

interface Props {
  data: TrendMonth[];
  avgRate: number;
  momentum: number;
  best: { label: string; paid: number } | undefined;
}

export default function LedgerTrendChart({ data, avgRate, momentum, best }: Props) {
  return (
    <div className="rounded-2xl border border-hairline bg-card p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="text-sm font-bold text-foreground">Collection performance · last 12 months</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Expected vs paid each month with rolling collection rate.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <MiniStat
            label="Avg collection"
            value={`${avgRate.toFixed(0)}%`}
            tone={avgRate >= 80 ? "success" : avgRate >= 50 ? "warning" : "danger"}
          />
          <MiniStat
            label="Last 3 mo vs prior"
            value={`${momentum >= 0 ? "+" : ""}${momentum.toFixed(0)}%`}
            tone={momentum >= 0 ? "success" : "danger"}
          />
          <MiniStat
            label="Best month"
            value={best?.paid ? `${best.label} · ${fmtCurrency(best.paid)}` : "—"}
            tone="muted"
          />
        </div>
      </div>
      <div className="h-56">
        <Chart data={data} />
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/40" /> Expected</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-success" /> Paid</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-warning" /> Collection %</span>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: "success" | "warning" | "danger" | "muted" }) {
  const toneCls =
    tone === "success" ? "text-success"
    : tone === "warning" ? "text-warning"
    : tone === "danger" ? "text-destructive"
    : "text-foreground";
  return (
    <div className="flex flex-col items-end leading-tight">
      <span className={`text-sm font-bold tabular-nums ${toneCls}`}>{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
}

function Chart({ data }: { data: TrendMonth[] }) {
  const { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip } = Recharts;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis
          yAxisId="left"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={false} axisLine={false}
          tickFormatter={(v: number) => v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`}
        />
        <YAxis
          yAxisId="right" orientation="right" domain={[0, 100]}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={false} axisLine={false}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: number, name: string) =>
            name === "Collection %" ? [`${value.toFixed(0)}%`, name] : [fmtCurrency(value), name]
          }
        />
        <Bar yAxisId="left" dataKey="expected" name="Expected" fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar yAxisId="left" dataKey="paid" name="Paid" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Line yAxisId="right" type="monotone" dataKey="rate" name="Collection %" stroke="hsl(var(--warning))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--warning))" }} activeDot={{ r: 5 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
