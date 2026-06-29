import { useState } from "react";
import { Sparkles, Flame, Thermometer, Shield, Droplets, Layers, ChevronDown } from "lucide-react";

const PILLARS = [
  {
    icon: Thermometer,
    title: "Heat Reflective & Energy Efficient",
    points: [
      "Reflects the sun's heat — paint doesn't, Cool Life® does",
      "Lowers surface temperature by as much as 37°F vs. traditional paint",
      "Save up to 27% on energy bills — it's sunscreen for your home",
    ],
  },
  {
    icon: Flame,
    title: "Fire Retardant Protection",
    points: [
      "Specialized fire-retardant coating — slows the spread of flames",
      "Minimizes smoke development & helps prevent structural damage",
      "Under extreme heat it breaks down into water and alumina",
    ],
  },
  {
    icon: Layers,
    title: "Best Protection Against Cracks",
    points: [
      "Bridges hairline cracks — proprietary expand & retract bond",
      "30% more solids than ordinary house paint — 30% thicker dry film",
      "Outperforms traditional paint in daily wear and weather cycles",
    ],
  },
  {
    icon: Droplets,
    title: "Breathable Moisture Barrier",
    points: [
      "Prevents trapped moisture inside the walls — reduces mold & mildew",
      "Lets the home breathe while shedding rain and humidity",
      "Defends against rain, humidity, and mildew damage",
    ],
  },
  {
    icon: Shield,
    title: "Lifetime Limited Warranty",
    points: [
      "One of the longest, most comprehensive warranties on the market",
      "Limited Lifetime Product Warranty + Best Protection Against Cracking",
      "Transferable warranty — adds value when the home sells",
    ],
  },
];

const TALKING_POINTS = [
  '"This isn\'t paint — it\'s a wall coating system. Paint reflects almost none of the sun\'s heat. Cool Life can drop your wall temperature up to 37 degrees."',
  '"30% thicker than traditional paint — that\'s why it bridges hairline cracks instead of just covering them."',
  '"It breathes — moisture escapes from the inside, but rain stays out. That\'s what prevents the mold, mildew, and peeling you\'re seeing now."',
  '"Fire-retardant. In extreme heat the coating breaks down into water and alumina — it actually slows the flame."',
  '"Lifetime transferable warranty. When you sell, this comes with the house."',
];

export default function CoolLifeBattleCardPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="card-elevated-lg p-5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 mb-3 text-left"
      >
        <Sparkles className="h-4 w-4 text-primary" />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
          Cool Life® Battle Card
        </h4>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        Lifetime Plus Coatings — Cool Life® Wall Coating System. Use on Stucco & Paint walkthroughs.
      </p>

      {open && (
        <div className="space-y-4 animate-fade-in">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-xl border border-hairline bg-muted/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <p.icon className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm font-semibold text-foreground">{p.title}</p>
              </div>
              <ul className="space-y-1.5 pl-1">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2">
                    <span className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground leading-snug">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-2">
              Homeowner Talking Points
            </p>
            <div className="space-y-2">
              {TALKING_POINTS.map((q) => (
                <p key={q} className="script-block text-xs leading-relaxed">{q}</p>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-muted/30 p-3 text-[11px] text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-1">Quick Stats</p>
            <p>• Up to <span className="font-bold text-foreground">37°F</span> cooler surface temp</p>
            <p>• Up to <span className="font-bold text-foreground">27%</span> savings on energy bills</p>
            <p>• <span className="font-bold text-foreground">30%</span> more solids / thicker film</p>
            <p>• <span className="font-bold text-foreground">Lifetime</span> transferable warranty</p>
            <p>• Made in the USA · Not sold in stores · 3rd-party tested</p>
          </div>
        </div>
      )}
    </div>
  );
}
