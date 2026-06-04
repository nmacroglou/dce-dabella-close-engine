import { useMemo, useState, useEffect } from "react";
import { Trophy, Copy, Check, Calendar, TrendingUp, Info } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { useDeals } from "@/hooks/useDeals";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatCount, pctNum } from "@/lib/format";
import {
  CLOSE_RATE_RUBRIC,
  DPL_RUBRIC,
  NIS_RUBRIC,
  PITCH_RATE_RUBRIC,
  RETENTION_RUBRIC,
  scoreValue,
  type Rubric,
} from "@/lib/managerKpiRubric";
import { toast } from "sonner";

// ───────────────────────── helpers ─────────────────────────
type PeriodKind = "month" | "quarter";
interface Period {
  key: string;
  label: string;
  kind: PeriodKind;
  start: Date;
  end: Date; // exclusive
}

const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
};

const quarterOf = (d: Date) => Math.floor(d.getMonth() / 3);

const buildPeriods = (): Period[] => {
  const now = new Date();
  const periods: Period[] = [];

  const cqIdx = quarterOf(now);
  const cqStart = new Date(now.getFullYear(), cqIdx * 3, 1);
  const cqEnd = new Date(now.getFullYear(), cqIdx * 3 + 3, 1);
  periods.push({
    key: `Q-${now.getFullYear()}-${cqIdx + 1}`,
    label: `Current Quarter (Q${cqIdx + 1} ${now.getFullYear()})`,
    kind: "quarter",
    start: cqStart,
    end: cqEnd,
  });

  const pqStart = new Date(cqStart);
  pqStart.setMonth(pqStart.getMonth() - 3);
  const pqEnd = new Date(cqStart);
  const pqIdx = quarterOf(pqStart);
  periods.push({
    key: `Q-${pqStart.getFullYear()}-${pqIdx + 1}`,
    label: `Previous Quarter (Q${pqIdx + 1} ${pqStart.getFullYear()})`,
    kind: "quarter",
    start: pqStart,
    end: pqEnd,
  });

  const monthsSet = new Set<string>();
  const monthEntries: Period[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = monthKey(d);
    if (!monthsSet.has(k)) {
      monthsSet.add(k);
      monthEntries.push({
        key: k,
        label: monthLabel(k),
        kind: "month",
        start: d,
        end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
      });
    }
  }
  for (let m = 0; m < 12; m++) {
    const d = new Date(2026, m, 1);
    const k = monthKey(d);
    if (!monthsSet.has(k)) {
      monthsSet.add(k);
      monthEntries.push({
        key: k,
        label: monthLabel(k),
        kind: "month",
        start: d,
        end: new Date(2026, m + 1, 1),
      });
    }
  }
  monthEntries.sort((a, b) => b.start.getTime() - a.start.getTime());
  return [...periods, ...monthEntries];
};

interface ManualInputs {
  totalLeads: number;
  selfGens: number;
  retentionPct: number;
  // Optional manual overrides if the user wants to use Workday's source-of-truth numbers.
  closeRateOverride?: number;
  nisOverride?: number;
  pitchRateOverride?: number;
}

const DEFAULTS: ManualInputs = {
  totalLeads: 0,
  selfGens: 0,
  retentionPct: 95,
};

const storageKey = (userId: string, month: string) =>
  `manageup:${userId}:${month}`;

function loadInputs(userId: string, month: string): ManualInputs {
  try {
    const raw = localStorage.getItem(storageKey(userId, month));
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

// ───────────────────────── components ─────────────────────────

function TierLadder({ rubric, value, score }: { rubric: Rubric; value: number; score: number }) {
  return (
    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
      {rubric.tiers.map((t) => {
        const active = t.points === score;
        const achieved = t.points < score;
        return (
          <div
            key={t.points}
            title={t.label}
            className={`rounded-lg border p-1.5 text-center transition-all ${
              active
                ? "border-primary bg-primary/15 shadow-[0_0_0_2px_hsl(var(--primary)/0.25)]"
                : achieved
                ? "border-accent/30 bg-accent/10"
                : "border-border bg-card"
            }`}
          >
            <p
              className={`text-base font-extrabold font-display tabular-nums ${
                active ? "text-primary" : achieved ? "text-accent" : "text-muted-foreground"
              }`}
            >
              {t.points}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function formatRubricValue(rubric: Rubric, v: number): string {
  if (rubric.unit === "pct") return pctNum(v, 1);
  if (rubric.unit === "usd") return formatCurrency(v);
  return formatCount(v);
}

function KpiRubricCard({
  rubric,
  value,
  hint,
}: {
  rubric: Rubric;
  value: number;
  hint?: string;
}) {
  const tier = scoreValue(rubric, value);
  return (
    <div className="card-elevated-lg p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {rubric.name}
          </p>
          <p className="mt-1 text-3xl font-display font-extrabold text-foreground tabular-nums">
            {formatRubricValue(rubric, value)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{rubric.description}</p>
          {hint && (
            <p className="mt-1 text-[11px] text-primary/80 flex items-center gap-1">
              <Info className="h-3 w-3" /> {hint}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 text-center">
          <div className="px-3 py-2 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/30">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Score
            </p>
            <p className="text-2xl font-display font-extrabold text-primary tabular-nums leading-tight">
              {tier.points}
              <span className="text-sm text-muted-foreground">/10</span>
            </p>
          </div>
        </div>
      </div>

      <TierLadder rubric={rubric} value={value} score={tier.points} />
      <p className="text-[11px] text-muted-foreground text-center">
        Current tier: <span className="font-semibold text-foreground">{tier.label}</span>
      </p>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
}) {
  return (
    <label className="space-y-1 block">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center rounded-xl border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/40">
        {prefix && <span className="px-3 text-sm text-muted-foreground">{prefix}</span>}
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent px-3 py-2 text-sm font-semibold text-foreground outline-none tabular-nums"
        />
        {suffix && <span className="px-3 text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );
}

// ───────────────────────── page ─────────────────────────

export default function ManageUp() {
  const { user } = useAuth();
  const { data: deals = [] } = useDeals();
  const periods = useMemo(() => buildPeriods(), []);
  const [periodKey, setPeriodKey] = useState(
    periods.find((p) => p.kind === "month")?.key ?? periods[0].key,
  );
  const period = periods.find((p) => p.key === periodKey) ?? periods[0];
  const isFuturePeriod = new Date() < period.start;
  const [inputs, setInputs] = useState<ManualInputs>(DEFAULTS);
  const [copied, setCopied] = useState(false);

  // load + persist per-period inputs
  useEffect(() => {
    if (!user) return;
    setInputs(loadInputs(user.id, periodKey));
  }, [user, periodKey]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(storageKey(user.id, periodKey), JSON.stringify(inputs));
  }, [user, periodKey, inputs]);

  // derive metrics from deals for the selected period
  const derived = useMemo(() => {
    const start = period.start.toISOString();
    const end = period.end.toISOString();

    const createdInPeriod = deals.filter(
      (d) => d.created_at >= start && d.created_at < end,
    );
    const leadsAuto = createdInPeriod.length;
    const pitchedAuto = createdInPeriod.filter(
      (d) => (d.price_a ?? 0) > 0 || (d.price_b ?? 0) > 0 || (d.price_c ?? 0) > 0,
    ).length;

    const closedInPeriod = deals.filter(
      (d) => d.closed_at && d.closed_at >= start && d.closed_at < end,
    );
    const won = closedInPeriod.filter((d) => d.stage === "won");
    const lost = closedInPeriod.filter((d) => d.stage === "lost");

    const finished = won.length + lost.length;
    const closeRate = finished > 0 ? (won.length / finished) * 100 : 0;
    const nis = won.reduce((s, d) => s + (d.closed_amount ?? 0), 0);

    return {
      closeRate,
      nis,
      wonCount: won.length,
      lostCount: lost.length,
      leadsAuto,
      pitchedAuto,
    };
  }, [deals, period]);

  // resolved values (override > derived > input)
  const closeRate = inputs.closeRateOverride ?? derived.closeRate;
  const nis = inputs.nisOverride ?? derived.nis;
  // Total Leads: prefer user-entered (>0) else auto from deals created this month.
  const leads = inputs.totalLeads > 0 ? inputs.totalLeads : derived.leadsAuto;
  const dpl = leads > 0 ? nis / leads : 0;
  const pitchRate =
    inputs.pitchRateOverride ??
    (leads > 0 ? Math.min(100, (derived.pitchedAuto / leads) * 100) : 0);
  const retention = inputs.retentionPct;

  const scores = [
    { rubric: CLOSE_RATE_RUBRIC, value: closeRate },
    { rubric: DPL_RUBRIC, value: dpl },
    { rubric: NIS_RUBRIC, value: nis },
    { rubric: PITCH_RATE_RUBRIC, value: pitchRate },
    { rubric: RETENTION_RUBRIC, value: retention },
  ].map((s) => ({ ...s, tier: scoreValue(s.rubric, s.value) }));

  const totalPoints = scores.reduce((s, x) => s + x.tier.points, 0);
  const avgPoints = totalPoints / scores.length;

  const summaryText = useMemo(() => {
    if (isFuturePeriod) {
      return `Self-Evaluation — ${period.label}\n\nNo data available — this period hasn't started yet.`;
    }
    const lines = [
      `Self-Evaluation — ${period.label}`,
      `Average proficiency: ${avgPoints.toFixed(1)} / 10  (total ${totalPoints} / 50)`,
      "",
      ...scores.map(
        (s) =>
          `• ${s.rubric.name}: ${formatRubricValue(s.rubric, s.value)}  →  ${s.tier.points}/10 (${s.tier.label})`,
      ),
      "",
      `Self Gens: ${inputs.selfGens}`,
      `Total Leads Run: ${inputs.totalLeads}`,
    ];
    return lines.join("\n");
  }, [period, scores, avgPoints, totalPoints, inputs.selfGens, inputs.totalLeads, isFuturePeriod]);

  const copyAll = async () => {
    await navigator.clipboard.writeText(summaryText);
    setCopied(true);
    toast.success("Summary copied — paste into Workday");
    setTimeout(() => setCopied(false), 1800);
  };

  const copyValue = async (text: string, what: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-extrabold text-foreground tracking-tight">
                  Manage Up
                </h1>
                <p className="text-sm text-muted-foreground">
                  Workday monthly self-evaluation, scored from your live deal data.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select
                value={periodKey}
                onChange={(e) => setPeriodKey(e.target.value)}
                className="bg-transparent text-sm font-semibold text-foreground outline-none max-w-[240px]"
              >
                <optgroup label="Quarters">
                  {periods.filter((p) => p.kind === "quarter").map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Months">
                  {periods.filter((p) => p.kind === "month").map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </optgroup>
              </select>
            </label>
            <button
              onClick={copyAll}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-[var(--shadow-glow)] hover:opacity-90"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy summary
            </button>
          </div>
        </div>

        {/* Overall scorecard */}
        <div className="card-elevated-lg p-5 sm:p-6 bg-gradient-to-br from-primary/10 via-card to-accent/5 border-primary/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {period.label} · Overall Proficiency
              </p>
              <p className="mt-1 text-5xl font-display font-extrabold gradient-text tabular-nums">
                {isFuturePeriod ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <>
                    {avgPoints.toFixed(1)}
                    <span className="text-2xl text-muted-foreground"> / 10</span>
                  </>
                )}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isFuturePeriod ? "No data — this period hasn't started yet" : `${totalPoints} of 50 points across 5 competencies`}
              </p>
            </div>
            <div className="grid grid-cols-5 gap-2 flex-1 sm:max-w-md">
              {scores.map((s) => (
                <div
                  key={s.rubric.id}
                  className="rounded-xl border border-border bg-card/60 p-2 text-center"
                  title={`${s.rubric.name}: ${s.tier.label}`}
                >
                  <p className="text-lg font-display font-extrabold text-primary tabular-nums">
                    {s.tier.points}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground truncate">
                    {s.rubric.name.replace("Sales Rep ", "")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Manual inputs */}
        <section className="card-elevated-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Inputs for this month
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Close rate &amp; NIS are pulled from your deals automatically. Enter the values Workday
            also asks for (Total Leads, Self Gens, Retention). Optionally override the auto-derived
            numbers to match Workday's source of truth.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <NumberField
              label="Total Leads Run"
              value={inputs.totalLeads}
              onChange={(v) => setInputs({ ...inputs, totalLeads: v })}
            />
            <NumberField
              label="Self Gens"
              value={inputs.selfGens}
              onChange={(v) => setInputs({ ...inputs, selfGens: v })}
            />
            <NumberField
              label="Retention %"
              value={inputs.retentionPct}
              onChange={(v) => setInputs({ ...inputs, retentionPct: v })}
              suffix="%"
            />
            <NumberField
              label="Override NIS"
              value={inputs.nisOverride ?? 0}
              onChange={(v) =>
                setInputs({ ...inputs, nisOverride: v > 0 ? v : undefined })
              }
              prefix="$"
            />
            <NumberField
              label="Override Close %"
              value={inputs.closeRateOverride ?? 0}
              onChange={(v) =>
                setInputs({ ...inputs, closeRateOverride: v > 0 ? v : undefined })
              }
              suffix="%"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-hairline">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Leads (auto)</p>
              <p className="text-lg font-display font-bold text-foreground">{isFuturePeriod ? "—" : derived.leadsAuto}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pitched (auto)</p>
              <p className="text-lg font-display font-bold text-primary">{isFuturePeriod ? "—" : derived.pitchedAuto}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Won</p>
              <p className="text-lg font-display font-bold text-accent">{isFuturePeriod ? "—" : derived.wonCount}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Lost</p>
              <p className="text-lg font-display font-bold text-destructive">{isFuturePeriod ? "—" : derived.lostCount}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">NIS (auto)</p>
              <p className="text-lg font-display font-bold text-foreground">{isFuturePeriod ? "—" : formatCurrency(derived.nis)}</p>
            </div>
          </div>
        </section>

        {/* KPI cards */}
        {isFuturePeriod ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[CLOSE_RATE_RUBRIC, NIS_RUBRIC, DPL_RUBRIC, PITCH_RATE_RUBRIC, RETENTION_RUBRIC].map((r) => (
              <div key={r.id} className="card-elevated-lg p-5 space-y-4 opacity-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{r.name}</p>
                    <p className="mt-1 text-3xl font-display font-extrabold text-foreground tabular-nums">—</p>
                    <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                  </div>
                  <div className="flex-shrink-0 text-center">
                    <div className="px-3 py-2 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/30">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Score</p>
                      <p className="text-2xl font-display font-extrabold text-primary tabular-nums leading-tight">—</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <KpiRubricCard rubric={CLOSE_RATE_RUBRIC} value={closeRate} hint={inputs.closeRateOverride ? "Using your override" : `From ${derived.wonCount + derived.lostCount} finished deals`} />
            <KpiRubricCard rubric={NIS_RUBRIC} value={nis} hint={inputs.nisOverride ? "Using your override" : `${derived.wonCount} won deals`} />
            <KpiRubricCard rubric={DPL_RUBRIC} value={dpl} hint={leads > 0 ? `${formatCurrency(nis)} ÷ ${leads} leads` : "Enter Total Leads to calculate"} />
            <KpiRubricCard rubric={PITCH_RATE_RUBRIC} value={pitchRate} hint={leads > 0 ? `${derived.pitchedAuto} pitched ÷ ${leads} leads` : "Enter Total Leads to calculate"} />
            <KpiRubricCard rubric={RETENTION_RUBRIC} value={retention} hint="Manual entry — adjust above" />
          </div>
        )}

        {/* Workday Questions section */}
        <section className="card-elevated-lg p-5 space-y-4">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Workday Questions — copy-ready answers
          </h2>
          {[
            { q: "SELF GENS — How many Self Gens did you have?", a: String(inputs.selfGens) },
            { q: "TOTAL LEADS — How many Leads did you run in the month?", a: String(inputs.totalLeads) },
          ].map(({ q, a }) => (
            <div
              key={q}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">{q}</p>
                <p className="text-lg font-display font-extrabold text-primary tabular-nums">{a}</p>
              </div>
              <button
                onClick={() => copyValue(a, q.split(" — ")[0])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
          ))}
        </section>

        {/* Full summary */}
        <section className="card-elevated-lg p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Paste-ready summary
            </h2>
            <button
              onClick={copyAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy all
            </button>
          </div>
          <pre className="text-xs text-foreground bg-muted/40 rounded-xl p-4 whitespace-pre-wrap font-mono leading-relaxed">
            {summaryText}
          </pre>
        </section>
      </main>
    </div>
  );
}
