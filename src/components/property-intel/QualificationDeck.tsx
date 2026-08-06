import { useMemo, useState } from "react";
import { toast } from "sonner";
import { buildQualification, type LifecycleItem, type Pillar } from "@/lib/propertyIntel/qualification";
import type { PropertyIntelReport } from "@/lib/propertyIntel/types";
import { formatCurrency } from "@/lib/format";
import {
  Target, Wallet, Timer, Users, ShieldAlert, MessageSquareWarning, CreditCard,
  HelpCircle, Flame, Clock, Copy, ChevronDown,
} from "lucide-react";

const TIER_CLASS: Record<string, string> = {
  A: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  B: "bg-primary/15 text-primary border-primary/30",
  C: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  D: "bg-red-500/15 text-red-400 border-red-500/30",
};

const STATUS_CLASS: Record<LifecycleItem["status"], string> = {
  overdue: "bg-red-500",
  window: "bg-amber-500",
  watch: "bg-primary",
  healthy: "bg-emerald-500",
  unknown: "bg-muted-foreground/40",
};

const STATUS_LABEL: Record<LifecycleItem["status"], string> = {
  overdue: "Past rated life",
  window: "Replacement window",
  watch: "Watch",
  healthy: "Healthy",
  unknown: "Unknown",
};

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

function PillarBar({ p }: { p: Pillar }) {
  const tone = p.score >= 75 ? "bg-emerald-500" : p.score >= 55 ? "bg-primary" : p.score >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.label}</span>
        <span className="text-[12px] font-bold tabular-nums">{p.score}</span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${p.score}%` }} />
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">{p.detail}</p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-muted/20 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-lg font-display font-extrabold leading-tight">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function QualificationDeck({ report }: { report: PropertyIntelReport }) {
  const q = useMemo(() => buildQualification(report), [report]);
  const [openObj, setOpenObj] = useState<string | null>(q.objections[0]?.id ?? null);
  const eq = q.equity;

  const copyAmmo = () => {
    navigator.clipboard?.writeText(q.door_ammo).catch(() => {});
    toast.success("Door ammo copied");
  };

  return (
    <div className="space-y-4">
      {/* Qualification score */}
      <Card
        icon={Target}
        title="Qualification scorecard"
        right={
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${TIER_CLASS[q.tier]}`}>
              Tier {q.tier} · {q.score}/100
            </span>
            <button onClick={copyAmmo}
              className="inline-flex items-center gap-1 rounded-md border border-hairline bg-muted/40 px-2 py-1 text-[11px] font-semibold hover:bg-muted/60">
              <Copy className="h-3 w-3" /> Door ammo
            </button>
          </div>
        }
      >
        <p className="text-[12px] text-foreground/85 mb-3">{q.tier_note}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {q.pillars.map((p) => <PillarBar key={p.key} p={p} />)}
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-hairline bg-muted/20 p-2.5">
          <Clock className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
          <span className="text-[12px] text-foreground/85">{q.best_knock_window}</span>
        </div>
      </Card>

      {/* Red flags */}
      {q.red_flags.length > 0 && (
        <Card icon={ShieldAlert} title="Before you knock">
          <ul className="space-y-1.5">
            {q.red_flags.map((f, i) => (
              <li key={i} className="text-[12px] font-semibold text-amber-300">⚠ {f}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Equity / ability to pay */}
      <Card icon={Wallet} title="Equity & ability picture"
        right={<span className="text-[10px] uppercase tracking-wider text-muted-foreground">{eq.value_basis}</span>}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Est. value" value={eq.current_value ? formatCurrency(eq.current_value) : "—"} />
          <Stat label="Purchased" value={eq.purchase_price ? formatCurrency(eq.purchase_price) : "—"}
            sub={eq.purchase_year ? `in ${eq.purchase_year}` : undefined} />
          <Stat label="Est. equity" value={eq.estimated_equity !== null ? formatCurrency(eq.estimated_equity) : "—"}
            sub={eq.equity_pct !== null ? `~${eq.equity_pct}% of value` : undefined} />
          <Stat label="Tenure" value={eq.tenure_years !== null ? `${Math.round(eq.tenure_years)} yr` : "—"}
            sub={eq.appreciation ? `+${formatCurrency(eq.appreciation)} since buy` : undefined} />
        </div>
        <ul className="mt-3 space-y-1">
          {eq.notes.map((n, i) => <li key={i} className="text-[11px] text-muted-foreground">• {n}</li>)}
        </ul>
      </Card>

      {/* Lifecycle */}
      <Card icon={Timer} title="System lifecycle clock">
        <div className="space-y-2.5">
          {q.lifecycle.map((l) => (
            <div key={l.system}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12px] font-semibold">{l.system}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {l.age ?? "?"} / {l.expected_life} yrs · {STATUS_LABEL[l.status]}
                </span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                <div className={`h-full rounded-full ${STATUS_CLASS[l.status]}`} style={{ width: `${Math.max(4, l.pct_used)}%` }} />
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{l.note}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Urgency hooks */}
      {q.urgency_hooks.length > 0 && (
        <Card icon={Flame} title="Urgency hooks">
          <ul className="space-y-1.5">
            {q.urgency_hooks.map((h, i) => (
              <li key={i} className="text-[12px] text-foreground/85">🔥 {h}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Decision makers */}
      <Card icon={Users} title="Decision-maker map">
        <div className="space-y-2">
          {q.decision_makers.map((d, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-hairline bg-muted/20 p-2.5">
              <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                d.required ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground"}`}>
                {d.required ? "Required" : "Context"}
              </span>
              <div>
                <p className="text-[12px] font-semibold">{d.label}</p>
                <p className="text-[11px] text-muted-foreground">{d.note}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Predicted objections */}
      <Card icon={MessageSquareWarning} title="Objections to expect">
        <div className="space-y-2">
          {q.objections.map((o) => {
            const open = openObj === o.id;
            return (
              <div key={o.id} className="rounded-lg border border-hairline bg-muted/20 overflow-hidden">
                <button onClick={() => setOpenObj(open ? null : o.id)}
                  className="w-full flex items-center justify-between gap-2 p-2.5 text-left hover:bg-muted/30">
                  <div>
                    <p className="text-[12px] font-semibold">"{o.objection}"</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {o.likelihood} likelihood · {o.trigger}
                    </p>
                  </div>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="border-t border-hairline px-2.5 py-2 bg-primary/5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Turn</p>
                    <p className="text-[12px] text-foreground/90">{o.rebuttal}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Discovery */}
      <Card icon={HelpCircle} title="Discovery questions">
        <ol className="space-y-1.5 list-decimal list-inside">
          {q.discovery.map((d, i) => (
            <li key={i} className="text-[12px] text-foreground/85">{d}</li>
          ))}
        </ol>
        <p className="mt-3 text-[10px] italic text-muted-foreground">
          Qualification scoring uses public-record estimates. It is not a credit decision and is not proof of
          purchasing ability or financing eligibility.
        </p>
      </Card>
    </div>
  );
}
