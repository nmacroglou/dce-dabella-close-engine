import { memo } from "react";
import { TrendingUp, Zap, Receipt, Wallet, ArrowRight } from "lucide-react";
import { formatCurrency, formatCurrencyShort } from "@/lib/format";
import type { YearPoint } from "@/lib/energyLensCalc";

interface Props {
  series: YearPoint[];
  horizon: number;
}

function buildMilestones(horizon: number): number[] {
  const base = [1, 5, 10, 15, 20, 25, 30, 35, 40, 50].filter((y) => y <= horizon);
  if (!base.includes(horizon)) base.push(horizon);
  return base;
}

interface Row {
  year: number;
  bill: number;
  solarValue: number;
  billAfter: number;
  savedThisYr: number;
  cumSaved: number;
  offset: number;
}

function toRow(r: YearPoint): Row {
  const savedThisYr = r.doNothingAnnual - r.withRoofAnnual;
  const cumSaved = r.doNothingCumulative - r.withRoofCumulative;
  const offset = r.doNothingAnnual > 0 ? Math.min(1, r.energyValueAnnual / r.doNothingAnnual) : 0;
  return {
    year: r.year,
    bill: r.doNothingAnnual,
    solarValue: r.energyValueAnnual,
    billAfter: r.withRoofAnnual,
    savedThisYr,
    cumSaved,
    offset,
  };
}

function FormulaChip({
  icon: Icon,
  label,
  expression,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  expression: string;
  tone: "destructive" | "accent" | "muted" | "primary";
}) {
  const tones: Record<typeof tone, string> = {
    destructive: "text-destructive bg-destructive/10 border-destructive/20",
    accent: "text-accent bg-accent/10 border-accent/20",
    muted: "text-muted-foreground bg-muted/60 border-border",
    primary: "text-primary bg-primary/10 border-primary/20",
  };
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-hairline bg-background/70 px-3 py-2.5">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${tones[tone]}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-foreground">{label}</p>
        <p className="text-[11px] font-mono text-muted-foreground leading-snug mt-0.5 break-words">{expression}</p>
      </div>
    </div>
  );
}

export default memo(function YearlySavingsBreakdown({ series, horizon }: Props) {
  const rows = buildMilestones(horizon)
    .map((y) => series[y - 1])
    .filter(Boolean)
    .map(toRow);

  const finalCumulative = rows.length ? rows[rows.length - 1].cumSaved : 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-hairline bg-gradient-to-br from-card via-card to-accent/5 shadow-[var(--shadow-sm)]">
      {/* glow accents */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative p-4 sm:p-6 lg:p-7 space-y-5">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              <TrendingUp className="h-3 w-3" />
              Year-by-year math
            </div>
            <h4 className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
              Yearly power savings
            </h4>
            <p className="text-[11px] sm:text-xs text-muted-foreground max-w-md">
              Every row shows how the dollars add up — yearly column sums exactly to the cumulative total.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80">Total kept</p>
            <p className="font-display text-2xl sm:text-3xl font-extrabold text-primary leading-none">
              {formatCurrencyShort(finalCumulative)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">over {horizon} years</p>
          </div>
        </header>

        {/* Formula key */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <FormulaChip
            icon={Receipt}
            label="Bill"
            expression="today's bill × inflation"
            tone="destructive"
          />
          <FormulaChip
            icon={Zap}
            label="Solar value"
            expression="kWh produced × rate"
            tone="accent"
          />
          <FormulaChip
            icon={Wallet}
            label="Bill after solar"
            expression="max($0, Bill − Solar)"
            tone="muted"
          />
          <FormulaChip
            icon={TrendingUp}
            label="Saved that yr"
            expression="Bill − Bill after solar"
            tone="primary"
          />
        </div>

        {/* Desktop: table */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-hairline bg-background/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40">
                <th className="text-left py-3 px-4 first:rounded-tl-2xl">Year</th>
                <th className="text-right py-3 px-3">Bill</th>
                <th className="text-right py-3 px-3">Solar value</th>
                <th className="text-right py-3 px-3">Bill after solar</th>
                <th className="text-right py-3 px-3">Saved that yr</th>
                <th className="text-right py-3 px-4 last:rounded-tr-2xl">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr
                  key={r.year}
                  className="border-t border-hairline/60 transition-colors hover:bg-primary/[0.03]"
                >
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="font-display font-extrabold text-foreground tabular-nums">Y{r.year}</span>
                      {idx === rows.length - 1 && (
                        <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                          End
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-destructive/90">
                    {formatCurrency(r.bill)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-accent">
                    {formatCurrency(r.solarValue)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-muted-foreground">
                    {formatCurrency(r.billAfter)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-mono tabular-nums font-extrabold text-primary">
                      {formatCurrency(r.savedThisYr)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-display tabular-nums font-extrabold text-primary text-base">
                      {formatCurrencyShort(r.cumSaved)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: cards */}
        <ul className="md:hidden space-y-2.5">
          {rows.map((r, idx) => (
            <li
              key={r.year}
              className="rounded-2xl border border-hairline bg-background/60 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-extrabold text-foreground">Year {r.year}</span>
                  {idx === rows.length - 1 && (
                    <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                      End
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Cumulative</p>
                  <p className="font-display text-xl font-extrabold text-primary leading-none tabular-nums">
                    {formatCurrencyShort(r.cumSaved)}
                  </p>
                </div>
              </div>

              {/* Math row */}
              <div className="rounded-xl bg-muted/40 p-2.5 text-[11px] font-mono">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-destructive/90 tabular-nums">{formatCurrency(r.bill)}</span>
                  <span className="text-muted-foreground">−</span>
                  <span className="text-muted-foreground tabular-nums">{formatCurrency(r.billAfter)}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-primary font-bold tabular-nums">{formatCurrency(r.savedThisYr)}</span>
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground uppercase tracking-wider mt-1 px-0.5">
                  <span>Bill</span>
                  <span>After solar</span>
                  <span>Saved</span>
                </div>
              </div>

              {/* Offset bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-semibold">
                  <span className="text-muted-foreground uppercase tracking-wider">Solar value</span>
                  <span className="text-accent tabular-nums">{formatCurrency(r.solarValue)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-primary transition-all"
                    style={{ width: `${Math.round(r.offset * 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground">
                  {Math.round(r.offset * 100)}% of the year's bill covered
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Footnote */}
        <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-hairline pt-3">
          <span className="font-semibold text-foreground">Why "Saved" can be less than "Solar value":</span>{" "}
          if the roof produces more than the bill in a year, the extra exports at a lower credit rate — the bill can only drop to $0, not below. Add up "Saved that yr" and you get Cumulative exactly.
        </p>
      </div>
    </section>
  );
});
