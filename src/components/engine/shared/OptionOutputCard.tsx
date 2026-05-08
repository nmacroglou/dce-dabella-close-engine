import { memo } from "react";
import { DollarSign, Zap, TrendingUp, BarChart3, Sparkles, Percent } from "lucide-react";
import { fmt } from "@/lib/format";
import type { OptionComputed } from "@/types/engine";
import PromoRow from "./PromoRow";

interface OptionOutputCardProps {
  label: string;
  name: string;
  opt: OptionComputed;
  energySavings: number;
  accent: string;
  financingFactor?: number;
  downPayment?: number;
}

const DISCOUNT_TIERS = [5, 10, 15, 20] as const;

function ValueLine({ icon: Icon, label, value, color }: { icon: typeof BarChart3; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-4 rounded-lg bg-muted/40">
      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
        <Icon className={`h-4 w-4 ${color}`} /> {label}
      </span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}

export default memo(function OptionOutputCard({ label, name, opt, energySavings, accent, financingFactor, downPayment = 0 }: OptionOutputCardProps) {
  return (
    <div className="card-elevated-lg p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className={`text-sm font-extrabold uppercase tracking-wider ${accent}`}>{label}</h4>
        <span className="text-2xl font-extrabold text-foreground">{fmt(opt.price)}</span>
      </div>
      <p className="text-sm text-muted-foreground truncate">{name}</p>

      {/* Monthly */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
        <span className="text-sm font-semibold text-muted-foreground">Monthly Payment</span>
        <span className="text-base font-bold text-foreground">{fmt(opt.monthly)}/mo</span>
      </div>

      {/* Promo lanes */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <DollarSign className="h-4 w-4 text-primary" /> Promotional Financing Options
        </p>
        <PromoRow label="Efficiency Discount" price={opt.efficiencyPrice} monthly={opt.monthlyEfficiency} />
        <PromoRow label="Standby Discount" price={opt.standbyPrice} monthly={opt.monthlyStandby} />
        <PromoRow label="6 Month Deferred" price={opt.deferred6Price} monthly={opt.monthlyDeferred6} />
        <PromoRow label="12 Month Deferred" price={opt.deferred12Price} monthly={opt.monthlyDeferred12} />
      </div>

      {/* Discount tiers — quick what-if */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <Percent className="h-4 w-4 text-warning" /> Discount Range Preview
        </p>
        <div className="grid grid-cols-2 gap-2">
          {DISCOUNT_TIERS.map((tier) => {
            const discounted = opt.price * (1 - tier / 100);
            const monthly = financingFactor && financingFactor > 0
              ? Math.round((discounted - downPayment) * financingFactor)
              : null;
            const savings = opt.price - discounted;
            return (
              <div key={tier} className="rounded-xl border border-warning/20 bg-warning/5 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-warning uppercase tracking-wider">{tier}% off</span>
                  <span className="text-[10px] text-muted-foreground">−{fmt(savings)}</span>
                </div>
                <p className="text-base font-extrabold text-foreground tracking-tight">{fmt(discounted)}</p>
                {monthly !== null && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">{fmt(monthly)}/mo</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Value stack */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-accent" /> Value Stack Breakdown
        </p>
        <ValueLine icon={BarChart3} label="Home Value Increase (ROI)" value={`+${fmt(opt.roiValue)}`} color="text-primary" />
        <ValueLine icon={Zap} label="10-Year Energy Savings" value={`+${fmt(energySavings)}`} color="text-accent" />
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" /> Net Effective Cost
          </span>
          <span className="text-base font-extrabold text-primary">{fmt(opt.netCost)}</span>
        </div>
      </div>
    </div>
  );
});
