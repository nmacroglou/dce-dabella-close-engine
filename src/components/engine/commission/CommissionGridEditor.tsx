import { memo, useEffect, useState } from "react";
import { Plus, Trash2, Save, Settings2 } from "lucide-react";
import { useCommissionGrid, useSaveCommissionGrid } from "@/hooks/useCommissionGrid";
import { DEFAULT_TIERS, type CommissionGridTier } from "@/types/commission";

export default memo(function CommissionGridEditor() {
  const { data: grid } = useCommissionGrid();
  const save = useSaveCommissionGrid();
  const [tiers, setTiers] = useState<CommissionGridTier[]>(DEFAULT_TIERS);
  const [frontEnd, setFrontEnd] = useState(50);

  useEffect(() => {
    if (grid) {
      setTiers(grid.tiers);
      setFrontEnd(grid.front_end_pct);
    }
  }, [grid]);

  const updateTier = (i: number, patch: Partial<CommissionGridTier>) => {
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  };

  const addTier = () => {
    const max = tiers.reduce((m, t) => Math.max(m, t.min_pop), 0);
    setTiers([...tiers, { min_pop: max + 5, commission_pct: 0 }]);
  };

  const removeTier = (i: number) => setTiers(tiers.filter((_, idx) => idx !== i));

  return (
    <div className="card-elevated-lg p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
          <Settings2 className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">Your Commission Grid</h3>
          <p className="text-xs text-muted-foreground">% of Project Price → Commission %. Edit to match your real comp plan.</p>
        </div>
        <button
          onClick={() => save.mutate({ tiers, front_end_pct: frontEnd })}
          disabled={save.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          Save Grid
        </button>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Front-End Advance %</span>
        <input
          type="number"
          value={frontEnd}
          onChange={(e) => setFrontEnd(Number(e.target.value) || 0)}
          className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-sm font-bold text-foreground text-center"
        />
        <span className="text-xs text-muted-foreground">(remainder paid on completion)</span>
      </label>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-3 py-2 bg-muted/40 text-[11px] font-bold uppercase text-muted-foreground">
          <span>% of Project Price ≥</span>
          <span>Commission %</span>
          <span></span>
        </div>
        {tiers.map((t, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 px-3 py-2 border-t border-border items-center">
            <input
              type="number"
              value={t.min_pop}
              onChange={(e) => updateTier(i, { min_pop: Number(e.target.value) || 0 })}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm font-medium text-foreground"
            />
            <input
              type="number"
              step="0.1"
              value={t.commission_pct}
              onChange={(e) => updateTier(i, { commission_pct: Number(e.target.value) || 0 })}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm font-medium text-foreground"
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
  );
});
