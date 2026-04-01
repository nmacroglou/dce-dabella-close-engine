import { Sparkles, Heart, PartyPopper } from "lucide-react";
import dabellaLogo from "@/assets/dabella-logo.png";

interface Props {
  homeowner1: string;
  homeowner2: string;
}

export default function WelcomeClose({ homeowner1, homeowner2 }: Props) {
  const names = homeowner2 ? `${homeowner1} & ${homeowner2}` : homeowner1;

  return (
    <div className="max-w-3xl mx-auto text-center">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent shadow-2xl">
        {/* Decorative dots */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-8 h-32 w-32 rounded-full bg-primary-foreground blur-3xl" />
          <div className="absolute bottom-8 right-8 h-40 w-40 rounded-full bg-primary-foreground blur-3xl" />
        </div>

        <div className="relative z-10 px-10 py-16 space-y-8">
          <div className="flex justify-center">
            <div className="bg-primary-foreground/20 backdrop-blur-sm rounded-2xl p-4">
              <img src={dabellaLogo} alt="DaBella" className="h-14 w-auto" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <PartyPopper className="h-8 w-8 text-warning" />
              <h2 className="text-4xl font-extrabold text-primary-foreground tracking-tight">
                Welcome to the Family!
              </h2>
              <PartyPopper className="h-8 w-8 text-warning" />
            </div>
            <p className="text-xl text-primary-foreground/90 font-medium max-w-lg mx-auto leading-relaxed">
              {names}, congratulations on investing in your home's future. We're honored to earn your trust.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-2xl p-4 space-y-1">
              <Sparkles className="h-6 w-6 text-warning mx-auto" />
              <p className="text-xs font-bold text-primary-foreground/80 uppercase tracking-widest">Lifetime</p>
              <p className="text-sm font-bold text-primary-foreground">Warranty</p>
            </div>
            <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-2xl p-4 space-y-1">
              <Heart className="h-6 w-6 text-destructive mx-auto" />
              <p className="text-xs font-bold text-primary-foreground/80 uppercase tracking-widest">5-Star</p>
              <p className="text-sm font-bold text-primary-foreground">Service</p>
            </div>
            <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-2xl p-4 space-y-1">
              <Sparkles className="h-6 w-6 text-accent-foreground mx-auto" />
              <p className="text-xs font-bold text-primary-foreground/80 uppercase tracking-widest">Expert</p>
              <p className="text-sm font-bold text-primary-foreground">Install</p>
            </div>
          </div>

          <p className="text-sm text-primary-foreground/60 font-medium italic">
            "We don't just build homes — we build relationships."
          </p>
        </div>
      </div>
    </div>
  );
}
