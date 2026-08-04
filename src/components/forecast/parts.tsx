import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { StatTile } from "@/components/pipeline/StatTile";
import { formatCurrency } from "@/lib/format";
import type { Scenario, delta } from "@/lib/forecast";

// Presentational building blocks for the Forecast page. No data access —
// every value is passed in already computed.

export function DeltaChip({ d, invert = false }: { d: ReturnType<typeof delta>; invert?: boolean }) {
  const good = invert ? d.dir === "down" : d.dir === "up";
  const bad = invert ? d.dir === "up" : d.dir === "down";
  const Icon = d.dir === "up" ? ArrowUp : d.dir === "down" ? ArrowDown : Minus;
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums",
      good && "text-success", bad && "text-destructive",
      d.dir === "flat" && "text-muted-foreground",
    )}>
      <Icon className="h-2.5 w-2.5" />
      {d.pct.toFixed(0)}%
    </span>
  );
}

export function PlanTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-display text-xl font-extrabold tabular-nums", accent)}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground tabular-nums mt-0.5">{sub}</div>}
    </div>
  );
}

export function AsmInput({ label, suffix, value, placeholder, overridden, onChange }: {
  label: string; suffix: "%" | "$"; value: number; placeholder: string; overridden: boolean;
  onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
        <span>{label}</span>
        {overridden && <span className="text-primary text-[9px]">edited</span>}
      </Label>
      <div className="relative mt-0.5">
        {suffix === "$" && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>}
        <Input
          type="number" min={0} value={value} placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") { onChange(null); return; }
            const n = +raw;
            onChange(isFinite(n) ? n : null);
          }}
          className={cn(
            "h-8 text-xs font-bold tabular-nums",
            suffix === "$" ? "pl-5 pr-6" : "pr-6",
            overridden && "border-primary/60"
          )}
        />
        {suffix === "%" && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>}
      </div>
    </div>
  );
}

export function MathStep({ n, label, calc, note }: { n: number; label: string; calc: string; note?: string }) {
  return (
    <div className="flex items-start gap-2 border-b border-border/40 pb-1.5 last:border-0">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold shrink-0">{n}</span>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-foreground text-[11px]">{label}</div>
        <div className="font-mono text-[11px] text-foreground/90 tabular-nums break-words">{calc}</div>
        {note && <div className="text-[10px] text-muted-foreground italic">{note}</div>}
      </div>
    </div>
  );
}


export function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between border-b border-border/50 pb-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </li>
  );
}

export function Lever({ label, before, after, goal }: { label: string; before: number; after: number; goal: number }) {
  const d = after - before;
  const pctOfGoal = (after / goal) * 100;
  return (
    <div className="rounded-xl border border-border/60 p-3 bg-muted/30">
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-extrabold tabular-nums">{formatCurrency(after)}</div>
      <div className="text-xs text-success font-bold">+{formatCurrency(d)}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{pctOfGoal.toFixed(0)}% of goal</div>
    </div>
  );
}

export function Definition({
  icon: Icon, label, accent, formula, plain, live,
}: {
  icon: React.ElementType; label: string; accent: string;
  formula: string; plain: string; live: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg bg-muted/70", accent)}>
          <Icon className={cn("h-3.5 w-3.5", accent)} />
        </span>
        <h4 className="font-display font-bold text-sm">{label}</h4>
      </div>
      <code className="block text-[11px] font-mono bg-background/60 border border-border/40 rounded px-2 py-1.5 text-foreground/90 overflow-x-auto whitespace-pre-wrap">
        {formula}
      </code>
      <p className="text-xs text-muted-foreground">{plain}</p>
      <p className="text-xs font-bold tabular-nums text-foreground">{live}</p>
    </div>
  );
}

export function KpiWithDelta({
  icon, label, value, accent, sub, d,
}: {
  icon: React.ElementType; label: string; value: string; accent: string; sub?: string;
  d: ReturnType<typeof delta>;
}) {
  return (
    <div className="relative">
      <StatTile icon={icon} label={label} value={value} accent={accent} sub={sub} />
      <div className="absolute top-2.5 right-2.5"><DeltaChip d={d} /></div>
    </div>
  );
}

export function ScenarioCard({ tone, label, sc }: { tone: "best" | "likely" | "worst"; label: string; sc: Scenario }) {
  const toneCls =
    tone === "best" ? "border-success/40 bg-success/5"
    : tone === "worst" ? "border-destructive/40 bg-destructive/5"
    : "border-primary/40 bg-primary/5";
  const dateStr = sc.projectedDate
    ? sc.projectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" })
    : "—";
  return (
    <div className={cn("rounded-lg border p-2.5", toneCls)}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-display text-base font-extrabold tabular-nums">{dateStr}</div>
      <div className="text-[11px] text-muted-foreground tabular-nums">
        {isFinite(sc.weeksToGoal) ? `${sc.weeksToGoal.toFixed(1)} wks` : "—"}
      </div>
      <div className="text-[11px] font-bold tabular-nums">{formatCurrency(sc.nisPerWeek)}/wk</div>
    </div>
  );
}

export function ConfidenceBand({ best, worst, likely }: { best: Scenario; worst: Scenario; likely: Scenario }) {
  if (!isFinite(best.weeksToGoal) && !isFinite(worst.weeksToGoal)) return null;
  const worstW = isFinite(worst.weeksToGoal) ? worst.weeksToGoal : 52;
  const bestW = isFinite(best.weeksToGoal) ? best.weeksToGoal : 0;
  const likelyW = isFinite(likely.weeksToGoal) ? likely.weeksToGoal : (worstW + bestW) / 2;
  const scaleMax = Math.max(worstW, 1);
  const pct = (w: number) => Math.min(100, Math.max(0, (w / scaleMax) * 100));
  return (
    <div className="pt-1">
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <div className="absolute top-0 h-full bg-gradient-to-r from-success/60 via-primary/70 to-destructive/60"
          style={{ left: `${pct(bestW)}%`, width: `${Math.max(2, pct(worstW) - pct(bestW))}%` }} />
        <div className="absolute top-0 h-full w-0.5 bg-foreground"
          style={{ left: `calc(${pct(likelyW)}% - 1px)` }}
          title={`Likely: ${likelyW.toFixed(1)} wks`} />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1 tabular-nums">
        <span>{bestW.toFixed(1)}w (best)</span>
        <span>{likelyW.toFixed(1)}w (likely)</span>
        <span>{isFinite(worst.weeksToGoal) ? `${worstW.toFixed(1)}w (worst)` : "∞"}</span>
      </div>
    </div>
  );
}
