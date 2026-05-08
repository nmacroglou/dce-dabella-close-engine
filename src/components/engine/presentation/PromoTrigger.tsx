import { useState } from "react";
import { Sliders } from "lucide-react";

export type TierKey = "newCustomer" | "efficiency" | "marketing" | "reviews";
export type TierState = TierKey | null;

export const TIER_DEFS: { key: TierKey; pct: number; label: string; hint: string }[] = [
  { key: "newCustomer", pct: 5,  label: "Tier 1 — New Customer", hint: "First-time homeowner welcome" },
  { key: "efficiency",  pct: 10, label: "Tier 2 — Efficiency",   hint: "Energy-efficient install bonus" },
  { key: "marketing",   pct: 15, label: "Tier 3 — Marketing",    hint: "Showcase home in our portfolio" },
  { key: "reviews",     pct: 20, label: "Tier 4 — Reviews",      hint: "Public review + referral pledge" },
];

export const tierPct = (t: TierState): number =>
  t ? TIER_DEFS.find((d) => d.key === t)?.pct ?? 0 : 0;

interface Props {
  tier: TierState;
  onChange: (next: TierState) => void;
}

/**
 * Discreet rep-only control. Renders as a tiny neutral icon button so the
 * homeowner doesn't read it as "discount". Internally surfaces the tier picker.
 */
export default function PromoTrigger({ tier, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const active = tier !== null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative h-9 w-9 rounded-full flex items-center justify-center border transition-colors ${
          active
            ? "bg-card border-border text-foreground/70"
            : "bg-card/60 border-border/60 text-muted-foreground/60 hover:text-foreground hover:bg-card"
        }`}
        aria-label="Adjustments"
        title="Adjustments"
      >
        <Sliders className="h-4 w-4" />
        {active && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent border-2 border-background" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 z-50 rounded-2xl bg-card border border-border shadow-2xl p-3 animate-fade-in">
            <div className="px-2 pb-2 mb-1 border-b border-border">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Adjustments</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">Pick one tier</p>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => { onChange(null); setOpen(false); }}
                className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all ${
                  !active ? "bg-muted ring-1 ring-border" : "hover:bg-muted"
                }`}
              >
                <div className="flex-shrink-0 h-8 w-12 rounded-lg flex items-center justify-center text-[11px] font-bold bg-muted text-muted-foreground">
                  None
                </div>
                <p className="text-sm font-semibold text-foreground">Standard</p>
              </button>
              {TIER_DEFS.map((d) => {
                const isActive = tier === d.key;
                return (
                  <button
                    key={d.key}
                    onClick={() => { onChange(isActive ? null : d.key); setOpen(false); }}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all ${
                      isActive ? "bg-accent/15 ring-1 ring-accent" : "hover:bg-muted"
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 h-8 w-12 rounded-lg flex items-center justify-center text-xs font-extrabold ${
                        isActive ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      −{d.pct}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{d.label}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{d.hint}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
