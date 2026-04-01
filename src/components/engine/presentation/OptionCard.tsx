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
  const netCost = price - roi - computed.energySavings;

  return (
    <div
      className={`relative rounded-3xl border-2 bg-card overflow-hidden transition-all ${
        isHighlighted
          ? `${theme.borderAccent} shadow-xl scale-[1.02]`
          : "border-border shadow-sm hover:shadow-md"
      }`}
    >
      {/* Badge */}
      <div className="absolute top-0 left-0 right-0 flex justify-center">
        <span
          className={`${theme.badgeColor} text-[10px] font-black uppercase tracking-[0.15em] px-5 py-1.5 rounded-b-xl`}
        >
          {theme.badge}
        </span>
      </div>

      {/* Top gradient bar */}
      <div className={`h-1.5 bg-gradient-to-r ${theme.gradient}`} />

      <div className="p-7 pt-10">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-1">
          Option {optionKey}
        </p>
        <h2 className="text-xl font-display font-extrabold text-foreground mb-5 leading-tight">
          {name}
        </h2>

        {/* Price */}
        <div className={`rounded-2xl p-5 mb-6 ${theme.bgAccent} border ${theme.borderAccent}`}>
          <p className={`text-4xl font-extrabold ${theme.accent} mb-1 tracking-tight`}>{fmt(price)}</p>
          <p className="text-sm text-muted-foreground">
            as low as <span className="font-bold text-foreground">{fmt(monthly)}/mo</span> with financing
          </p>
        </div>

        {/* Features */}
        <div className="space-y-2.5 mb-6">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
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
        <div className="rounded-2xl bg-muted/60 p-4 space-y-2.5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
            Value snapshot
          </p>
          <ValueLine icon={TrendingUp} label="Home value increase" value={`+${fmt(roi)}`} />
          <ValueLine icon={Zap} label="10-yr energy savings" value={`+${fmt(computed.energySavings)}`} />
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Net effective cost
            </span>
            <span className="text-base font-extrabold text-primary">{fmt(netCost)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ValueLine({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span className="text-sm font-bold text-accent">{value}</span>
    </div>
  );
}
