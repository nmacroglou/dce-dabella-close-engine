import { useState, useEffect } from "react";
import { CheckCircle2, ClipboardCheck } from "lucide-react";

const SCOPE_ITEMS = [
  "Supply Dumpster",
  "Tear-off of existing roofing to wood deck",
  "Replace damaged wood decking as needed",
  "Replace/install flashing",
  "Install drip and rake edge metal",
  "Install new pipe jacks and boots",
  "Install WEATHER WATCH Mineral Surfaced Leak Barrier on valleys, around skylights, chimney & all penetrations",
  "Underlayment over roof deck: TIGER PAW Roof Deck Protection of DECK ARMOR",
  "Install PRO START/WEATHER BLOCKER starter strips on all eaves and rakes",
  "Replace attic ventilation with COBRA SNOW COUNTRY exhaust Ridge Vent System and bring to code",
  "Install GAF Timberline shingles with StainGuard Algae Discoloration Protection",
  "Cap ridges and hips with RIDGLASS Premium Ridge Cap Shingles",
  "Installed by GAF Factory Certified Installers",
  "Haul away job debris, magnetically sweep yard, driveway, etc.",
];

export default function ScopeOfWork() {
  const [checked, setChecked] = useState<boolean[]>(new Array(SCOPE_ITEMS.length).fill(false));
  const [animating, setAnimating] = useState(false);
  const allChecked = checked.every(Boolean);

  const toggleItem = (index: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const checkAll = () => {
    if (allChecked) {
      setChecked(new Array(SCOPE_ITEMS.length).fill(false));
      return;
    }
    setAnimating(true);
    SCOPE_ITEMS.forEach((_, i) => {
      setTimeout(() => {
        setChecked((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
        if (i === SCOPE_ITEMS.length - 1) setAnimating(false);
      }, i * 120);
    });
  };

  const checkedCount = checked.filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative rounded-3xl border-2 border-primary/20 bg-card overflow-hidden shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 px-8 py-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <ClipboardCheck className="h-7 w-7 text-primary-foreground" />
            <h2 className="text-2xl font-extrabold text-primary-foreground tracking-tight">
              What to Expect
            </h2>
          </div>
          <p className="text-primary-foreground/80 text-sm font-medium">
            Your complete scope of work — everything included in your project
          </p>
        </div>

        {/* Progress bar */}
        <div className="px-8 pt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Scope reviewed
            </span>
            <span className="text-xs font-bold text-primary">
              {checkedCount} / {SCOPE_ITEMS.length}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(checkedCount / SCOPE_ITEMS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="px-8 py-6 space-y-1">
          {SCOPE_ITEMS.map((item, i) => (
            <button
              key={i}
              onClick={() => toggleItem(i)}
              className={`w-full flex items-start gap-4 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                checked[i]
                  ? "bg-accent/10"
                  : "hover:bg-muted/60"
              }`}
            >
              <div
                className={`flex-shrink-0 mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  checked[i]
                    ? "bg-accent border-accent scale-110"
                    : "border-border"
                }`}
              >
                {checked[i] && (
                  <CheckCircle2 className="h-5 w-5 text-accent-foreground animate-fade-in" />
                )}
              </div>
              <span
                className={`text-sm font-medium leading-snug transition-all duration-300 ${
                  checked[i] ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item}
              </span>
            </button>
          ))}
        </div>

        {/* Bottom action */}
        <div className="px-8 pb-8">
          <button
            onClick={checkAll}
            disabled={animating}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-base tracking-wide hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-70"
          >
            {allChecked ? "Reset Checklist" : "✓  Review All Items"}
          </button>
        </div>
      </div>

      {/* Coaching script below */}
      <div className="mt-6 text-center">
        <p className="script-block text-base max-w-2xl mx-auto">
          "Does that sound like everything we have spoken about today?"
        </p>
      </div>
    </div>
  );
}
