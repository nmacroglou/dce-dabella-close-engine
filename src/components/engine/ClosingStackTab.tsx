import { useState } from "react";
import { EngineState } from "@/hooks/useCloseEngine";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ChevronRight, Sparkles } from "lucide-react";

interface Props {
  state: EngineState;
  computed: any;
  update: <K extends keyof EngineState>(key: K, value: EngineState[K]) => void;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const steps = [
  { id: "option", label: "Option Close", desc: "Narrow down to one option" },
  { id: "efficiency", label: "Efficiency Close", desc: "Present efficiency pricing" },
  { id: "standby", label: "Standby Close", desc: "Offer standby as backup" },
  { id: "tclose", label: "T-Close", desc: "Yes vs No comparison" },
  { id: "roi", label: "ROI Close", desc: "Show return on investment" },
  { id: "energy", label: "Energy Close", desc: "Highlight energy savings" },
  { id: "final", label: "Final Close", desc: "Ask for the sale" },
];

export default function ClosingStackTab({ state, computed, update }: Props) {
  const [completedSteps, setCompleted] = useState<Set<string>>(new Set());
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [showFinal, setShowFinal] = useState(false);

  const toggleStep = (id: string) => {
    setActiveStep(activeStep === id ? null : id);
  };

  const markDone = (id: string) => {
    setCompleted((prev) => new Set([...prev, id]));
    setActiveStep(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card-elevated-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-5">Closing Stack</h3>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <button
              key={step.id}
              onClick={() => toggleStep(step.id)}
              className={`w-full card-elevated p-4 flex items-center gap-4 transition-all active:scale-[0.99] touch-target ${
                activeStep === step.id ? "ring-2 ring-primary border-primary" : ""
              }`}
            >
              {completedSteps.has(step.id) ? (
                <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">{step.label}</p>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
              <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${activeStep === step.id ? "rotate-90" : ""}`} />
            </button>
          ))}
        </div>
      </div>

      {activeStep && (
        <div className="card-elevated-lg p-6 animate-fade-in">
          <StepContent step={activeStep} state={state} computed={computed} />
          <Button
            onClick={() => markDone(activeStep)}
            className="mt-4 w-full touch-target text-base rounded-xl bg-success text-success-foreground hover:bg-success/90"
            size="lg"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" /> Mark Complete
          </Button>
        </div>
      )}

      <Button
        onClick={() => { setShowFinal(true); update("currentStage", "closing"); }}
        className="w-full touch-target text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 h-16"
        size="lg"
      >
        <Sparkles className="h-6 w-6 mr-2" /> READY TO CLOSE
      </Button>

      {showFinal && (
        <div className="card-elevated-lg p-8 text-center animate-fade-in">
          <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
          <div className="script-block text-xl leading-relaxed border-l-0 text-center">
            "Based on everything we've gone through… this gives you peace of mind…<br/><br/>
            So the only thing left is—<br/><br/>
            <strong className="text-foreground not-italic">would you like to use a check or card?</strong>"
          </div>
        </div>
      )}
    </div>
  );
}

function StepContent({ step, state, computed }: { step: string; state: EngineState; computed: any }) {
  const scripts: Record<string, string> = {
    option: `"Out of these three options — ${state.optionAName}, ${state.optionBName}, and ${state.optionCName} — which one would you eliminate first?"`,
    efficiency: `"Our Efficiency option comes in at ${fmt(computed.efficiencyPrice)} — same great product, streamlined process. How does that feel?"`,
    standby: `"We also have our Standby option at ${fmt(computed.standbyPrice)} — if you're flexible on timing, we can lock you in at a lower rate."`,
    tclose: `"Most people sitting here aren't deciding IF they need this… they already know. It's just whether the money makes sense right now… fair?"`,
    roi: `"Your investment gives you a ${state.roiPercent}% return — that's ${fmt(computed.roiValue)} in added value. Where else are you getting that kind of return?"`,
    energy: `"You're spending ${fmt(computed.annualCost)} per year on energy — that's ${fmt(computed.tenYearCost)} over 10 years. We cut that by 75%, saving you ${fmt(computed.savings75)}."`,
    final: `"Based on everything we've gone through — the value, the savings, the protection — this is the right move. Would you like to use a check or card?"`,
  };
  return <div className="script-block">{scripts[step]}</div>;
}
