import { useState } from "react";
import { EngineState } from "@/hooks/useCloseEngine";
import { Button } from "@/components/ui/button";
import { DollarSign, Clock, Users, HelpCircle } from "lucide-react";

interface Props {
  state: EngineState;
  computed: any;
  update: <K extends keyof EngineState>(key: K, value: EngineState[K]) => void;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const objections = [
  { id: "price", label: "Too Expensive", icon: DollarSign },
  { id: "think", label: "Need to Think", icon: Clock },
  { id: "spouse", label: "Talk to Spouse", icon: Users },
  { id: "value", label: "Not Sure Value", icon: HelpCircle },
] as const;

export default function ObjectionsTab({ state, computed, update }: Props) {
  const [active, setActive] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setActive(id);
    update("objectionType", id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card-elevated-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-5">What's the objection?</h3>
        <div className="grid grid-cols-2 gap-4">
          {objections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              className={`card-elevated p-5 flex items-center gap-4 transition-all active:scale-[0.98] touch-target ${
                active === id ? "ring-2 ring-primary border-primary" : ""
              }`}
            >
              <div className="rounded-xl bg-primary/10 p-3">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <span className="text-base font-semibold text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {active === "price" && (
        <div className="space-y-4 animate-fade-in">
          <div className="card-elevated-lg p-6">
            <h4 className="font-semibold text-foreground mb-3">Efficiency Close</h4>
            <div className="script-block">
              "I totally get it. That's exactly why we have our Efficiency option at {fmt(computed.efficiencyPrice)} — same quality, streamlined installation. Does that feel more comfortable?"
            </div>
          </div>
          <div className="card-elevated-lg p-6">
            <h4 className="font-semibold text-foreground mb-3">T-Close Follow-up</h4>
            <div className="script-block">
              "Most people here aren't deciding IF they need this — they already know they do. It's just whether the money makes sense right now… fair?"
            </div>
          </div>
        </div>
      )}

      {active === "value" && (
        <div className="space-y-4 animate-fade-in">
          <div className="card-elevated-lg p-6">
            <h4 className="font-semibold text-foreground mb-3">ROI Script</h4>
            <div className="script-block">
              "Let me show you something. Your investment returns {fmt(computed.roiValue)} in value — that's a {state.roiPercent}% ROI. Where else are you getting that kind of return right now?"
            </div>
          </div>
          <div className="card-elevated-lg p-6">
            <h4 className="font-semibold text-foreground mb-3">Energy Script</h4>
            <div className="script-block">
              "Right now you're spending {fmt(computed.annualCost)} per year on energy. Over 10 years that's {fmt(computed.tenYearCost)}. We can cut that by 75% — saving you {fmt(computed.savings75)}."
            </div>
          </div>
        </div>
      )}

      {active === "think" && (
        <div className="animate-fade-in">
          <div className="card-elevated-lg p-6">
            <h4 className="font-semibold text-foreground mb-3">Urgency Script</h4>
            <div className="script-block">
              "I completely understand wanting to think it over. The only reason I'd say today matters is that this pricing is tied to today's visit. If I come back next week, I can't guarantee the same numbers. What specifically would you want to think about?"
            </div>
          </div>
        </div>
      )}

      {active === "spouse" && (
        <div className="animate-fade-in">
          <div className="card-elevated-lg p-6">
            <h4 className="font-semibold text-foreground mb-3">Spouse Script</h4>
            <div className="script-block">
              "That makes total sense — this is a big decision. If {state.homeowner2 || 'they'} were here right now, what do you think their biggest concern would be? Price? Timing? Let's address that now so you can present it with confidence."
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
