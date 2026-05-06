import { memo, useEffect, useState } from "react";
import { Plus, Trash2, Save, Sparkles, Calendar } from "lucide-react";
import { useCommissionGrid, useSaveCommissionGrid } from "@/hooks/useCommissionGrid";
import {
  DEFAULT_MONTHLY_BONUS_TIERS,
  type MonthlyPromo,
  type MonthlyBonusTier,
} from "@/types/commission";

const PRODUCTS = ["Roof", "Siding", "Gutters", "Baths", "Windows", "Solar", "Financing", "Other"];

const newPromo = (): MonthlyPromo => ({
  id: crypto.randomUUID(),
  month: new Date().toISOString().slice(0, 7),
  product: "Roof",
  label: "",
  details: "",
  override_pct: 0,
  active: true,
});

export default memo(function MonthlyPromosEditor() {
  const { data: grid } = useCommissionGrid();
  const save = useSaveCommissionGrid();
  const [promos, setPromos] = useState<MonthlyPromo[]>([]);
  const [bonusTiers, setBonusTiers] = useState<MonthlyBonusTier[]>(DEFAULT_MONTHLY_BONUS_TIERS);

  useEffect(() => {
    if (grid) {
      setPromos(grid.promos ?? []);
      setBonusTiers(grid.monthly_bonus_tiers ?? DEFAULT_MONTHLY_BONUS_TIERS);
    }
  }, [grid]);

  const updatePromo = (id: string, patch: Partial<MonthlyPromo>) =>
    setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const removePromo = (id: string) => setPromos((prev) => prev.filter((p) => p.id !== id));

  const updateTier = (i: number, patch: Partial<MonthlyBonusTier>) =>
    setBonusTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  const addTier = () => {
    const max = bonusTiers.reduce((m, t) => Math.max(m, t.min_nis), 0);
    setBonusTiers([...bonusTiers, { min_nis: max + 25000, pct: 0 }]);
  };
  const removeTier = (i: number) =>
    setBonusTiers(bonusTiers.filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (!grid) return;
    save.mutate({
      tiers: grid.tiers,
      front_end_pct: grid.front_end_pct,
      promos,
      monthly_bonus_tiers: bonusTiers,
    });
  };

  return (
    <div className="space-y-5">
      {/* Promos */}
      <div className="card-elevated-lg p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent/10">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground">Monthly Promos</h3>
            <p className="text-xs text-muted-foreground">
              Add this month's specials. Active promos appear as quick-pick buttons on the Commission Sheet.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={save.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>

        <div className="space-y-3">
          {promos.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-xl">
              No promos yet. Add this month's specials below.
            </p>
          )}
          {promos.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-3 space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-[120px_120px_1fr_100px_80px_auto] gap-2 items-end">
                <label className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Month</span>
                  <input
                    type="month"
                    value={p.month}
                    onChange={(e) => updatePromo(p.id, { month: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Product</span>
                  <select
                    value={p.product}
                    onChange={(e) => updatePromo(p.id, { product: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium"
                  >
                    {PRODUCTS.map((prod) => (
                      <option key={prod}>{prod}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 col-span-2 md:col-span-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Headline</span>
                  <input
                    type="text"
                    value={p.label}
                    onChange={(e) => updatePromo(p.id, { label: e.target.value })}
                    placeholder="e.g. Free Gutters @ 100%"
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Override %</span>
                  <input
                    type="number"
                    step="0.25"
                    value={p.override_pct}
                    onChange={(e) =>
                      updatePromo(p.id, { override_pct: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-center"
                  />
                </label>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={p.active}
                    onChange={(e) => updatePromo(p.id, { active: e.target.checked })}
                  />
                  Active
                </label>
                <button
                  onClick={() => removePromo(p.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive justify-self-end"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={p.details}
                onChange={(e) => updatePromo(p.id, { details: e.target.value })}
                rows={2}
                placeholder="Fine print: e.g. select colors based on region/vendor inventory only…"
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
              />
            </div>
          ))}
          <button
            onClick={() => setPromos([...promos, newPromo()])}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary/40 px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:text-primary"
          >
            <Plus className="h-4 w-4" /> Add Promo
          </button>
        </div>
      </div>

      {/* Monthly bonus tiers */}
      <div className="card-elevated-lg p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground">Monthly NIS Bonus Tiers</h3>
            <p className="text-xs text-muted-foreground">
              Auto-applied based on your total monthly NIS in the estimator.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-3 py-2 bg-muted/40 text-[11px] font-bold uppercase text-muted-foreground">
            <span>Min Monthly NIS ≥</span>
            <span>Bonus %</span>
            <span></span>
          </div>
          {bonusTiers.map((t, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_1fr_auto] gap-2 px-3 py-2 border-t border-border items-center"
            >
              <input
                type="number"
                value={t.min_nis}
                onChange={(e) => updateTier(i, { min_nis: Number(e.target.value) || 0 })}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm font-medium"
              />
              <input
                type="number"
                step="0.05"
                value={t.pct}
                onChange={(e) => updateTier(i, { pct: Number(e.target.value) || 0 })}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm font-medium"
              />
              <button
                onClick={() => removeTier(i)}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addTier}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border-t border-border text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5"
          >
            <Plus className="h-4 w-4" /> Add Tier
          </button>
        </div>
      </div>
    </div>
  );
});
