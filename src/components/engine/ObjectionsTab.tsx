import type { EngineTabProps } from "@/types/engine";
import { OBJECTIONS, OBJECTION_ROUTES } from "@/data/objections";
import { AlertTriangle, ChevronRight } from "lucide-react";

export default function ObjectionsTab({ state, update }: EngineTabProps) {
  const active = state.objectionType;
  const route = active ? OBJECTION_ROUTES[active] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
      <div className="lg:col-span-2">
        <div className="card-elevated-lg p-6">
          <h3 className="text-lg font-bold text-foreground mb-5">Objection router</h3>
          <div className="space-y-3">
            {OBJECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => update("objectionType", id)}
                className={`w-full card-elevated p-5 flex items-center gap-4 transition-all active:scale-[0.98] touch-target ${
                  active === id ? "ring-2 ring-primary border-primary" : ""
                }`}
              >
                <div className="rounded-xl bg-primary/10 p-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-base font-semibold text-foreground flex-1 text-left">{label}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-3">
        {route ? (
          <div className="card-elevated-lg p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">{route.title}</h3>
            </div>
            <div className="script-block mb-5">{route.script}</div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Route steps</h4>
            <div className="space-y-3">
              {route.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">{i + 1}</span>
                  <p className="text-sm font-medium text-foreground leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card-elevated-lg p-12 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Select an objection to see the route</p>
          </div>
        )}
      </div>
    </div>
  );
}
