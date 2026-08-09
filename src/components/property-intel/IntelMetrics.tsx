import { useMemo } from "react";
import { buildIntelMetrics, type FieldStatus } from "@/lib/propertyIntel/metrics";
import type { PropertyIntelReport } from "@/lib/propertyIntel/types";
import { formatCurrency, formatCount } from "@/lib/format";
import {
  Scale, Gauge, Database, CalendarClock, Route, CheckCircle2,
  AlertTriangle, HelpCircle, CircleDot, CreditCard,
} from "lucide-react";

function Card({
  icon: Icon, title, right, children,
}: { icon: React.ElementType; title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-display font-bold uppercase tracking-[0.14em]">{title}</h3>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-muted/20 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-lg font-display font-extrabold leading-tight ${tone ?? ""}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Meter({ value, tone }: { value: number; tone: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  );
}

const STATUS_META: Record<FieldStatus, { icon: React.ElementType; cls: string; label: string }> = {
  corroborated: { icon: CheckCircle2, cls: "text-emerald-400", label: "2+ sources" },
  single: { icon: CircleDot, cls: "text-primary", label: "Single source" },
  conflict: { icon: AlertTriangle, cls: "text-red-400", label: "Conflict" },
  missing: { icon: HelpCircle, cls: "text-amber-400", label: "Missing" },
};

const CREDIT_TONE: Record<string, string> = {
  excellent: "text-emerald-400",
  good: "text-primary",
  fair: "text-amber-400",
  challenged: "text-red-400",
  unknown: "text-muted-foreground",
};

const AGREEMENT_TONE: Record<string, string> = {
  tight: "text-emerald-400",
  moderate: "text-amber-400",
  wide: "text-red-400",
  single: "text-amber-400",
  none: "text-muted-foreground",
};

export default function IntelMetricsPanel({ report }: { report: PropertyIntelReport }) {
  const m = useMemo(() => buildIntelMetrics(report), [report]);
  const { valuation: v, affordability: a, credit: c, data: d, timing: t } = m;

  const routeTone = m.route_priority >= 78 ? "bg-emerald-500"
    : m.route_priority >= 60 ? "bg-primary"
      : m.route_priority >= 42 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-4">
      {/* Route priority */}
      <Card
        icon={Route}
        title="Route priority"
        right={<span className="text-[11px] font-bold tabular-nums">{m.route_priority} / 100</span>}
      >
        <Meter value={m.route_priority} tone={routeTone} />
        <p className="mt-2 text-[12px] text-foreground/85">{m.route_note}</p>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Urgency" value={`${t.urgency_index}`} sub="Lifecycle + exposure" />
          <Stat label="Affordability" value={`${a.index}`} sub={a.band} />
          <Stat label="Corroboration" value={`${d.corroboration_pct}%`} sub={`${d.completeness_pct}% complete`} />
          <Stat label="Conflicts" value={formatCount(d.conflicts)} sub={d.conflicts ? "Resolve at the door" : "None found"} 
            tone={d.conflicts ? "text-red-400" : undefined} />
        </div>
      </Card>

      {/* Valuation triangulation */}
      <Card
        icon={Scale}
        title="Value triangulation"
        right={<span className={`text-[10px] uppercase tracking-wider font-bold ${AGREEMENT_TONE[v.agreement]}`}>
          {v.agreement} agreement{v.spread_pct !== null ? ` · ${v.spread_pct}% spread` : ""}
        </span>}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Consensus value" value={v.consensus !== null ? formatCurrency(v.consensus) : "—"}
            sub={v.low !== null && v.high !== null ? `${formatCurrency(v.low)} – ${formatCurrency(v.high)}` : "No sources"} />
          <Stat label="Price / sq ft" value={v.price_per_sqft !== null ? formatCurrency(v.price_per_sqft) : "—"} sub="Consensus ÷ living area" />
          <Stat label="Appreciation" value={v.cagr_pct !== null ? `${v.cagr_pct}% / yr` : "—"} sub="Since purchase" />
          <Stat label="Tax burden" value={v.tax_burden_pct !== null ? `${v.tax_burden_pct}%` : "—"} sub="Annual tax ÷ value" />
        </div>

        {v.estimates.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-lg border border-hairline">
            <table className="w-full text-[12px]">
              <thead className="bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="px-3 py-1.5 text-left text-[10px] uppercase tracking-wider font-bold">Independent estimate</th>
                  <th className="px-3 py-1.5 text-right text-[10px] uppercase tracking-wider font-bold">Value</th>
                </tr>
              </thead>
              <tbody>
                {v.estimates.map((est) => (
                  <tr key={est.label} className="border-t border-hairline/60">
                    <td className="px-3 py-1.5">
                      <span className="font-semibold">{est.label}</span>
                      <span className="block text-[10px] text-muted-foreground">{est.note}</span>
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-bold">{formatCurrency(est.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-[11px] text-foreground/80">{v.agreement_note}</p>
      </Card>

      {/* Affordability */}
      <Card icon={Gauge} title="Payment comfort index" right={
        <span className="text-[11px] font-bold tabular-nums">{a.index} / 100</span>
      }>
        <Meter value={a.index} tone={a.band === "comfortable" ? "bg-emerald-500" : a.band === "workable" ? "bg-primary" : a.band === "stretch" ? "bg-amber-500" : "bg-muted-foreground/40"} />
        <p className="mt-2 text-[12px] font-semibold">{a.headline}</p>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Est. project payment" value={formatCurrency(a.project_payment_mid)} sub="Mid range · 120 mo" />
          <Stat label="Implied income" value={a.implied_household_income !== null ? formatCurrency(a.implied_household_income) : "—"} sub="Inferred — never state it" />
          <Stat label="Payment / income" value={a.payment_to_income_pct !== null ? `${a.payment_to_income_pct}%` : "—"} sub="Monthly share" />
          <Stat label="Project / value" value={a.payment_to_value_pct !== null ? `${a.payment_to_value_pct}%` : "—"} sub="Scope vs home value" />
        </div>
        <ul className="mt-3 space-y-1">
          {a.notes.map((n, i) => <li key={i} className="text-[11px] text-muted-foreground">• {n}</li>)}
        </ul>
      </Card>

      {/* Credit & cash-flow read */}
      <Card icon={CreditCard} title="Credit & cash-flow read" right={
        <span className={`text-[10px] uppercase tracking-wider font-bold ${CREDIT_TONE[c.tier]}`}>
          {c.tier} · {c.confidence} confidence
        </span>
      }>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Est. credit band"
            value={c.score_low !== null && c.score_high !== null ? `${c.score_low}–${c.score_high}` : "—"}
            sub={c.score_mid !== null ? `Midpoint ~${c.score_mid} FICO-style` : "No basis on record"}
            tone={CREDIT_TONE[c.tier]} />
          <Stat label="Disposable / mo"
            value={c.disposable_low !== null && c.disposable_high !== null
              ? `${formatCurrency(c.disposable_low)}–${formatCurrency(c.disposable_high)}` : "—"}
            sub={c.disposable_mid !== null ? `Mid ~${formatCurrency(c.disposable_mid)}` : "No income basis"} />
          <Stat label="Payment / disposable"
            value={c.payment_to_disposable_pct !== null ? `${c.payment_to_disposable_pct}%` : "—"}
            sub="Project payment vs free cash" />
          <Stat label="Approval read" value={c.tier === "unknown" ? "Unknown" : c.tier} sub={c.tier_note} />
        </div>

        <p className="mt-3 text-[12px] font-semibold">{c.headroom_note}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{c.approval_note}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{c.disposable_note}</p>

        {c.signals.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-lg border border-hairline">
            <table className="w-full text-[12px]">
              <thead className="bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="px-3 py-1.5 text-left text-[10px] uppercase tracking-wider font-bold">Credit signal</th>
                  <th className="px-3 py-1.5 text-right text-[10px] uppercase tracking-wider font-bold">Effect</th>
                </tr>
              </thead>
              <tbody>
                {c.signals.map((s, i) => (
                  <tr key={i} className="border-t border-hairline/60">
                    <td className="px-3 py-1.5">
                      <span className="font-semibold">{s.label}</span>
                      <span className="block text-[10px] text-muted-foreground">{s.detail}</span>
                    </td>
                    <td className={`px-3 py-1.5 text-right tabular-nums font-bold ${s.points >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {s.points >= 0 ? "+" : ""}{s.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ul className="mt-3 space-y-1">
          {c.caveats.map((x, i) => <li key={i} className="text-[10px] text-muted-foreground">• {x}</li>)}
        </ul>
      </Card>

      {/* Timing */}
      <Card icon={CalendarClock} title="Timing & urgency" right={
        <span className="text-[11px] font-bold tabular-nums">{t.urgency_index} / 100</span>
      }>
        <Meter value={t.urgency_index} tone={t.urgency_index >= 70 ? "bg-red-500" : t.urgency_index >= 45 ? "bg-amber-500" : "bg-primary"} />
        <p className="mt-2 text-[12px] font-semibold">{t.season_note}</p>
        <ul className="mt-3 space-y-1.5">
          {t.signals.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${s.weight === "high" ? "bg-red-500" : s.weight === "medium" ? "bg-amber-500" : "bg-primary"}`} />
              <span className="text-[12px] text-foreground/85"><span className="font-semibold">{s.label}:</span> {s.detail}</span>
            </li>
          ))}
          {t.signals.length === 0 && <li className="text-[12px] text-muted-foreground">No timing signals on record.</li>}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat label="Permit gap" value={t.permit_gap_years !== null ? `${t.permit_gap_years} yrs` : "None on file"} sub="Since last permitted work" />
          <Stat label="Revisit by" value={t.next_review_year ?? "—"} sub="Lifecycle re-check year" />
        </div>
      </Card>

      {/* Data triangulation */}
      <Card icon={Database} title="Source triangulation" right={
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {d.completeness_pct}% complete · {d.corroboration_pct}% corroborated
        </span>
      }>
        <div className="overflow-hidden rounded-lg border border-hairline">
          <table className="w-full text-[12px]">
            <tbody>
              {d.fields.map((f) => {
                const meta = STATUS_META[f.status];
                const Icon = meta.icon;
                return (
                  <tr key={f.field} className="border-t border-hairline/60 first:border-t-0">
                    <td className="px-3 py-1.5 w-[34%]">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.field}</span>
                    </td>
                    <td className="px-3 py-1.5 font-semibold">{f.value}</td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${meta.cls}`}>
                        <Icon className="h-3 w-3" /> {meta.label}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">{f.sources.join(" + ")}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {d.verify_at_door.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Verify at the door</p>
            <ul className="space-y-1">
              {d.verify_at_door.map((x, i) => <li key={i} className="text-[12px] text-foreground/85">→ {x}</li>)}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
