import { Sparkles, Heart, PartyPopper, Shield, Award } from "lucide-react";
import dabellaLogo from "@/assets/dabella-logo.png";

interface Props {
  homeowner1: string;
  homeowner2: string;
}

const PERKS = [
  { icon: Shield, top: "Lifetime", bottom: "Warranty" },
  { icon: Heart, top: "5-Star", bottom: "Service" },
  { icon: Award, top: "Expert", bottom: "Install" },
];

export default function WelcomeClose({ homeowner1, homeowner2 }: Props) {
  const names = homeowner2 ? `${homeowner1} & ${homeowner2}` : homeowner1;

  return (
    <div className="max-w-3xl mx-auto animate-scale-in">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent shadow-2xl">
        {/* Decorative glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-48 w-48 rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>

        <div className="relative z-10 px-10 py-16 space-y-10">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="bg-primary-foreground/20 backdrop-blur-sm rounded-2xl p-4">
              <img src={dabellaLogo} alt="DaBella" className="h-14 w-auto" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <PartyPopper className="h-8 w-8 text-warning" />
              <h2 className="text-4xl font-display font-extrabold text-primary-foreground tracking-tight">
                Welcome to the Family!
              </h2>
              <PartyPopper className="h-8 w-8 text-warning" />
            </div>
            <p className="text-xl text-primary-foreground/90 font-medium max-w-lg mx-auto leading-relaxed">
              {names}, congratulations on investing in your home's future. We're honored to earn
              your trust.
            </p>
          </div>

          {/* Perk cards */}
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            {PERKS.map(({ icon: Icon, top, bottom }) => (
              <div
                key={top}
                className="bg-primary-foreground/15 backdrop-blur-sm rounded-2xl p-5 text-center space-y-2"
              >
                <Icon className="h-6 w-6 text-warning mx-auto" />
                <p className="text-[10px] font-bold text-primary-foreground/70 uppercase tracking-[0.15em]">
                  {top}
                </p>
                <p className="text-sm font-bold text-primary-foreground">{bottom}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-primary-foreground/50 font-medium italic text-center">
            "We don't just build homes — we build relationships."
          </p>
        </div>
      </div>
    </div>
  );
}
