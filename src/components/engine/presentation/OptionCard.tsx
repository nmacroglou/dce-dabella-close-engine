import { CheckCircle2, TrendingUp, Zap, Sparkles } from "lucide-react";
import { fmt } from "@/lib/format";
import { OPTION_THEMES, FEATURES_BY_OPTION } from "./constants";
import type { ComputedValues } from "@/hooks/useCloseEngine";

interface OptionCardProps {
  optionKey: "A" | "B" | "C";
  name: string;
  price: number;
  monthly: number;
  roiPercent: number;
  computed: ComputedValues;
}

export default function OptionCard({ optionKey, name, price, monthly, roiPercent, computed }: OptionCardProps) {
  const theme = OPTION_THEMES[optionKey];
  const features = FEATURES_BY_OPTION[optionKey];
  const isHighlighted = optionKey === "A";
  const roi = Math.round(price * (roiPercent / 100));

  return (
    <div
      className={`relative rounded-3xl border-2 bg-card overflow-hidden transition-all ${
        isHighlighted
          ? `${theme.borderAccent} shadow-lg scale-[1.02]`
          : "border-border shadow-sm"
      }`}
    >
      {/* Badge */}
      <div className="absolute top-0 left-0 right-0 flex justify-center -translate-y-0">
        <span className={`${theme.badgeColor} text-xs font-bold uppercase tracking-widest px-5 py-1.5 rounded-b-xl`}>
          {theme.badge}
        </span>
      </div>

      {/* Top color bar */}
      <div className={`h-1.5 bg-gradient-to-r ${theme.gradient}`} />

      <div className="p-7 pt-10">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
          Option {optionKey}
        </p>
        <h2 className="text-xl font-extrabold text-foreground mb-5 leading-tight">{name}</h2>

        {/* Price block */}
        <div className={`rounded-2xl p-5 mb-6 ${theme.bgAccent} border ${theme.borderAccent}`}>
          <p className={`text-4xl font-extrabold ${theme.accent} mb-1`}>{fmt(price)}</p>
          <p className="text-sm text-muted-foreground">
            as low as <span className="font-bold text-foreground">{fmt(monthly)}/mo</span> with financing
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">What's included</p>
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle2 className={`h-5 w-5 flex-shrink-0 mt-0.5 ${theme.accent}`} />
              <span className="text-sm font-medium text-foreground leading-snug">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Value snapshot */}
        <div className="rounded-2xl bg-muted/60 p-4 space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Value snapshot</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Home value increase
            </span>
            <span className="text-sm font-bold text-accent">+{fmt(roi)}</span>
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
              {fmt(price - roi - computed.energySavings)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
