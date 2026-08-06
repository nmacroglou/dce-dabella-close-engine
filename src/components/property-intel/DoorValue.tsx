import { useMemo } from "react";
import { buildIntelMetrics } from "@/lib/propertyIntel/metrics";
import type { PropertyIntelReport } from "@/lib/propertyIntel/types";
import { formatCurrency, formatCount } from "@/lib/format";
import { TrendingUp, ArrowUpRight } from "lucide-react";

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export default function DoorValue({ report }: { report: PropertyIntelReport }) {
  const { economics: e } = useMemo(() => buildIntelMetrics(report), [report]);

  const evTone =
    e.expected_commission >= 900 ? "text-emerald-400"
      : e.expected_commission >= 450 ? "text-primary"
        : e.expected_commission >= 200 ? "text-amber-400" : "text-muted-foreground";

  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-display font-bold uppercase tracking-[0.14em]">Expected value at the door</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Rough estimate</span>
      </div>

      {/* Headline */}
      <div className="rounded-lg border border-hairline bg-muted/20 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expected value of this one knock</p>
        <p className={`text-3xl font-display font-extrabold leading-tight ${evTone}`}>
          {formatCurrency(e.expected_commission)}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Range {formatCurrency(e.ev_low)} – {formatCurrency(e.ev_high)} · {formatCurrency(e.value_per_hour ?? 0)}/hr at ~{e.minutes_invested} min invested
        </p>
        <p className="mt-2 text-[12px] text-foreground/85">{e.verdict}</p>
      </div>

      {/* Funnel */}
      <div className="mt-4 space-y-1.5">
        {e.funnel.map((s, i) => (
          <div key={s.key}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[12px] font-semibold">{s.label}</span>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {pct(s.pct)}{i > 0 ? ` · ${pct(s.step_pct)} step` : ""}
              </span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-muted/40 overflow-hidden">
              <div
                className={`h-full rounded-full ${i === e.funnel.length - 1 ? "bg-emerald-500" : "bg-primary"}`}
                style={{ width: `${Math.max(2, s.pct * 100)}%` }}
              />
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Rough money math */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Contract range" value={`${formatCurrency(e.contract_low)}–${formatCurrency(e.contract_high)}`} sub="Ballpark scope" />
        <Stat label="If it closes" value={`${formatCurrency(e.commission_low)}–${formatCurrency(e.commission_high)}`} sub="Front-end commission" />
        <Stat label="Per 10 doors like this" value={formatCurrency(e.per_ten_doors)} sub={`${formatCurrency(e.block_of_25)} per 25`} />
        <Stat
          label="Knocks per deal"
          value={e.knocks_to_one_deal !== null ? formatCount(e.knocks_to_one_deal) : "—"}
          sub={`${pct(e.joint_probability)} knock→signed`}
        />
      </div>

      {/* Levers */}
      {e.levers.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">What moves this number</p>
          <div className="space-y-1.5">
            {e.levers.map((l) => (
              <div key={l.label} className="flex items-start gap-2 rounded-lg border border-hairline bg-muted/20 p-2.5">
                <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold">
                    {l.label} <span className="text-emerald-400">+{formatCurrency(l.delta)}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">{l.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 text-[10px] italic text-muted-foreground">
        Rough planning estimates from tier conversion history and front-end commission ranges — not a payout quote.
      </p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-muted/20 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-[15px] font-display font-extrabold leading-tight">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
