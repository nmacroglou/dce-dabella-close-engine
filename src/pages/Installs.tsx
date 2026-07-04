import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, CalendarDays, MapPin, StickyNote, Users, AlertTriangle, CalendarClock } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import InstallAlerts from "@/components/installs/InstallAlerts";
import { useDeals } from "@/hooks/useDeals";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import type { Deal } from "@/types/deal";


const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function dealName(d: Deal) {
  return `${d.homeowner1 || "Untitled"}${d.homeowner2 ? ` & ${d.homeowner2}` : ""}`;
}

export default function Installs() {
  const { data: deals = [], isLoading } = useDeals();
  const { setActiveDealId } = useActiveDeal();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const installs = useMemo(
    () => deals.filter((d) => !!d.install_date && d.stage !== "lost" && d.stage !== "disqualified"),
    [deals]
  );

  // Map date -> deals
  const byDate = useMemo(() => {
    const m = new Map<string, Deal[]>();
    for (const d of installs) {
      const key = d.install_date as string;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(d);
    }
    return m;
  }, [installs]);

  // Build calendar grid
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
    if (i >= 34 && d >= monthEnd && d.getDay() === 6) break;
  }

  // Upcoming list (next 30 days)
  const upcoming = useMemo(() => {
    const in30 = new Date(today);
    in30.setDate(in30.getDate() + 30);
    return installs
      .filter((d) => {
        const dt = parseYmd(d.install_date!);
        return dt >= today && dt <= in30;
      })
      .sort((a, b) => (a.install_date! < b.install_date! ? -1 : 1));
  }, [installs, today]);

  // Deals ready to schedule (Won + no install_date)
  const needsScheduling = useMemo(
    () => deals.filter((d) => d.stage === "won" && !d.install_date),
    [deals]
  );

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-[92rem] mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              Install Calendar
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Stay ahead of every install. Coordinate crews, prep, and homeowner expectations in one view.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-hairline bg-card px-3 py-2 shadow-[var(--shadow-sm)]">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[140px] text-center">
              <p className="text-sm font-bold text-foreground">{monthLabel}</p>
            </div>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="h-5 w-px bg-hairline mx-1" />
            <button
              onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Today
            </button>
          </div>
        </div>

        <InstallAlerts />

        {/* KPI strip */}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Kpi label="Scheduled this month" value={installs.filter((d) => {
            const dt = parseYmd(d.install_date!);
            return dt.getMonth() === cursor.getMonth() && dt.getFullYear() === cursor.getFullYear();
          }).length} accent="text-primary" />
          <Kpi label="Next 7 days" value={upcoming.filter((d) => {
            const dt = parseYmd(d.install_date!);
            const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
            return dt <= in7;
          }).length} accent="text-accent" />
          <Kpi label="Awaiting a date" value={needsScheduling.length} accent="text-warning" />
          <Kpi label="Total on the board" value={installs.length} accent="text-foreground" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Calendar */}
          <section className="rounded-2xl border border-hairline bg-card overflow-hidden shadow-[var(--shadow-md)]">
            <div className="grid grid-cols-7 border-b border-hairline bg-muted/40">
              {WEEKDAYS.map((w) => (
                <div key={w} className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground text-center">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-[minmax(112px,auto)]">
              {cells.map((d, i) => {
                const key = ymd(d);
                const items = byDate.get(key) ?? [];
                const inMonth = d.getMonth() === cursor.getMonth();
                const isToday = ymd(d) === ymd(today);
                return (
                  <div
                    key={i}
                    className={`relative border-b border-r border-hairline/70 p-2 flex flex-col gap-1 ${
                      inMonth ? "bg-card" : "bg-muted/20"
                    } ${isToday ? "ring-2 ring-inset ring-primary/40" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-bold ${
                          isToday
                            ? "text-primary"
                            : inMonth
                              ? "text-foreground"
                              : "text-muted-foreground/50"
                        }`}
                      >
                        {d.getDate()}
                      </span>
                      {items.length > 1 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-warning/15 text-warning">
                          {items.length}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {items.slice(0, 3).map((deal) => (
                        <Link
                          key={deal.id}
                          to="/"
                          onClick={() => setActiveDealId(deal.id)}
                          className="group block rounded-md px-1.5 py-1 bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
                          title={`${dealName(deal)} — ${deal.address ?? ""}`}
                        >
                          <p className="text-[10px] font-bold text-primary truncate leading-tight">
                            {dealName(deal)}
                          </p>
                          {deal.address && (
                            <p className="text-[9px] text-muted-foreground truncate leading-tight">
                              {deal.address}
                            </p>
                          )}
                        </Link>
                      ))}
                      {items.length > 3 && (
                        <span className="text-[9px] font-semibold text-muted-foreground px-1">
                          +{items.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Side rail */}
          <aside className="space-y-5">
            <div className="rounded-2xl border border-hairline bg-card p-4 shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-2 mb-3">
                <CalendarClock className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-bold text-foreground">Next 30 days</h2>
              </div>
              {isLoading ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : upcoming.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nothing scheduled in the next 30 days.</p>
              ) : (
                <ul className="space-y-2.5">
                  {upcoming.map((d) => {
                    const dt = parseYmd(d.install_date!);
                    const days = Math.round((dt.getTime() - today.getTime()) / 86400000);
                    return (
                      <li key={d.id}>
                        <Link
                          to="/"
                          onClick={() => setActiveDealId(d.id)}
                          className="block rounded-lg border border-hairline/70 p-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold text-foreground truncate">{dealName(d)}</p>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                              {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d`}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                          </p>
                          {d.address && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 truncate">
                              <MapPin className="h-3 w-3 shrink-0" /> {d.address}
                            </p>
                          )}
                          {d.install_notes && (
                            <p className="text-[11px] text-muted-foreground flex items-start gap-1 mt-1">
                              <StickyNote className="h-3 w-3 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{d.install_notes}</span>
                            </p>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h2 className="text-sm font-bold text-foreground">Needs an install date</h2>
              </div>
              {needsScheduling.length === 0 ? (
                <p className="text-xs text-muted-foreground">Every won deal has a date. Nice work.</p>
              ) : (
                <ul className="space-y-2">
                  {needsScheduling.slice(0, 6).map((d) => (
                    <li key={d.id}>
                      <Link
                        to="/deals"
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-warning/10 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{dealName(d)}</p>
                          {d.address && (
                            <p className="text-[10px] text-muted-foreground truncate">{d.address}</p>
                          )}
                        </div>
                        <Users className="h-3.5 w-3.5 text-warning shrink-0" />
                      </Link>
                    </li>
                  ))}
                  {needsScheduling.length > 6 && (
                    <li className="text-[10px] text-muted-foreground px-2">
                      +{needsScheduling.length - 6} more in Deals
                    </li>
                  )}
                </ul>
              )}
              <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                Open a deal in <Link to="/deals" className="text-primary font-semibold hover:underline">Deals</Link> and hit edit to set an install date.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-card p-4 shadow-[var(--shadow-sm)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={`text-2xl font-extrabold tracking-tight mt-1 num-display ${accent}`}>{value}</p>
    </div>
  );
}
