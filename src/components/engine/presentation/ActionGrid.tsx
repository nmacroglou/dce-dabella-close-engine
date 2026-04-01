import { memo } from "react";
import type { EngineState, EngineUpdater } from "@/types/engine";
import { Monitor, Eye, VolumeX, Filter } from "lucide-react";

interface ActionGridProps {
  state: EngineState;
  update: EngineUpdater;
  onShowCustomerView: () => void;
  showNarrow: boolean;
  onToggleNarrow: () => void;
}

export default memo(function ActionGrid({ state, update, onShowCustomerView, showNarrow, onToggleNarrow }: ActionGridProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 mt-5">
        {/* Customer View */}
        <button
          onClick={onShowCustomerView}
          className="flex items-center gap-3 p-4 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all active:scale-[0.98] touch-target"
        >
          <div className="rounded-lg bg-background/15 p-2">
            <Monitor className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold leading-tight">Customer View</p>
            <p className="text-[11px] opacity-70 leading-tight mt-0.5">Full-screen presentation for the homeowner</p>
          </div>
        </button>

        {/* Price Dropped */}
        <button
          onClick={() => { update("priceShown", true); update("currentStage", "presentation"); }}
          className={`flex items-center gap-3 p-4 rounded-xl transition-all active:scale-[0.98] touch-target ${
            state.priceShown
              ? "bg-primary text-primary-foreground"
              : "bg-primary/10 text-foreground hover:bg-primary/20 border border-primary/20"
          }`}
        >
          <div className={`rounded-lg p-2 ${state.priceShown ? "bg-primary-foreground/15" : "bg-primary/10"}`}>
            <Eye className={`h-5 w-5 ${state.priceShown ? "" : "text-primary"}`} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold leading-tight">Price Dropped</p>
            <p className={`text-[11px] leading-tight mt-0.5 ${state.priceShown ? "opacity-70" : "text-muted-foreground"}`}>
              {state.priceShown ? "Active — stay silent, let them react" : "Tap when you reveal the price to them"}
            </p>
          </div>
        </button>

        {/* Reset Silence */}
        <button
          onClick={() => update("priceShown", false)}
          disabled={!state.priceShown}
          className={`flex items-center gap-3 p-4 rounded-xl border transition-all active:scale-[0.98] touch-target ${
            state.priceShown
              ? "border-border bg-card hover:bg-muted"
              : "border-border/50 bg-muted/50 opacity-50 cursor-not-allowed"
          }`}
        >
          <div className="rounded-lg bg-muted p-2">
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground leading-tight">Reset Silence</p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              Clear the price-drop state and resume coaching
            </p>
          </div>
        </button>

        {/* Narrow Options */}
        <button
          onClick={onToggleNarrow}
          className={`flex items-center gap-3 p-4 rounded-xl border transition-all active:scale-[0.98] touch-target ${
            showNarrow
              ? "border-accent bg-accent/10"
              : "border-border bg-card hover:bg-muted"
          }`}
        >
          <div className={`rounded-lg p-2 ${showNarrow ? "bg-accent/15" : "bg-muted"}`}>
            <Filter className={`h-5 w-5 ${showNarrow ? "text-accent" : "text-muted-foreground"}`} />
          </div>
          <div className="text-left">
            <p className={`text-sm font-bold leading-tight ${showNarrow ? "text-accent" : "text-foreground"}`}>Narrow Options</p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              Ask the homeowner to eliminate one option
            </p>
          </div>
        </button>
      </div>

      {showNarrow && (
        <div className="mt-4 rounded-xl bg-accent/5 border border-accent/20 p-5 animate-fade-in">
          <p className="text-[11px] font-bold text-accent uppercase tracking-[0.15em] mb-2">Tap-to-speak narrowing script</p>
          <div className="script-block border-l-accent">
            "Out of these 3 options, which one would you eliminate?"
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            This forces a decision without asking them to commit. Once they eliminate one, 
            repeat with the remaining two to isolate their preferred option.
          </p>
        </div>
      )}
    </>
  );
});
