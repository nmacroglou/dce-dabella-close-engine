import { lazy, Suspense, useState, useMemo, useCallback } from "react";
import { DollarSign, Plus, FileText, Settings2, Calculator, Loader2 } from "lucide-react";
import { getMonthlyBonus, MONTHLY_BONUS_TIERS } from "@/data/commissionData";
import { useT } from "@/contexts/LanguageContext";
import SectionHeader from "./shared/SectionHeader";
import DealCard, { type Deal, emptyDeal, computeDeal } from "./commission/DealCard";

// Defer heavy sub-views so only the active one loads.
const MonthlyOverview = lazy(() => import("./commission/MonthlyOverview"));
const CommissionReferenceTables = lazy(() => import("./commission/CommissionReferenceTables"));
const CommissionSheet = lazy(() => import("./commission/CommissionSheet"));
const CommissionGridEditor = lazy(() => import("./commission/CommissionGridEditor"));
const MonthlyPromosEditor = lazy(() => import("./commission/MonthlyPromosEditor"));
const FollowUpSLAEditor = lazy(() => import("@/components/followups/FollowUpSLAEditor"));

const ViewFallback = () => (
  <div className="rounded-2xl border border-hairline bg-card/50 p-8 grid place-items-center">
    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
  </div>
);

type View = "sheet" | "estimator" | "grid";

export default function CommissionTab() {
  const t = useT();
  const VIEWS: { key: View; label: string; icon: typeof FileText; desc: string }[] = [
    { key: "sheet", label: t("Live Sheet", "Hoja en vivo"), icon: FileText, desc: t("Auto-fill from active deal", "Auto-llenado desde el deal activo") },
    { key: "estimator", label: t("Quick Estimator", "Estimador rápido"), icon: Calculator, desc: t("Multi-deal monthly NIS", "NIS mensual multi-deal") },
    { key: "grid", label: t("My Grid", "Mi tabla"), icon: Settings2, desc: t("Edit your % tiers", "Edita tus tiers de %") },
  ];
  const [view, setView] = useState<View>("sheet");
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
      {/* View switcher */}
      <div className="grid grid-cols-3 gap-2 p-1.5 card-premium rounded-2xl">
        {VIEWS.map(({ key, label, icon: Icon, desc }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`rounded-xl px-3 py-2.5 text-left transition-all pressable ${
              view === key
                ? "gradient-brand text-primary-foreground shadow-[var(--shadow-glow)]"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="text-sm font-semibold">{label}</span>
            </div>
            <p className={`text-[10px] mt-0.5 ${view === key ? "text-primary-foreground/80" : "text-muted-foreground/70"}`}>
              {desc}
            </p>
          </button>
        ))}
      </div>

      {view === "sheet" && (
        <Suspense fallback={<ViewFallback />}><CommissionSheet /></Suspense>
      )}

      {view === "grid" && (
        <Suspense fallback={<ViewFallback />}>
          <div className="space-y-5">
            <CommissionGridEditor />
            <MonthlyPromosEditor />
            <FollowUpSLAEditor />
          </div>
        </Suspense>
      )}

      {view === "estimator" && (
        <Suspense fallback={<ViewFallback />}>
          <MonthlyOverview {...monthly} />

          <div className="space-y-3">
            <SectionHeader
              icon={<DollarSign className="h-5 w-5 text-primary" />}
              title={t("Deals", "Deals")}
              subtitle={t("Add each deal to estimate commissions and track NIS", "Añade cada deal para estimar comisiones y rastrear NIS")}
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
              className="w-full rounded-2xl border-2 border-dashed border-hairline-strong hover:border-primary/50 hover:bg-primary/5 p-4 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-all pressable"
            >
              <Plus className="h-4 w-4" />
              {t("Add Deal", "Añadir Deal")}
            </button>
          </div>

          <CommissionReferenceTables />
        </Suspense>
      )}
    </div>
  );
}
