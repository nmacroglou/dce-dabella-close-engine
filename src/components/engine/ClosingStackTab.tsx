import { useState } from "react";
import type { EngineTabProps } from "@/types/engine";
import { CLOSING_STEPS } from "@/data/closingSteps";
import { Sparkles } from "lucide-react";
import ScriptCard from "./shared/ScriptCard";

export default function ClosingStackTab({ state, computed, update }: EngineTabProps) {
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
      <div className="lg:col-span-3">
        <div className="card-elevated-lg p-6">
          <h3 className="text-lg font-bold text-foreground mb-5">Closing stack</h3>
          <div className="space-y-3">
            {CLOSING_STEPS.map((step, i) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
                className={`w-full text-left card-elevated p-5 transition-all active:scale-[0.99] touch-target ${
                  activeStep === step.id ? "ring-2 ring-primary border-primary" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">{step.label}</p>
                      <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase">
                        Natural ask
                      </span>
                    </div>
                    {activeStep === step.id && (
                      <div className="script-block mt-3 text-base animate-fade-in">{step.script}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="card-elevated-lg p-6 bg-foreground text-background">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Ready to close
          </h3>
          <p className="text-base leading-relaxed opacity-90 italic">
            "Based on everything we've gone through, this gives you peace of mind, eliminates future unexpected costs, and is the most cost-effective option. So the only thing left is — <strong className="not-italic opacity-100">would you like to use a check or card?</strong>"
          </p>
        </div>

        <div className="card-elevated-lg p-6">
          <ScriptCard
            title="If they hesitate"
            text={`"I completely understand. Other than the true objection we just discussed, is there anything else stopping you from moving forward today?"`}
          />
        </div>

        <div className="card-elevated-lg p-6">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Deal notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Capture homeowner reactions, objections, and next move..."
            className="w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[120px] resize-none"
          />
        </div>
      </div>
    </div>
  );
}
