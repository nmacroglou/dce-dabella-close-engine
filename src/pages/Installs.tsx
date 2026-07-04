import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, CalendarDays, MapPin, StickyNote, Users, AlertTriangle, CalendarClock, GripVertical } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import InstallAlerts from "@/components/installs/InstallAlerts";
import { useDeals, useUpdateDeal } from "@/hooks/useDeals";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import type { Deal } from "@/types/deal";
import { toast } from "sonner";
import InstallEditDialog from "@/components/installs/InstallEditDialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";




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

type PendingReschedule = { dealId: string; fromDate: string | null; toDate: string; dealName: string };

export default function Installs() {
  const { data: deals = [], isLoading } = useDeals();
  const updateDeal = useUpdateDeal();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingReschedule | null>(null);
  const [allowWeekends, setAllowWeekends] = useState(false);
  const [invalidReason, setInvalidReason] = useState<string | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);


  const validateDropDate = (d: Date, tRef: Date): string | null => {
    const day = d.getDay();
    if (d < tRef) return "Can't schedule in the past";
    if (!allowWeekends && (day === 0 || day === 6)) return "Weekends are disabled";
    return null;
  };




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
            <div className="h-5 w-px bg-hairline mx-1" />
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground cursor-pointer select-none" title="Allow drops on Saturdays and Sundays">
              <input
                type="checkbox"
                checked={allowWeekends}
                onChange={(e) => setAllowWeekends(e.target.checked)}
                className="h-3 w-3 accent-primary"
              />
              Weekends
            </label>
          </div>
        </div>

        {draggingId && invalidReason && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 flex items-center gap-2 text-xs font-semibold text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
            {invalidReason} — pick another day.
          </div>
        )}


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
                const isDropTarget = dragOverKey === key;
                const invalid = validateDropDate(d, today);
                const isInvalidTarget = isDropTarget && !!invalid;
                return (
                  <div
                    key={i}
                    onDragOver={(e) => {
                      if (!draggingId) return;
                      if (invalid) {
                        e.dataTransfer.dropEffect = "none";
                        if (dragOverKey !== key) {
                          setDragOverKey(key);
                          setInvalidReason(invalid);
                        }
                        return;
                      }
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (dragOverKey !== key) {
                        setDragOverKey(key);
                        setInvalidReason(null);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverKey === key) {
                        setDragOverKey(null);
                        setInvalidReason(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const id = e.dataTransfer.getData("text/deal-id") || draggingId;
                      setDragOverKey(null);
                      setInvalidReason(null);
                      setDraggingId(null);
                      if (!id) return;
                      if (invalid) {
                        toast.error(`Can't drop here — ${invalid.toLowerCase()}`);
                        return;
                      }
                      const dropped = deals.find((x) => x.id === id);
                      if (!dropped || dropped.install_date === key) return;
                      setPending({
                        dealId: id,
                        fromDate: dropped.install_date,
                        toDate: key,
                        dealName: dealName(dropped),
                      });
                    }}
                    className={`relative border-b border-r border-hairline/70 p-2 flex flex-col gap-1 transition-colors ${
                      inMonth ? "bg-card" : "bg-muted/20"
                    } ${isToday ? "ring-2 ring-inset ring-primary/40" : ""} ${
                      isDropTarget && !invalid ? "bg-primary/15 ring-2 ring-inset ring-primary" : ""
                    } ${isInvalidTarget ? "bg-destructive/10 ring-2 ring-inset ring-destructive/60 cursor-not-allowed" : ""} ${
                      draggingId && invalid && !isDropTarget ? "opacity-70" : ""
                    }`}
                  >
                    {isInvalidTarget && (
                      <div className="absolute inset-x-1 bottom-1 z-10 rounded-md bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-1 shadow-md flex items-center gap-1 pointer-events-none">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        <span className="truncate">{invalid}</span>
                      </div>
                    )}

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
                        <div
                          key={deal.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggingId(deal.id);
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/deal-id", deal.id);
                          }}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setDragOverKey(null);
                          }}
                          className={`group flex items-start gap-1 rounded-md px-1.5 py-1 bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors cursor-grab active:cursor-grabbing ${
                            draggingId === deal.id ? "opacity-40" : ""
                          }`}
                          title={`Click to edit · drag to reschedule · ${dealName(deal)}${deal.address ? " — " + deal.address : ""}`}
                          onClick={() => setEditingDeal(deal)}
                        >
                          <GripVertical className="h-3 w-3 text-primary/60 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-primary truncate leading-tight">
                              {dealName(deal)}
                            </p>
                            {deal.address && (
                              <p className="text-[9px] text-muted-foreground truncate leading-tight">
                                {deal.address}
                              </p>
                            )}
                          </div>
                        </div>

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

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reschedule this install?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  You're moving <span className="font-bold text-foreground">{pending?.dealName}</span>.
                </p>
                <div className="rounded-lg border border-hairline bg-muted/30 p-3 space-y-1">
                  <p className="text-xs">
                    <span className="text-muted-foreground">From:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {pending?.fromDate
                        ? parseYmd(pending.fromDate).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })
                        : "Unscheduled"}
                    </span>
                  </p>
                  <p className="text-xs">
                    <span className="text-muted-foreground">To:</span>{" "}
                    <span className="font-semibold text-primary">
                      {pending && parseYmd(pending.toDate).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  You'll be able to undo this from the toast for a few seconds.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep original date</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pending) return;
                const p = pending;
                setPending(null);
                try {
                  await updateDeal.mutateAsync({ id: p.dealId, updates: { install_date: p.toDate } });
                  toast.success(
                    `Moved ${p.dealName} to ${parseYmd(p.toDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`,
                    {
                      duration: 8000,
                      action: {
                        label: "Undo",
                        onClick: async () => {
                          try {
                            await updateDeal.mutateAsync({
                              id: p.dealId,
                              updates: { install_date: p.fromDate },
                            });
                            toast.success(
                              p.fromDate
                                ? `Restored to ${parseYmd(p.fromDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`
                                : "Install date cleared"
                            );
                          } catch {
                            // hook toasts on error
                          }
                        },
                      },
                    }
                  );
                } catch {
                  // hook toasts on error
                }
              }}
            >
              Confirm reschedule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
