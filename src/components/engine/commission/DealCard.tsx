import { memo, useState } from "react";
import { Trash2, ChevronDown } from "lucide-react";
import { fmt } from "@/lib/format";
import { PRODUCT_OPTIONS } from "@/data/products";
import { COMMISSION_RATES, FRONT_END_PCT, getStandardCommission, getMiniJobCommission, getSelfGenBonus } from "@/data/commissionData";
import StatCard from "../shared/StatCard";
import ToggleChip from "../shared/ToggleChip";

export interface Deal {
  id: string;
  product: string;
  contractPrice: number;
  projectPrice: number;
  discountPct: number;
  goldenPledge: boolean;
  selfGen: boolean;
  isMiniJob: boolean;
}

export const emptyDeal = (): Deal => ({
  id: crypto.randomUUID(),
  product: "Roofing System",
  contractPrice: 0,
  projectPrice: 0,
  discountPct: 0,
  goldenPledge: false,
  selfGen: false,
  isMiniJob: false,
});

export function computeDeal(d: Deal) {
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

interface DealCardProps {
  deal: Deal;
  onChange: (d: Deal) => void;
  onRemove: () => void;
  index: number;
}

export default memo(function DealCard({ deal, onChange, onRemove, index }: DealCardProps) {
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

          <div className="flex flex-wrap gap-3">
            <ToggleChip label="Golden Pledge (+1%)" checked={deal.goldenPledge} onChange={(v) => set("goldenPledge", v)} />
            <ToggleChip label="Self-Generated Lead" checked={deal.selfGen} onChange={(v) => set("selfGen", v)} />
            <ToggleChip label="Mini Job (flat rate)" checked={deal.isMiniJob} onChange={(v) => set("isMiniJob", v)} />
          </div>

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
});
