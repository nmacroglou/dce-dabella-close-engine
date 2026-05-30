import { memo, useMemo, useState } from "react";
import { DollarSign, Zap, TrendingUp, BarChart3, Sparkles, Percent, Info, CreditCard } from "lucide-react";
import { fmt } from "@/lib/format";
import type { OptionComputed } from "@/types/engine";
import { PAYMENT_FACTORS, PAYMENT_TERMS } from "@/data/paymentFactors";
import PromoRow from "./PromoRow";

// Credit score → typical lender rate band (best-fit rows in PAYMENT_FACTORS)
const CREDIT_TIERS = [
  { id: "excellent", label: "Excellent", range: "740+",     ratePct: 9.99 },
  { id: "great",     label: "Great",     range: "700–739",  ratePct: 10.99 },
  { id: "good",      label: "Good",      range: "660–699",  ratePct: 12.99 },
  { id: "fair",      label: "Fair",      range: "620–659",  ratePct: 14.99 },
  { id: "rebuilding",label: "Rebuilding",range: "<620",     ratePct: 17.99 },
] as const;

type CreditTierId = (typeof CREDIT_TIERS)[number]["id"];

function tierFromScore(score: number): CreditTierId {
  if (score >= 740) return "excellent";
  if (score >= 700) return "great";
  if (score >= 660) return "good";
  if (score >= 620) return "fair";
  return "rebuilding";
}

function lookupFactor(ratePct: number, term: number): number | null {
  const row = PAYMENT_FACTORS.find((r) => r.ratePct === ratePct);
  return row?.factors[term] ?? null;
}

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
  const [creditTier, setCreditTier] = useState<CreditTierId>("great");
  const [term, setTerm] = useState<number>(180);
  const [dpOverride, setDpOverride] = useState<string>("");

  const ratePct = CREDIT_TIERS.find((t) => t.id === creditTier)!.ratePct;
  const tierFactor = useMemo(() => lookupFactor(ratePct, term), [ratePct, term]);
  const effDown = useMemo(() => {
    const n = parseFloat(dpOverride);
    return Number.isFinite(n) && n >= 0 ? n : downPayment;
  }, [dpOverride, downPayment]);
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
          <span className="ml-auto text-[10px] font-medium normal-case tracking-normal text-muted-foreground/80">
            tap <Info className="inline h-3 w-3 -mt-0.5" /> for math
          </span>
        </p>
        {(() => {
          const effDisc = opt.price - opt.efficiencyPrice;
          const stbDisc = opt.price - opt.standbyPrice;
          const d6Pct = opt.price > 0 ? Math.round(((opt.price - opt.deferred6Price) / opt.price) * 100) : 0;
          const d12Pct = opt.price > 0 ? Math.round(((opt.price - opt.deferred12Price) / opt.price) * 100) : 0;
          const ff = financingFactor ?? 0;
          const dp = downPayment ?? 0;
          const monthlyFormula = (p: number) =>
            `(${fmt(p)} − ${fmt(dp)} down) × ${ff.toFixed(5)} = ${fmt(Math.round((p - dp) * ff))}/mo`;
          return (
            <>
              <PromoRow
                label="Efficiency Discount"
                price={opt.efficiencyPrice}
                monthly={opt.monthlyEfficiency}
                explanation={`A flat dollar discount applied for opting into the efficiency package. Subtracted directly from the option price, then financed.`}
                formula={`Price: ${fmt(opt.price)} − ${fmt(effDisc)} disc = ${fmt(opt.efficiencyPrice)}\nMonthly: ${monthlyFormula(opt.efficiencyPrice)}`}
              />
              <PromoRow
                label="Standby Discount"
                price={opt.standbyPrice}
                monthly={opt.monthlyStandby}
                explanation={`A flat dollar standby/quick-decision incentive. Subtracted from the option price, then financed at the same rate.`}
                formula={`Price: ${fmt(opt.price)} − ${fmt(stbDisc)} disc = ${fmt(opt.standbyPrice)}\nMonthly: ${monthlyFormula(opt.standbyPrice)}`}
              />
              <PromoRow
                label="6 Month Deferred"
                price={opt.deferred6Price}
                monthly={opt.monthlyDeferred6}
                explanation={`Lender promo: no payments for 6 months. The discount is a percentage of the option price (set in Settings).`}
                formula={`Price: ${fmt(opt.price)} × (1 − ${d6Pct}%) = ${fmt(opt.deferred6Price)}\nMonthly: ${monthlyFormula(opt.deferred6Price)}`}
              />
              <PromoRow
                label="12 Month Deferred"
                price={opt.deferred12Price}
                monthly={opt.monthlyDeferred12}
                explanation={`Lender promo: no payments for 12 months. The discount is a percentage of the option price (set in Settings).`}
                formula={`Price: ${fmt(opt.price)} × (1 − ${d12Pct}%) = ${fmt(opt.deferred12Price)}\nMonthly: ${monthlyFormula(opt.deferred12Price)}`}
              />
              <p className="text-[10px] text-muted-foreground/80 px-1 pt-1 leading-relaxed">
                <span className="font-semibold text-foreground/70">Variables:</span> Financing Factor = {ff.toFixed(5)} (rate × term factor) · Down Payment = {fmt(dp)} · Discounts configured in Calculator inputs.
              </p>
            </>
          );
        })()}
      </div>

      {/* Discount tiers — dialed-in payment estimator */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Percent className="h-4 w-4 text-warning" /> Discount Range Preview
          </p>
          {tierFactor != null && (
            <span className="text-[10px] font-mono text-muted-foreground">
              factor {tierFactor.toFixed(5)}
            </span>
          )}
        </div>

        {/* Estimator controls — credit tier · term · down payment */}
        <div className="rounded-xl border border-hairline bg-muted/30 p-3 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <CreditCard className="h-3.5 w-3.5 text-primary" /> Payment Assumptions
          </div>

          {/* Credit tier chips */}
          <div className="flex flex-wrap gap-1.5">
            {CREDIT_TIERS.map((t) => {
              const active = t.id === creditTier;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCreditTier(t.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors border ${
                    active
                      ? "bg-primary text-primary-foreground border-transparent"
                      : "bg-background/60 text-muted-foreground border-hairline hover:text-foreground"
                  }`}
                  title={`Credit score ${t.range} → ${t.ratePct}% APR`}
                >
                  {t.label}
                  <span className="ml-1 opacity-70 font-mono">{t.ratePct}%</span>
                </button>
              );
            })}
          </div>

          {/* Term + Down payment */}
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Term</span>
              <select
                value={term}
                onChange={(e) => setTerm(parseInt(e.target.value, 10))}
                className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold bg-background border border-hairline focus:border-primary focus:outline-none"
              >
                {PAYMENT_TERMS.map((t) => (
                  <option key={t} value={t} disabled={lookupFactor(ratePct, t) == null}>
                    {t} mo {lookupFactor(ratePct, t) == null ? "(n/a)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Down Payment
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={dpOverride}
                onChange={(e) => setDpOverride(e.target.value)}
                placeholder={fmt(downPayment)}
                className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold bg-background border border-hairline focus:border-primary focus:outline-none"
              />
            </label>
          </div>
          {tierFactor == null && (
            <p className="text-[10px] text-destructive">
              No published factor for {ratePct}% @ {term}mo — pick another term.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {DISCOUNT_TIERS.map((tier) => {
            const discounted = opt.price * (1 - tier / 100);
            const financed = Math.max(0, discounted - effDown);
            const monthly = tierFactor != null ? Math.round(financed * tierFactor) : null;
            const savings = opt.price - discounted;
            return (
              <div key={tier} className="rounded-xl border border-warning/20 bg-warning/5 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-warning uppercase tracking-wider">{tier}% off</span>
                  <span className="text-[10px] text-muted-foreground">−{fmt(savings)}</span>
                </div>
                <p className="text-base font-extrabold text-foreground tracking-tight">{fmt(discounted)}</p>
                {monthly !== null ? (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {fmt(monthly)}/mo
                    {effDown > 0 && (
                      <span className="opacity-70"> · after {fmt(effDown)} down</span>
                    )}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">—</p>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground/80 px-1 leading-relaxed">
          Monthly = (Discounted Price − Down Payment) × Factor. Factor pulled from the published rate table for the selected credit tier &amp; term.
        </p>
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
