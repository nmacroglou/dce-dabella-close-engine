import type { EngineState, EngineUpdater } from "@/types/engine";
import { getCoachCard, COACHING_RULES } from "@/data/coachingCards";
import { Brain, Shield, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import LiveCoachPanel from "./LiveCoachPanel";

interface Props {
  state: EngineState;
  coachingTip: string;
  update: EngineUpdater;
}

export default function CoachModeTab({ state, coachingTip, update }: Props) {
  const card = getCoachCard(state);

  return (
    <div className="space-y-6 animate-fade-in">
      <LiveCoachPanel state={state} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-6">
        <div className="card-premium p-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-5 relative">
            <div className="rounded-xl gradient-brand p-3 shadow-[var(--shadow-glow)]">
              <Brain className="h-7 w-7 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-bold font-display gradient-text">Next move engine</h3>
          </div>

          <div className="space-y-4 relative">
            <div className="p-5 rounded-xl bg-primary/5 border border-hairline-strong">
              <h4 className="text-base font-bold text-foreground mb-1">{card.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.detail}</p>
            </div>
            <div className="script-block text-base">{card.script}</div>
          </div>

          <div className="flex gap-3 mt-5 relative">
            <Button
              onClick={() => update("priceShown", true)}
              className="flex-1 touch-target rounded-xl gradient-brand text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95 pressable"
              size="lg"
            >
              <Eye className="h-4 w-4 mr-2" /> Trigger Silence Coaching
            </Button>
            <Button
              onClick={() => { update("priceShown", false); update("objectionType", null); }}
              variant="outline"
              className="flex-1 touch-target rounded-xl border-hairline-strong hover:border-primary/40 pressable"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Return to Route Mode
            </Button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="card-premium p-6">
          <h3 className="text-lg font-bold font-display text-foreground mb-5 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Rule set
          </h3>
          <div className="space-y-3">
            {COACHING_RULES.map((rule, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-hairline">
                <span className="flex-shrink-0 w-7 h-7 rounded-full gradient-brand text-primary-foreground flex items-center justify-center text-xs font-bold num-display shadow-sm">{i + 1}</span>
                <p className="text-sm font-medium text-foreground leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

