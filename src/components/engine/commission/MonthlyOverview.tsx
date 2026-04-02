import { memo } from "react";
import { TrendingUp, AlertTriangle, Zap } from "lucide-react";
import { fmt } from "@/lib/format";
import { MONTHLY_BONUS_TIERS, MONTHLY_MIN_NIS, QUARTERLY_MIN_NIS } from "@/data/commissionData";
import StatCard from "../shared/StatCard";

interface MonthlyOverviewProps {
  totalNIS: number;
  totalCommission: number;
  bonus: { pct: number; bonus: number } | null;
  quarterlyNIS: number;
  onTrack: boolean;
  toNextTier: number;
  nextTier: { pct: number } | undefined;
}

export default memo(function MonthlyOverview({
  totalNIS, totalCommission, bonus, quarterlyNIS, onTrack, toNextTier, nextTier,
}: MonthlyOverviewProps) {
  const progress = totalNIS / MONTHLY_MIN_NIS;

  return (
    <div className="card-elevated-lg p-5 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Monthly Overview</h3>
          <p className="text-xs text-muted-foreground">Track your NIS, commissions, and bonus progress</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total NIS" value={fmt(totalNIS)} accent />
        <StatCard label="Total Commission" value={fmt(totalCommission)} />
        <StatCard
          label="Monthly Bonus"
          value={bonus ? fmt(bonus.bonus) : "—"}
          sub={bonus ? `${bonus.pct}% tier` : "Below $75k threshold"}
        />
        <StatCard
          label="Quarterly Pace"
          value={fmt(quarterlyNIS)}
          sub={quarterlyNIS >= QUARTERLY_MIN_NIS ? "✓ On track" : `Need ${fmt(QUARTERLY_MIN_NIS)}`}
        />
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-muted-foreground">Monthly Minimum Progress</span>
          <span className={onTrack ? "text-accent" : "text-warning"}>
            {fmt(totalNIS)} / {fmt(MONTHLY_MIN_NIS)}
          </span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${onTrack ? "bg-accent" : "bg-warning"}`}
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
        {!onTrack && (
          <p className="text-xs text-warning flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            {fmt(MONTHLY_MIN_NIS - totalNIS)} more needed to hit monthly minimum
          </p>
        )}
      </div>

      {/* Bonus tier ladder */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Bonus Tier Ladder</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {MONTHLY_BONUS_TIERS.map((tier) => {
            const active = totalNIS >= tier.min && totalNIS <= tier.max;
            const achieved = totalNIS > tier.max;
            return (
              <div
                key={tier.min}
                className={`rounded-xl border p-2.5 text-center transition-colors ${
                  active
                    ? "border-primary bg-primary/10"
                    : achieved
                    ? "border-accent/30 bg-accent/5"
                    : "border-border bg-card"
                }`}
              >
                <p className={`text-lg font-extrabold font-display ${active ? "text-primary" : achieved ? "text-accent" : "text-muted-foreground"}`}>
                  {tier.pct}%
                </p>
                <p className="text-[10px] font-semibold text-muted-foreground">
                  {fmt(tier.min)}+
                </p>
              </div>
            );
          })}
        </div>
        {toNextTier > 0 && totalNIS >= 75000 && (
          <p className="text-xs text-primary flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            {fmt(toNextTier)} to next bonus tier ({nextTier?.pct}%)
          </p>
        )}
      </div>
    </div>
  );
});
