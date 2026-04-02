import { useState, useMemo, useCallback } from "react";
import {
  DollarSign, Plus, Trash2, TrendingUp, Award, AlertTriangle, Zap, ChevronDown
} from "lucide-react";
import { fmt } from "@/lib/format";
import { PRODUCT_OPTIONS } from "@/data/products";
import {
  COMMISSION_RATES, FRONT_END_PCT, BACK_END_PCT,
  MONTHLY_BONUS_TIERS, MONTHLY_MIN_NIS, QUARTERLY_MIN_NIS,
  MINI_JOB_TIERS, MINI_JOB_FLOOR,
  getStandardCommission, getMiniJobCommission, getSelfGenBonus, getMonthlyBonus,
} from "@/data/commissionData";

/* ─── Types ─── */
interface Deal {
  id: string;
  product: string;
  contractPrice: number;
  projectPrice: number;
  discountPct: number;
  goldenPledge: boolean;
  selfGen: boolean;
  isMiniJob: boolean;
}

const emptyDeal = (): Deal => ({
  id: crypto.randomUUID(),
  product: "Roofing System",
  contractPrice: 0,
  projectPrice: 0,
  discountPct: 0,
  goldenPledge: false,
  selfGen: false,
  isMiniJob: false,
});

/* ─── Helpers ─── */
function computeDeal(d: Deal) {
  const rate = COMMISSION_RATES[d.product]?.base ?? 10;
  const standard = getStandardCommission(d.contractPrice, rate, d.goldenPledge);
  const miniJob = getMiniJobCommission(d.contractPrice);
  const selfGen = d.selfGen ? getSelfGenBonus(d.contractPrice, d.projectPrice) : 0;
  const commission = d.isMiniJob ? miniJob : standard;
  const total = commission + selfGen;
  const frontEnd = Math.round(total * (FRONT_END_PCT / 100));
  const backEnd = total - frontEnd;
  return { commission, selfGen, total, frontEnd, backEnd, miniJob, standard };
}

/* ─── Sub-components ─── */

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">{icon}</div>
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-extrabold font-display ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function DealCard({
  deal, onChange, onRemove, index,
}: {
  deal: Deal; onChange: (d: Deal) => void; onRemove: () => void; index: number;
}) {
  const result = computeDeal(deal);
  const [open, setOpen] = useState(true);

  const set = <K extends keyof Deal>(k: K, v: Deal[K]) => onChange({ ...deal, [k]: v });

  return (
    <div className="card-elevated-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </span>
          <div>
            <span className="text-sm font-bold text-foreground">
              {deal.product} — {deal.contractPrice > 0 ? fmt(deal.contractPrice) : "New Deal"}
            </span>
            {deal.contractPrice > 0 && (
              <span className="ml-2 text-xs font-semibold text-accent">
                {fmt(result.total)} commission
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          {/* Row 1: Product + Prices */}
          <div className="grid grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">Product</span>
              <select
                value={deal.product}
                onChange={(e) => set("product", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground"
              >
                {PRODUCT_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">Contract Price</span>
              <input
                type="number"
                value={deal.contractPrice || ""}
                onChange={(e) => set("contractPrice", Number(e.target.value))}
                placeholder="0"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">Project Price</span>
              <input
                type="number"
                value={deal.projectPrice || ""}
                onChange={(e) => set("projectPrice", Number(e.target.value))}
                placeholder="Full price"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground"
              />
            </label>
          </div>

          {/* Row 2: Toggles */}
          <div className="flex flex-wrap gap-3">
            <ToggleChip label="Golden Pledge (+1%)" checked={deal.goldenPledge} onChange={(v) => set("goldenPledge", v)} />
            <ToggleChip label="Self-Generated Lead" checked={deal.selfGen} onChange={(v) => set("selfGen", v)} />
            <ToggleChip label="Mini Job (flat rate)" checked={deal.isMiniJob} onChange={(v) => set("isMiniJob", v)} />
          </div>

          {/* Results */}
          {deal.contractPrice > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatCard label={deal.isMiniJob ? "Mini Job" : "Commission"} value={fmt(result.commission)} />
              {deal.selfGen && <StatCard label="Self-Gen Bonus" value={fmt(result.selfGen)} sub="8% of contract" />}
              <StatCard label="Total" value={fmt(result.total)} accent />
              <StatCard label="Front-End (80%)" value={fmt(result.frontEnd)} sub="Advance" />
              <StatCard label="Back-End (20%)" value={fmt(result.backEnd)} sub="On completion" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToggleChip({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
        checked
          ? "bg-primary/10 border-primary/30 text-primary"
          : "bg-card border-border text-muted-foreground hover:border-primary/20"
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${checked ? "bg-primary" : "bg-muted-foreground/30"}`} />
      {label}
    </button>
  );
}

/* ─── Main Component ─── */
export default function CommissionTab() {
  const [deals, setDeals] = useState<Deal[]>([emptyDeal()]);

  const addDeal = useCallback(() => setDeals((prev) => [...prev, emptyDeal()]), []);
  const removeDeal = useCallback((id: string) => setDeals((prev) => prev.filter((d) => d.id !== id)), []);
  const updateDeal = useCallback((id: string, updated: Deal) => {
    setDeals((prev) => prev.map((d) => (d.id === id ? updated : d)));
  }, []);

  const monthly = useMemo(() => {
    const totalNIS = deals.reduce((sum, d) => sum + d.contractPrice, 0);
    const totalCommission = deals.reduce((sum, d) => sum + computeDeal(d).total, 0);
    const bonus = getMonthlyBonus(totalNIS);
    const quarterlyNIS = totalNIS * 3; // projected
    const onTrack = totalNIS >= MONTHLY_MIN_NIS;
    const nextTier = MONTHLY_BONUS_TIERS.find((t) => t.min > totalNIS);
    const toNextTier = nextTier ? nextTier.min - totalNIS : 0;
    return { totalNIS, totalCommission, bonus, quarterlyNIS, onTrack, toNextTier, nextTier };
  }, [deals]);

  const bonusTierProgress = monthly.totalNIS / MONTHLY_MIN_NIS;

  return (
    <div className="space-y-6">
      {/* Monthly Overview */}
      <div className="card-elevated-lg p-5 space-y-4">
        <SectionHeader
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          title="Monthly Overview"
          subtitle="Track your NIS, commissions, and bonus progress"
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total NIS" value={fmt(monthly.totalNIS)} accent />
          <StatCard label="Total Commission" value={fmt(monthly.totalCommission)} />
          <StatCard
            label="Monthly Bonus"
            value={monthly.bonus ? fmt(monthly.bonus.bonus) : "—"}
            sub={monthly.bonus ? `${monthly.bonus.pct}% tier` : "Below $75k threshold"}
          />
          <StatCard
            label="Quarterly Pace"
            value={fmt(monthly.quarterlyNIS)}
            sub={monthly.quarterlyNIS >= QUARTERLY_MIN_NIS ? "✓ On track" : `Need ${fmt(QUARTERLY_MIN_NIS)}`}
          />
        </div>

        {/* Progress bar to minimum */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Monthly Minimum Progress</span>
            <span className={monthly.onTrack ? "text-accent" : "text-warning"}>
              {fmt(monthly.totalNIS)} / {fmt(MONTHLY_MIN_NIS)}
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${monthly.onTrack ? "bg-accent" : "bg-warning"}`}
              style={{ width: `${Math.min(bonusTierProgress * 100, 100)}%` }}
            />
          </div>
          {!monthly.onTrack && (
            <p className="text-xs text-warning flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              {fmt(MONTHLY_MIN_NIS - monthly.totalNIS)} more needed to hit monthly minimum
            </p>
          )}
        </div>

        {/* Bonus tier ladder */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Bonus Tier Ladder</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {MONTHLY_BONUS_TIERS.map((tier) => {
              const active = monthly.totalNIS >= tier.min && monthly.totalNIS <= tier.max;
              const achieved = monthly.totalNIS > tier.max;
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
          {monthly.toNextTier > 0 && monthly.totalNIS >= 75000 && (
            <p className="text-xs text-primary flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              {fmt(monthly.toNextTier)} to next bonus tier ({monthly.nextTier?.pct}%)
            </p>
          )}
        </div>
      </div>

      {/* Deals */}
      <div className="space-y-3">
        <SectionHeader
          icon={<DollarSign className="h-5 w-5 text-primary" />}
          title="Deals"
          subtitle="Add each deal to estimate commissions and track NIS"
        />

        {deals.map((deal, i) => (
          <DealCard
            key={deal.id}
            deal={deal}
            index={i}
            onChange={(d) => updateDeal(deal.id, d)}
            onRemove={() => removeDeal(deal.id)}
          />
        ))}

        <button
          onClick={addDeal}
          className="w-full rounded-2xl border-2 border-dashed border-border hover:border-primary/30 p-4 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Deal
        </button>
      </div>

      {/* Reference Tables */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Mini Job Tiers */}
        <div className="card-elevated-lg p-4 space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" /> Mini Job Tiers
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-semibold text-muted-foreground uppercase px-1">
              <span>Contract Price</span><span>Commission</span>
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="flex justify-between px-3 py-1.5 text-xs bg-muted/30 border-b border-border/50">
                <span className="text-muted-foreground">Under $15,000</span>
                <span className="font-bold text-foreground">{fmt(MINI_JOB_FLOOR)}</span>
              </div>
              {MINI_JOB_TIERS.map((t) => (
                <div key={t.min} className="flex justify-between px-3 py-1.5 text-xs border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">{fmt(t.min)} – {fmt(t.max)}</span>
                  <span className="font-bold text-foreground">{fmt(t.commission)}</span>
                </div>
              ))}
              <div className="flex justify-between px-3 py-1.5 text-xs bg-muted/30">
                <span className="text-muted-foreground">$55,000+ (per $5k)</span>
                <span className="font-bold text-foreground">+$250</span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Bonus Tiers */}
        <div className="card-elevated-lg p-4 space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Monthly Bonus Tiers
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-semibold text-muted-foreground uppercase px-1">
              <span>Monthly NIS</span><span>Bonus %</span>
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              {MONTHLY_BONUS_TIERS.map((t) => (
                <div key={t.min} className="flex justify-between px-3 py-1.5 text-xs border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">
                    {fmt(t.min)} – {t.max === Infinity ? "+" : fmt(t.max)}
                  </span>
                  <span className="font-bold text-foreground">{t.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 space-y-1">
            <p className="text-xs font-semibold text-primary">Review Requirement</p>
            <p className="text-[11px] text-muted-foreground">
              2 online customer reviews (one per assigned site) required in the bonus month for eligibility.
            </p>
          </div>
        </div>
      </div>

      {/* Key Rules */}
      <div className="card-elevated-lg p-4 space-y-3">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Key Commission Rules</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { title: "Front-End Advance", desc: `${FRONT_END_PCT}% issued when paperwork is complete, project is buildable, and $500+ deposit collected.` },
            { title: "Back-End Payout", desc: `Remaining ${BACK_END_PCT}% paid on first payroll after project completion.` },
            { title: "Paperwork Deadline", desc: "Work Order must be received by 10AM next business day or commission becomes back-end only." },
            { title: "Self-Gen Eligibility", desc: "8% bonus only if sold at ≥75% of Project Price. Must be a rep-generated lead." },
            { title: "Performance Minimum", desc: "$180,000 NIS/quarter ($60,000/month or $2,300 DPL). Failure may result in discipline." },
            { title: "Chargebacks", desc: "Cancelled/defaulted sales that don't become NIS can result in commission recapture." },
          ].map((rule) => (
            <div key={rule.title} className="rounded-xl border border-border p-3 space-y-1">
              <p className="text-xs font-bold text-foreground">{rule.title}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{rule.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
