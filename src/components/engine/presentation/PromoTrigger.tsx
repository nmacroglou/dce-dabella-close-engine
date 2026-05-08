import { useState } from "react";
import { Tag, Check, Sparkles } from "lucide-react";

export interface PromoState {
  newCustomer: boolean; // 5%
  efficiency: boolean;  // 10%
  marketing: boolean;   // 15%
  reviews: boolean;     // 20%
}

export const EMPTY_PROMOS: PromoState = {
  newCustomer: false,
  efficiency: false,
  marketing: false,
  reviews: false,
};

export const PROMO_DEFS: { key: keyof PromoState; pct: number; label: string; hint: string }[] = [
  { key: "newCustomer", pct: 5,  label: "New Customer Promo", hint: "First-time homeowner welcome" },
  { key: "efficiency",  pct: 10, label: "Efficiency Discount", hint: "Energy-efficient install bonus" },
  { key: "marketing",   pct: 15, label: "Marketing Credit",    hint: "Showcase home in our portfolio" },
  { key: "reviews",     pct: 20, label: "Reviews Reward",      hint: "Public review + referral pledge" },
];

export const totalDiscountPct = (p: PromoState): number =>
  PROMO_DEFS.reduce((sum, d) => sum + (p[d.key] ? d.pct : 0), 0);

interface Props {
  promos: PromoState;
  onChange: (next: PromoState) => void;
}

export default function PromoTrigger({ promos, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const total = totalDiscountPct(promos);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-full border shadow-md px-4 py-2 text-sm font-semibold transition-colors ${
          total > 0
            ? "bg-accent text-accent-foreground border-accent"
            : "bg-card text-foreground border-border hover:bg-muted"
        }`}
        aria-label="Apply price drops"
      >
        {total > 0 ? <Sparkles className="h-4 w-4" /> : <Tag className="h-4 w-4 text-muted-foreground" />}
        {total > 0 ? `-${total}% applied` : "Promos"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 z-50 rounded-2xl bg-card border border-border shadow-2xl p-3 animate-fade-in">
            <div className="px-2 pb-2 mb-1 border-b border-border">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Price Drops</p>
              <p className="text-xs text-muted-foreground mt-0.5">Stack discounts as you negotiate</p>
            </div>
            <div className="space-y-1">
              {PROMO_DEFS.map((d) => {
                const active = promos[d.key];
                return (
                  <button
                    key={d.key}
                    onClick={() => onChange({ ...promos, [d.key]: !active })}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                      active ? "bg-accent/15 ring-1 ring-accent" : "hover:bg-muted"
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 h-9 w-12 rounded-lg flex items-center justify-center text-sm font-extrabold ${
                        active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      -{d.pct}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{d.label}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{d.hint}</p>
                    </div>
                    {active && <Check className="h-4 w-4 text-accent flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
            {total > 0 && (
              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between px-2">
                <span className="text-xs text-muted-foreground">Total drop</span>
                <span className="text-sm font-extrabold text-accent">-{total}%</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
