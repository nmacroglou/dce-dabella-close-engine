import { useMemo, useState } from "react";
import { TrendingUp, Wallet, CalendarClock } from "lucide-react";
import { fmt } from "@/lib/format";
import type { CommissionPayment } from "@/hooks/useCommissionLedger";

/**
 * 30/60/90-day cashflow forecast.
 * Projects outstanding front/back amounts onto upcoming paydays:
 *  - Front unpaid → first payday ≥ sale_date + 14d (typical front-half release)
 *  - Back unpaid  → first payday ≥ sale_date + 60d (typical back-half release)
 * Falls back to "today" anchor when sale_date is missing.
 */
const ANCHOR_ISO = "2026-05-15"; // shared anchor with PaymentCalendar
const PERIOD_DAYS = 14;
const FRONT_LAG_DAYS = 14;
const BACK_LAG_DAYS = 60;

const RANGES = [30, 60, 90] as const;
type Range = (typeof RANGES)[number];

function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function fmtDay(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
/** Next payday on/after a given date, anchored to the bi-weekly schedule. */
function nextPaydayOnOrAfter(d: Date, anchor: Date): Date {
  const diff = Math.ceil((d.getTime() - anchor.getTime()) / 86400000);
  const periods = Math.ceil(diff / PERIOD_DAYS);
  return addDays(anchor, periods * PERIOD_DAYS);
}

export default function CashflowForecast({ rows }: { rows: CommissionPayment[] }) {
  const [range, setRange] = useState<Range>(30);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const anchor = parseISO(ANCHOR_ISO);

  const horizon = addDays(today, range);

  const { paydays, total, sourceCount } = useMemo(() => {
    // Build list of upcoming paydays within horizon
    const first = nextPaydayOnOrAfter(today, anchor);
    const list: { date: Date; key: string; amount: number; entries: { customer: string; amount: number; kind: "front" | "back" }[] }[] = [];
    for (let p = first; p.getTime() <= horizon.getTime(); p = addDays(p, PERIOD_DAYS)) {
      list.push({ date: new Date(p), key: toISODate(p), amount: 0, entries: [] });
    }
    if (!list.length) return { paydays: list, total: 0, sourceCount: 0 };

    const byKey = new Map(list.map((p) => [p.key, p]));
    let total = 0;
    let sourceCount = 0;

    for (const r of rows) {
      const eF = +r.expected_front || 0;
      const eB = +r.expected_back || 0;
      const fP = +r.front_paid_amount || 0;
      const bP = +r.back_paid_amount || 0;
      const frontDue = Math.max(0, eF - fP);
      const backDue = Math.max(0, eB - bP);
      if (frontDue <= 0 && backDue <= 0) continue;

      const saleBase = r.sale_date ? parseISO(r.sale_date) : today;

      if (frontDue > 0) {
        const target = nextPaydayOnOrAfter(addDays(saleBase, FRONT_LAG_DAYS), anchor);
        const t = target.getTime() < today.getTime() ? first : target;
        const slot = byKey.get(toISODate(t));
        if (slot) {
          slot.amount += frontDue;
          slot.entries.push({ customer: r.customer_name ?? "—", amount: frontDue, kind: "front" });
          total += frontDue;
          sourceCount++;
        }
      }
      if (backDue > 0) {
        const target = nextPaydayOnOrAfter(addDays(saleBase, BACK_LAG_DAYS), anchor);
        const t = target.getTime() < today.getTime() ? first : target;
        const slot = byKey.get(toISODate(t));
        if (slot) {
          slot.amount += backDue;
          slot.entries.push({ customer: r.customer_name ?? "—", amount: backDue, kind: "back" });
          total += backDue;
          sourceCount++;
        }
      }
    }
    return { paydays: list, total, sourceCount };
  }, [rows, range]);

  const max = Math.max(1, ...paydays.map((p) => p.amount));
  const avgPerCheck = paydays.length ? total / paydays.length : 0;

  return (
    <div className="rounded-2xl border border-hairline bg-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-hairline gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-success/10 text-success flex items-center justify-center">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Cashflow forecast</h2>
            <p className="text-[11px] text-muted-foreground">
              Projected paychecks · next {range} days · {paydays.length} payday{paydays.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px bg-hairline">
        <Stat icon={Wallet} label="Projected total" value={fmt(total)} tone="success" />
        <Stat icon={CalendarClock} label="Avg / paycheck" value={fmt(avgPerCheck)} tone="primary" />
        <Stat icon={TrendingUp} label="Outstanding sources" value={String(sourceCount)} tone="muted" />
      </div>

      {paydays.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">No paydays in this window.</div>
      ) : (
        <div className="p-4 space-y-2">
          {paydays.map((p) => {
            const isToday = toISODate(p.date) === toISODate(today);
            const pct = (p.amount / max) * 100;
            return (
              <div key={p.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums">{fmtDay(p.date)}</span>
                    {isToday && (
                      <span className="text-[10px] uppercase tracking-wide text-primary font-bold">Today</span>
                    )}
                    <span className="text-muted-foreground">
                      {p.entries.length} source{p.entries.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <span className="font-bold tabular-nums">
                    {p.amount > 0 ? fmt(p.amount) : <span className="text-muted-foreground/60">—</span>}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full ${p.amount > 0 ? "bg-success" : "bg-muted"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="px-4 py-2 border-t border-hairline text-[11px] text-muted-foreground">
        Forecast assumes front-half lands ~2 weeks post-sale, back-half ~60 days. Adjust ledger entries to refine.
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "success" | "primary" | "muted";
}) {
  const toneCls =
    tone === "success"
      ? "text-success bg-success/10"
      : tone === "primary"
      ? "text-primary bg-primary/10"
      : "text-muted-foreground bg-muted";
  return (
    <div className="bg-card p-3 flex items-center gap-3">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${toneCls}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
        <div className="text-sm font-bold tabular-nums">{value}</div>
      </div>
    </div>
  );
}
