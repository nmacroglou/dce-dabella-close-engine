import type { EngineTabProps } from "@/types/engine";
import { OBJECTIONS, OBJECTION_ROUTES } from "@/data/objections";
import { AlertTriangle, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import { useDealObjections, useLogObjection, useDeleteDealObjection } from "@/hooks/useDealObjections";
import { Button } from "@/components/ui/button";

export default function ObjectionsTab({ state, update }: EngineTabProps) {
  const active = state.objectionType;
  const route = active ? OBJECTION_ROUTES[active] : null;

  const { activeDealId } = useActiveDeal();
  const { data: logged = [] } = useDealObjections(activeDealId);
  const log = useLogObjection();
  const del = useDeleteDealObjection();

  const handleLog = (id: string) => {
    if (!activeDealId) return;
    log.mutate({ dealId: activeDealId, objectionType: id });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
      <div className="lg:col-span-2 space-y-4">
        <div className="card-premium p-6">
          <h3 className="text-lg font-bold font-display gradient-text mb-5">Objection router</h3>
          <div className="space-y-3">
            {OBJECTIONS.map(({ id, label, icon: Icon }) => (
              <div
                key={id}
                className={`rounded-xl border p-4 flex items-center gap-3 transition-all pressable ${
                  active === id
                    ? "ring-2 ring-primary/50 border-primary bg-primary/5 shadow-[var(--shadow-glow)]"
                    : "border-hairline bg-card hover:border-primary/30 hover:shadow-[var(--shadow-sm)]"
                }`}
              >
                <button
                  onClick={() => update("objectionType", id)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <div className={`rounded-xl p-2.5 ${active === id ? "gradient-brand shadow-[var(--shadow-glow)]" : "bg-primary/10"}`}>
                    <Icon className={`h-5 w-5 ${active === id ? "text-primary-foreground" : "text-primary"}`} />
                  </div>
                  <span className="text-sm font-semibold text-foreground flex-1">{label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                {activeDealId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleLog(id)}
                    aria-label="Log this objection"
                    title="Log this objection on the deal"
                  >
                    <Plus className="h-4 w-4 text-primary" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {!activeDealId && (
            <p className="text-xs text-muted-foreground mt-4 italic">
              Open an active deal to log objections — feeds the dashboard heatmap.
            </p>
          )}
        </div>

        {activeDealId && logged.length > 0 && (
          <div className="card-premium p-5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Logged on this deal ({logged.length})
            </h4>
            <ul className="space-y-2">
              {logged.map((o) => {
                const meta = OBJECTIONS.find((x) => x.id === o.objection_type);
                return (
                  <li key={o.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">{meta?.label ?? o.objection_type}</span>
                    <button
                      onClick={() => del.mutate({ id: o.id, dealId: activeDealId })}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove logged objection"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="lg:col-span-3">
        {route ? (
          <div className="card-premium p-6 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg gradient-brand p-1.5 shadow-[var(--shadow-glow)]">
                <AlertTriangle className="h-4 w-4 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold font-display gradient-text">{route.title}</h3>
            </div>
            <div className="script-block mb-5">{route.script}</div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Route steps</h4>
            <div className="space-y-3">
              {route.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-hairline">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full gradient-brand text-primary-foreground flex items-center justify-center text-sm font-bold num-display shadow-sm">{i + 1}</span>
                  <p className="text-sm font-medium text-foreground leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card-premium p-12 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Select an objection to see the route</p>
          </div>
        )}
      </div>
    </div>
  );
}
