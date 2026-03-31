import { EngineState } from "@/hooks/useCloseEngine";
import { Brain, Lightbulb, Shield, Target, Volume2, AlertTriangle } from "lucide-react";

interface Props {
  state: EngineState;
  coachingTip: string;
}

const rules = [
  { icon: Shield, text: "Build value before price" },
  { icon: AlertTriangle, text: "Don't defend too early" },
  { icon: Target, text: "Narrow, don't expand" },
  { icon: Volume2, text: "Always ask for the sale" },
];

export default function CoachModeTab({ state, coachingTip }: Props) {
  const stageLabel =
    state.currentStage === "calculator" ? "Setup" :
    state.currentStage === "presentation" ? "Presenting" :
    state.currentStage === "closing" ? "Closing" : state.currentStage;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Next Move Engine */}
      <div className="card-elevated-lg p-6 border-primary/20 bg-primary/[0.03]">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-xl bg-primary/10 p-3">
            <Brain className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Next Move Engine</h3>
            <p className="text-sm text-muted-foreground">Stage: {stageLabel}</p>
          </div>
        </div>
        <div className="rounded-xl bg-primary/10 p-5">
          <p className="text-xl font-semibold text-primary text-center">{coachingTip}</p>
        </div>
      </div>

      {/* Context */}
      <div className="card-elevated-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-warning" /> Current Context
        </h3>
        <div className="space-y-3">
          <ContextRow label="Price Shown" value={state.priceShown ? "Yes" : "No"} active={state.priceShown} />
          <ContextRow label="Selected Option" value={state.selectedOption || "None"} active={!!state.selectedOption} />
          <ContextRow label="Objection" value={state.objectionType || "None"} active={!!state.objectionType} />
          <ContextRow label="Homeowner" value={state.homeowner1 || "Not set"} active={!!state.homeowner1} />
        </div>
      </div>

      {/* Rules */}
      <div className="card-elevated-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Sales Rules</h3>
        <div className="space-y-3">
          {rules.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
              <div className="rounded-lg bg-primary/10 p-2">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-medium text-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Future AI placeholder */}
      <div className="card-elevated p-5 border-dashed border-2 border-muted-foreground/20 text-center">
        <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground font-medium">AI Voice Coaching — Coming Soon</p>
        <p className="text-xs text-muted-foreground mt-1">Real-time objection detection & script personalization</p>
      </div>
    </div>
  );
}

function ContextRow({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>{value}</span>
    </div>
  );
}
