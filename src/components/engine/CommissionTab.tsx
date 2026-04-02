import { useState, useMemo, useCallback } from "react";
import { DollarSign, Plus } from "lucide-react";
import { getMonthlyBonus, MONTHLY_BONUS_TIERS } from "@/data/commissionData";
import SectionHeader from "./shared/SectionHeader";
import DealCard, { type Deal, emptyDeal, computeDeal } from "./commission/DealCard";
import MonthlyOverview from "./commission/MonthlyOverview";
import CommissionReferenceTables from "./commission/CommissionReferenceTables";

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
    const quarterlyNIS = totalNIS * 3;
    const onTrack = totalNIS >= 60000;
    const nextTier = MONTHLY_BONUS_TIERS.find((t) => t.min > totalNIS);
    const toNextTier = nextTier ? nextTier.min - totalNIS : 0;
    return { totalNIS, totalCommission, bonus, quarterlyNIS, onTrack, toNextTier, nextTier };
  }, [deals]);

  return (
    <div className="space-y-6">
      <MonthlyOverview {...monthly} />

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

      <CommissionReferenceTables />
    </div>
  );
}
