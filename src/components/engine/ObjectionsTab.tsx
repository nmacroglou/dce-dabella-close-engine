import { EngineTabProps } from "@/hooks/useCloseEngine";
import { DollarSign, Clock, Users, HelpCircle, AlertTriangle, ChevronRight } from "lucide-react";

const objections = [
  { id: "price", label: "Too Expensive", icon: DollarSign },
  { id: "timing", label: "Need to Think", icon: Clock },
  { id: "trust", label: "Talk to Spouse / Trust Gap", icon: Users },
  { id: "value", label: "Not Sure Value", icon: HelpCircle },
] as const;

const routes: Record<string, { title: string; script: string; steps: string[] }> = {
  price: {
    title: "Price objection route",
    script: "\"Other than the investment, is there anything else that would stop you from using DaBella if we can make the numbers work?\"",
    steps: [
      "Isolate the objection before defending the number.",
      "Move to Efficiency Close if they are close to a decision.",
      "Use T-close if they keep collapsing everything into price.",
    ],
  },
  value: {
    title: "Value objection route",
    script: "\"Let's step back and look at what this does for the home long term, not just what it costs today.\"",
    steps: [
      "Rebuild value using warranty, installation quality, and system protection.",
      "Move into ROI close.",
      "Stack energy savings if this is an energy roof.",
    ],
  },
  timing: {
    title: "Timing objection route",
    script: "\"Before I leave, do you mind if I ask how far out you think you are before making a decision?\"",
    steps: [
      "Find out how far out they think they are from making a decision.",
      "If they are within 1–12 months, run Efficiency Close.",
      "If needed, pivot into deferral or standby positioning.",
    ],
  },
  trust: {
    title: "Trust objection route",
    script: "\"Would it help if I quickly replayed exactly what we found, what we're doing, and how it's protected?\"",
    steps: [
      "Slow down and replay inspection results.",
      "Reinforce GAF / workmanship / installers / warranty.",
      "Ask for the real objection once trust is rebuilt.",
    ],
  },
};

export default function ObjectionsTab({ state, update }: EngineTabProps) {
  const active = state.objectionType;
  const route = active ? routes[active] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
      <div className="lg:col-span-2">
        <div className="card-elevated-lg p-6">
          <h3 className="text-lg font-bold text-foreground mb-5">Objection router</h3>
          <div className="space-y-3">
            {objections.map(({ id, label, icon: Icon }) => (
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
