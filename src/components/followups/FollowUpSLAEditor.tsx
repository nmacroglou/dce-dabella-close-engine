import { memo, useEffect, useState } from "react";
import { Save, Plus, Trash2, Clock } from "lucide-react";
import { useCommissionGrid, useSaveCommissionGrid } from "@/hooks/useCommissionGrid";
import { DEFAULT_FOLLOW_UP_SLA, type FollowUpTouchpoint } from "@/types/followUp";

const PRESETS = [
  { h: 1, label: "1h" },
  { h: 4, label: "4h" },
  { h: 24, label: "1d" },
  { h: 48, label: "2d" },
  { h: 72, label: "3d" },
  { h: 168, label: "7d" },
];

function fmtOffset(h: number) {
  if (h < 24) return `${h}h`;
  return `${(h / 24).toFixed(0)}d`;
}

export default memo(function FollowUpSLAEditor() {
  const { data: grid } = useCommissionGrid();
  const save = useSaveCommissionGrid();
  const [touchpoints, setTouchpoints] = useState<FollowUpTouchpoint[]>(DEFAULT_FOLLOW_UP_SLA.touchpoints);

  useEffect(() => {
    if (grid?.follow_up_sla?.touchpoints) setTouchpoints(grid.follow_up_sla.touchpoints);
  }, [grid]);

  const updateT = (i: number, patch: Partial<FollowUpTouchpoint>) =>
    setTouchpoints((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  const addT = () =>
    setTouchpoints((prev) => [
      ...prev,
      { label: `Touch ${prev.length + 1}`, offset_hours: (prev.at(-1)?.offset_hours ?? 24) * 2 },
    ]);
  const removeT = (i: number) => setTouchpoints((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (!grid) return;
    save.mutate({
      tiers: grid.tiers,
      front_end_pct: grid.front_end_pct,
      promos: grid.promos,
      monthly_bonus_tiers: grid.monthly_bonus_tiers,
      follow_up_sla: { touchpoints },
    });
  };

  return (
    <div className="card-elevated-lg p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-warning/10">
          <Clock className="h-5 w-5 text-warning" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">Follow-Up SLA</h3>
          <p className="text-xs text-muted-foreground">
            Your personal cadence. When a deal goes to Follow-up, these touchpoints auto-schedule.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={save.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> Save
        </button>
      </div>

      <div className="space-y-2">
        {touchpoints.map((t, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-2">
            <div className="grid grid-cols-[1fr_120px_auto] gap-2 items-end">
              <label className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Label</span>
                <input
                  value={t.label}
                  onChange={(e) => updateT(i, { label: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">After (hours)</span>
                <input
                  type="number"
                  min={1}
                  value={t.offset_hours}
                  onChange={(e) => updateT(i, { offset_hours: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-center"
                />
              </label>
              <button
                onClick={() => removeT(i)}
                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Quick:</span>
              {PRESETS.map((p) => (
                <button
                  key={p.h}
                  onClick={() => updateT(i, { offset_hours: p.h })}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    t.offset_hours === p.h
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <span className="text-[10px] text-muted-foreground ml-auto">
                Due: <span className="font-bold text-foreground">{fmtOffset(t.offset_hours)}</span> after follow-up starts
              </span>
            </div>
          </div>
        ))}
        <button
          onClick={addT}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary/40 px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:text-primary"
        >
          <Plus className="h-4 w-4" /> Add Touchpoint
        </button>
      </div>
    </div>
  );
});
