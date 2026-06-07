import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmt } from "@/lib/format";
import type { CommissionPayment } from "@/hooks/useCommissionLedger";

/**
 * Bi-weekly payday tracker.
 * Anchor: Friday 5/15/2026 — last confirmed payday at $1,375.13.
 * Each payday covers the 14-day window ending on the payday itself.
 * Auto-rolls up front_paid_amount / back_paid_amount from the ledger by paid date,
 * with optional manual overrides persisted to localStorage.
 */
const ANCHOR_ISO = "2026-05-15";
const PERIOD_DAYS = 14;
const STORE_KEY = "dabella.paychecks.overrides.v1";
const SEED_CLEANUP_KEY = "dabella.paychecks.seed-cleanup.v1";

type Overrides = Record<string, number>;

function loadOverrides(): Overrides {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function saveOverrides(o: Overrides) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(o)); } catch { /* ignore */ }
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function fmtDay(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function fmtLong(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function PaymentCalendar({ rows }: { rows: CommissionPayment[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const anchor = parseISO(ANCHOR_ISO);

  // Find the payday closest to "today" as a starting anchor for navigation.
  const periodsFromAnchor = Math.round((today.getTime() - anchor.getTime()) / (PERIOD_DAYS * 86400000));
  const [offset, setOffset] = useState(0); // window offset in pay periods
  const [overrides, setOverrides] = useState<Overrides>(loadOverrides);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>("");

  // Build a window of 6 paydays centered around current view.
  const WINDOW = 6;
  const paydays = useMemo(() => {
    const start = periodsFromAnchor + offset - 2;
    return Array.from({ length: WINDOW }, (_, i) => {
      const pIdx = start + i;
      const payday = addDays(anchor, pIdx * PERIOD_DAYS);
      const windowStart = addDays(payday, -(PERIOD_DAYS - 1));
      return { pIdx, payday, windowStart };
    });
  }, [offset, periodsFromAnchor]);

  // Aggregate paid amounts from ledger rows by the payday window they fall into.
  const totalsByPayday = useMemo(() => {
    const map = new Map<string, { fromLedger: number; entries: { name: string; amount: number; kind: "front" | "back"; date: string }[] }>();
    const ensure = (k: string) => {
      let v = map.get(k);
      if (!v) { v = { fromLedger: 0, entries: [] }; map.set(k, v); }
      return v;
    };
    for (const r of rows) {
      const fp = +r.front_paid_amount || 0;
      const bp = +r.back_paid_amount || 0;
      if (fp > 0 && r.front_paid_at) {
        const k = paydayKeyFor(r.front_paid_at, anchor);
        const v = ensure(k);
        v.fromLedger += fp;
        v.entries.push({ name: r.customer_name ?? "—", amount: fp, kind: "front", date: r.front_paid_at });
      }
      if (bp > 0 && r.back_paid_at) {
        const k = paydayKeyFor(r.back_paid_at, anchor);
        const v = ensure(k);
        v.fromLedger += bp;
        v.entries.push({ name: r.customer_name ?? "—", amount: bp, kind: "back", date: r.back_paid_at });
      }
    }
    return map;
  }, [rows]);

  // No seeded amounts — every payday number comes from the ledger or from
  // an explicit user-entered override.

  function commitDraft(key: string) {
    const n = parseFloat(draft.replace(/[^0-9.\-]/g, ""));
    const next = { ...overrides };
    if (!Number.isFinite(n) || n === 0) delete next[key];
    else next[key] = n;
    setOverrides(next);
    saveOverrides(next);
    setEditing(null);
    setDraft("");
  }

  const ytdActual = Object.entries(overrides)
    .filter(([k]) => k.startsWith(String(today.getFullYear())))
    .reduce((s, [, v]) => s + v, 0);

  // Next upcoming payday from today
  const next = paydays.find((p) => p.payday.getTime() >= today.getTime()) ?? paydays[paydays.length - 1];
  const daysToNext = Math.max(0, Math.ceil((next.payday.getTime() - today.getTime()) / 86400000));

  return (
    <div className="rounded-2xl border border-hairline bg-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-hairline gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <CalendarDays className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Payday calendar</h2>
            <p className="text-[11px] text-muted-foreground">
              Bi-weekly · next payday <span className="font-medium text-foreground">{fmtLong(next.payday)}</span> · in {daysToNext}d
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">YTD received</div>
            <div className="text-sm font-bold tabular-nums">{fmt(ytdActual)}</div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setOffset((o) => o - WINDOW)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setOffset(0)}>Today</Button>
            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setOffset((o) => o + WINDOW)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 p-3">
        {paydays.map(({ pIdx, payday, windowStart }) => {
          const key = toISODate(payday);
          const ledger = totalsByPayday.get(key);
          const override = overrides[key];
          const amount = override ?? ledger?.fromLedger ?? 0;
          const isPast = payday.getTime() < today.getTime();
          const isToday = key === toISODate(today);
          const isNext = key === toISODate(next.payday) && !isPast;
          const isEditing = editing === key;

          return (
            <div
              key={pIdx}
              className={`relative rounded-xl border p-3 transition ${
                isNext
                  ? "border-primary/60 bg-primary/5 shadow-sm"
                  : isPast
                  ? "border-hairline bg-background/60"
                  : "border-hairline bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className={`text-[10px] uppercase tracking-wide font-semibold ${isNext ? "text-primary" : "text-muted-foreground"}`}>
                    {isToday ? "Today" : isNext ? "Next payday" : isPast ? "Paid" : "Upcoming"}
                  </div>
                  <div className="text-sm font-bold">{fmtDay(payday)}</div>
                  <div className="text-[10px] text-muted-foreground">
                    period {fmtDay(windowStart)} – {fmtDay(payday)}
                  </div>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => { setEditing(key); setDraft(amount ? String(amount) : ""); }}
                    className="text-muted-foreground hover:text-foreground p-1 -m-1"
                    title="Log actual paycheck"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="mt-2">
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <Input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitDraft(key);
                        if (e.key === "Escape") { setEditing(null); setDraft(""); }
                      }}
                      placeholder="0.00"
                      className="h-8 text-sm tabular-nums"
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => commitDraft(key)}>
                      <Check className="h-3.5 w-3.5 text-success" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(null); setDraft(""); }}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className={`text-lg font-extrabold tabular-nums ${amount > 0 ? "text-foreground" : "text-muted-foreground/60"}`}>
                      {amount > 0 ? fmt(amount) : "—"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {override != null
                        ? "actual paycheck"
                        : ledger?.fromLedger
                        ? `${ledger.entries.length} ledger entr${ledger.entries.length === 1 ? "y" : "ies"}`
                        : isPast
                        ? "no payment logged"
                        : "projected"}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2 border-t border-hairline text-[11px] text-muted-foreground">
        Tip: click the pencil on any payday to log the actual amount that hit your account.
      </div>
    </div>
  );
}

/** Returns the ISO date of the payday whose 14-day window contains the given paid date. */
function paydayKeyFor(paidISO: string, anchor: Date): string {
  const paid = parseISO(paidISO);
  const diffDays = Math.floor((paid.getTime() - anchor.getTime()) / 86400000);
  // Each period ends ON the payday. period index = ceil(diff / 14).
  const pIdx = Math.ceil(diffDays / PERIOD_DAYS);
  return toISODate(addDays(anchor, pIdx * PERIOD_DAYS));
}
