import type { EngineState, EngineUpdater } from "@/types/engine";
import { getCoachCard, COACHING_RULES } from "@/data/coachingCards";
import { Brain, Shield, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  state: EngineState;
  coachingTip: string;
  update: EngineUpdater;
}

export default function CoachModeTab({ state, coachingTip, update }: Props) {
  const card = getCoachCard(state);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
      <div className="lg:col-span-3 space-y-6">
        <div className="card-elevated-lg p-6 border-primary/20 bg-primary/[0.02]">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-xl bg-primary/10 p-3">
              <Brain className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Next move engine</h3>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-primary/5 border border-primary/10">
              <h4 className="text-base font-bold text-foreground mb-1">{card.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.detail}</p>
            </div>
            <div className="script-block text-base">{card.script}</div>
          </div>

          <div className="flex gap-3 mt-5">
            <Button
              onClick={() => update("priceShown", true)}
              className="flex-1 touch-target rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              <Eye className="h-4 w-4 mr-2" /> Trigger Silence Coaching
            </Button>
            <Button
              onClick={() => { update("priceShown", false); update("objectionType", null); }}
              variant="outline"
              className="flex-1 touch-target rounded-xl"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Return to Route Mode
            </Button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="card-elevated-lg p-6">
          <h3 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Rule set
          </h3>
          <div className="space-y-3">
            {COACHING_RULES.map((rule, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <p className="text-sm font-medium text-foreground leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
