import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, LabelList } from "recharts";
import { LEAD_SOURCE_LABELS, type Deal, type LeadSource } from "@/types/deal";
import { Filter } from "lucide-react";
import { pct } from "@/lib/format";

interface Props {
  deals: Deal[];
}

const SOURCE_KEYS: (LeadSource | "unset")[] = ["internet", "canvass", "self_gen", "referral", "other", "unset"];

export function WinLossBySourceChart({ deals }: Props) {
  const data = useMemo(() => {
    const rows = SOURCE_KEYS.map((k) => {
      const label = k === "unset" ? "No source" : LEAD_SOURCE_LABELS[k as LeadSource];
      const inSource = deals.filter((d) => (d.lead_source ?? "unset") === k);
      const won = inSource.filter((d) => d.stage === "won").length;
      const lost = inSource.filter((d) => d.stage === "lost").length;
      const disqualified = inSource.filter((d) => d.stage === "disqualified").length;
      const finished = won + lost + disqualified;
      const closeRate = finished > 0 ? won / finished : 0;
      return { source: label, won, lost, disqualified, finished, closeRate, total: inSource.length };
    }).filter((r) => r.total > 0);
    rows.sort((a, b) => b.finished - a.finished);
    return rows;
  }, [deals]);

  const totalWon = data.reduce((s, r) => s + r.won, 0);
  const totalLost = data.reduce((s, r) => s + r.lost, 0);
  const totalDisqualified = data.reduce((s, r) => s + r.disqualified, 0);
  const overallRate = totalWon + totalLost + totalDisqualified > 0 ? totalWon / (totalWon + totalLost + totalDisqualified) : 0;

  return (
    <section className="rounded-2xl border border-hairline bg-card p-5 shadow-[var(--shadow-md)]">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/15 grid place-items-center">
            <Filter className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Win / Loss / Disqualified by Lead Source</h3>
            <p className="text-xs text-muted-foreground">Where your finished deals actually come from.</p>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Overall close rate: <span className="font-bold text-foreground">{pct(overallRate)}</span>
          <span className="mx-1.5">·</span>
          {totalWon}W · {totalLost}L · {totalDisqualified}D
        </div>
      </div>

      {data.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No finished deals yet — tag deals with a lead source to see this chart.
        </div>
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="source"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number, name: string, item: { payload: typeof data[number] }) => {
                  if (name === "Won") return [`${value} (${pct(item.payload.closeRate)})`, "Won"];
                  if (name === "Disqualified") return [value, "Disqualified"];
                  return [value, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="won" name="Won" stackId="a" fill="hsl(var(--success))" radius={[0, 0, 0, 0]}>
                <LabelList dataKey="won" position="insideTop" fill="hsl(var(--success-foreground))" fontSize={10} />
              </Bar>
              <Bar dataKey="lost" name="Lost" stackId="a" fill="hsl(var(--destructive))" radius={[0, 0, 0, 0]}>
                <LabelList dataKey="lost" position="insideTop" fill="hsl(var(--destructive-foreground))" fontSize={10} />
              </Bar>
              <Bar dataKey="disqualified" name="Disqualified" stackId="a" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="disqualified" position="insideTop" fill="hsl(var(--primary-foreground))" fontSize={10} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {data.map((r) => (
            <div key={r.source} className="rounded-lg border border-border bg-muted/30 px-2.5 py-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground truncate">{r.source}</div>
              <div className="text-sm font-bold text-foreground">{pct(r.closeRate)}</div>
              <div className="text-[10px] text-muted-foreground">{r.won}W · {r.lost}L · {r.disqualified}D</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
