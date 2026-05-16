import { memo, useMemo } from "react";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { OBJECTIONS } from "@/data/objections";

const WEEKS = 8;

function ObjectionHeatmapBase() {
  const { user } = useAuth();
  const { data = [] } = useQuery({
    queryKey: ["obj-heatmap", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date(Date.now() - WEEKS * 7 * 864e5).toISOString();
      const { data, error } = await supabase
        .from("deal_objections")
        .select("objection_type, created_at")
        .gte("created_at", since);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { matrix, max, weekLabels, types } = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dow = today.getDay();
    const thisWeekStart = new Date(today.getTime() - dow * 864e5);
    const weekStarts = Array.from({ length: WEEKS }, (_, i) =>
      new Date(thisWeekStart.getTime() - (WEEKS - 1 - i) * 7 * 864e5)
    );
    const weekLabels = weekStarts.map((d) => `${d.getMonth() + 1}/${d.getDate()}`);

    const counts: Record<string, number[]> = {};
    OBJECTIONS.forEach((o) => { counts[o.id] = Array(WEEKS).fill(0); });
    let max = 0;
    for (const row of data as Array<{ objection_type: string; created_at: string }>) {
      const arr = counts[row.objection_type];
      if (!arr) continue;
      const t = new Date(row.created_at).getTime();
      const idx = Math.floor((t - weekStarts[0].getTime()) / (7 * 864e5));
      if (idx >= 0 && idx < WEEKS) {
        arr[idx] += 1;
        if (arr[idx] > max) max = arr[idx];
      }
    }
    const types = OBJECTIONS.filter((o) => counts[o.id].some((v) => v > 0));
    return { matrix: counts, max: Math.max(1, max), weekLabels, types };
  }, [data]);

  return (
    <section className="card-premium p-5 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-warning/30 to-warning/5 grid place-items-center border border-hairline-strong shadow-sm">
          <Flame className="h-4 w-4 text-warning" />
        </div>
        <div>
          <h3 className="text-base font-bold font-display text-foreground">Objection trends — 8 weeks</h3>
          <p className="text-[11px] text-muted-foreground">Spot which objections are heating up before they cost deals.</p>
        </div>
      </div>

      {types.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Tag objections from a deal's Objections tab to see the heatmap fill in.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2"></th>
                {weekLabels.map((w, i) => (
                  <th key={i} className="text-center text-[10px] font-bold text-muted-foreground tabular-nums">{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {types.map((o) => (
                <tr key={o.id}>
                  <td className="text-[11px] font-semibold text-foreground pr-2 whitespace-nowrap">{o.label}</td>
                  {matrix[o.id].map((v, i) => {
                    const intensity = v / max;
                    return (
                      <td key={i} className="text-center">
                        <div
                          className="h-7 rounded-md grid place-items-center text-[10px] font-bold tabular-nums border border-border/50"
                          style={{
                            backgroundColor: v === 0
                              ? "hsl(var(--muted) / 0.4)"
                              : `hsl(var(--warning) / ${0.15 + intensity * 0.65})`,
                            color: intensity > 0.5 ? "hsl(var(--warning-foreground, var(--foreground)))" : "hsl(var(--foreground))",
                          }}
                          title={`${o.label} · week of ${weekLabels[i]} — ${v}`}
                        >
                          {v || ""}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export const ObjectionHeatmap = memo(ObjectionHeatmapBase);
