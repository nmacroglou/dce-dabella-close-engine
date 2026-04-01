import { EngineState } from "@/hooks/useCloseEngine";
import { X, Shield, Zap, Home, Star, CheckCircle2, Award, TrendingUp, Sparkles } from "lucide-react";
import dabellaLogo from "@/assets/dabella-logo.png";

interface Props {
  state: EngineState;
  computed: any;
  onClose: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const OPTION_THEMES = {
  A: {
    gradient: "from-primary to-primary/80",
    badge: "Best Value",
    badgeColor: "bg-primary text-primary-foreground",
    ring: "ring-primary",
    accent: "text-primary",
    bgAccent: "bg-primary/5",
    borderAccent: "border-primary/20",
  },
  B: {
    gradient: "from-accent to-accent/80",
    badge: "Most Popular",
    badgeColor: "bg-accent text-accent-foreground",
    ring: "ring-accent",
    accent: "text-accent",
    bgAccent: "bg-accent/5",
    borderAccent: "border-accent/20",
  },
  C: {
    gradient: "from-warning to-warning/80",
    badge: "Smart Start",
    badgeColor: "bg-warning text-warning-foreground",
    ring: "ring-warning",
    accent: "text-foreground",
    bgAccent: "bg-warning/5",
    borderAccent: "border-warning/20",
  },
};

const FEATURES_BY_OPTION: Record<string, { icon: typeof Shield; text: string }[]> = {
  A: [
    { icon: Shield, text: "Lifetime manufacturer warranty" },
    { icon: Zap, text: "Maximum energy efficiency" },
    { icon: Home, text: "Full system replacement" },
    { icon: Star, text: "Premium materials & installation" },
    { icon: Award, text: "Highest home value increase" },
    { icon: TrendingUp, text: "Best long-term ROI" },
  ],
  B: [
    { icon: Shield, text: "Manufacturer warranty included" },
    { icon: Home, text: "Complete system upgrade" },
    { icon: Star, text: "High-quality materials" },
    { icon: Award, text: "Strong home value increase" },
    { icon: TrendingUp, text: "Excellent ROI potential" },
  ],
  C: [
    { icon: Shield, text: "Standard manufacturer warranty" },
    { icon: Home, text: "Essential system coverage" },
    { icon: Star, text: "Quality materials" },
    { icon: TrendingUp, text: "Solid ROI potential" },
  ],
};

export default function CustomerPresentationView({ state, computed, onClose }: Props) {
  const options = [
    {
      key: "A" as const,
      name: state.optionAName,
      price: state.priceA,
      monthly: computed.monthlyA,
      roi: Math.round(state.priceA * (state.roiPercent / 100)),
    },
    {
      key: "B" as const,
      name: state.optionBName,
      price: state.priceB,
      monthly: computed.monthlyB,
      roi: Math.round(state.priceB * (state.roiPercent / 100)),
    },
    {
      key: "C" as const,
      name: state.optionCName,
      price: state.priceC,
      monthly: computed.monthlyC,
      roi: Math.round(state.priceC * (state.roiPercent / 100)),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto animate-fade-in">
      {/* Close button — rep only */}
      <button
        onClick={onClose}
        className="fixed top-5 right-5 z-50 rounded-full bg-card border border-border shadow-md p-2.5 hover:bg-muted transition-colors"
        aria-label="Close"
      >
        <X className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* Header */}
      <header className="text-center pt-10 pb-8 px-6">
        <img src={dabellaLogo} alt="DaBella" className="h-12 w-auto mx-auto mb-5" />
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
          Your {state.product} Options
        </h1>
        <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {state.homeowner1}{state.homeowner2 ? ` & ${state.homeowner2}` : ""}, here's a
          side-by-side look at three tailored options for your home.
        </p>
      </header>

      {/* Options Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {options.map((opt) => {
            const theme = OPTION_THEMES[opt.key];
            const features = FEATURES_BY_OPTION[opt.key];
            const isHighlighted = opt.key === "A";

            return (
              <div
                key={opt.key}
                className={`relative rounded-3xl border-2 bg-card overflow-hidden transition-all ${
                  isHighlighted
                    ? `${theme.borderAccent} shadow-lg scale-[1.02]`
                    : "border-border shadow-sm"
                }`}
              >
                {/* Badge */}
                <div className="absolute top-0 left-0 right-0 flex justify-center -translate-y-0">
                  <span
                    className={`${theme.badgeColor} text-xs font-bold uppercase tracking-widest px-5 py-1.5 rounded-b-xl`}
                  >
                    {theme.badge}
                  </span>
                </div>

                {/* Top color bar */}
                <div className={`h-1.5 bg-gradient-to-r ${theme.gradient}`} />

                <div className="p-7 pt-10">
                  {/* Option label */}
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                    Option {opt.key}
                  </p>
                  <h2 className="text-xl font-extrabold text-foreground mb-5 leading-tight">
                    {opt.name}
                  </h2>

                  {/* Price block */}
                  <div className={`rounded-2xl p-5 mb-6 ${theme.bgAccent} border ${theme.borderAccent}`}>
                    <p className={`text-4xl font-extrabold ${theme.accent} mb-1`}>
                      {fmt(opt.price)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      as low as <span className="font-bold text-foreground">{fmt(opt.monthly)}/mo</span> with financing
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      What's included
                    </p>
                    {features.map((f, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className={`h-5 w-5 flex-shrink-0 mt-0.5 ${theme.accent}`} />
                        <span className="text-sm font-medium text-foreground leading-snug">{f.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Value snapshot */}
                  <div className="rounded-2xl bg-muted/60 p-4 space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Value snapshot
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Home value increase
                      </span>
                      <span className="text-sm font-bold text-accent">+{fmt(opt.roi)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Zap className="h-4 w-4" /> 10-yr energy savings
                      </span>
                      <span className="text-sm font-bold text-accent">+{fmt(computed.energySavings)}</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" /> Net effective cost
                      </span>
                      <span className="text-base font-extrabold text-primary">
                        {fmt(opt.price - opt.roi - computed.energySavings)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom trust bar */}
      <div className="max-w-4xl mx-auto px-6 pb-10">
        <div className="rounded-2xl bg-muted/50 border border-border p-6 text-center">
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <TrustItem icon={Shield} text="Lifetime Warranty Protection" />
            <TrustItem icon={Award} text="GAF Master Elite Certified" />
            <TrustItem icon={Star} text="Top-Rated Installation Crews" />
            <TrustItem icon={Home} text="Locally Owned & Operated" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustItem({ icon: Icon, text }: { icon: typeof Shield; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-sm font-semibold text-foreground">{text}</span>
    </div>
  );
}
