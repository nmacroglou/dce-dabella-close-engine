import { useEffect, useRef, useState } from "react";
import { CheckCircle2, TrendingUp, Zap, Sparkles, Pencil, Check, X } from "lucide-react";
import { fmt } from "@/lib/format";
import { OPTION_THEMES, getFeaturesForOption, type RoofMaterial } from "./constants";
import type { ComputedValues } from "@/types/engine";
import { useT } from "@/contexts/LanguageContext";

interface OptionCardProps {
  optionKey: "A" | "B" | "C";
  name: string;
  computed: ComputedValues;
  selected?: boolean;
  onClick?: () => void;
  customFeatures?: string[];
  products?: string[];
  roofMaterial?: RoofMaterial;
  originalPrice?: number;
  discountPct?: number;
  monthlyOverride?: number;
  onMonthlyChange?: (next: number | undefined) => void;
}

export default function OptionCard({ optionKey, name, computed, selected, onClick, customFeatures, products, roofMaterial, originalPrice, discountPct, monthlyOverride, onMonthlyChange }: OptionCardProps) {
  const t = useT();
  const theme = OPTION_THEMES[optionKey];
  const features = getFeaturesForOption(products, roofMaterial, customFeatures, optionKey);
  const isHighlighted = optionKey === "A";
  const opt = computed.options[optionKey];
  const showStrike = !!discountPct && !!originalPrice && originalPrice > opt.price;
  const displayMonthly = monthlyOverride ?? opt.monthly;
  const editable = !!onMonthlyChange;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(displayMonthly));
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!editing) setDraft(String(displayMonthly)); }, [displayMonthly, editing]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  const commit = () => {
    const n = Math.round(Number(draft.replace(/[^0-9.]/g, "")));
    if (Number.isFinite(n) && n > 0) onMonthlyChange?.(n === Math.round(opt.monthly) ? undefined : n);
    setEditing(false);
  };
  const cancel = () => { setDraft(String(displayMonthly)); setEditing(false); };
  const reset = (e: React.MouseEvent) => { e.stopPropagation(); onMonthlyChange?.(undefined); };

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-3xl border bg-card overflow-hidden transition-all duration-500 ${onClick ? "cursor-pointer pressable" : ""} ${
        selected
          ? `ring-4 ring-primary/40 ${theme.borderAccent} shadow-[var(--shadow-xl)] scale-[1.03] animate-scale-in`
          : isHighlighted
            ? `${theme.borderAccent} shadow-[var(--shadow-lg)] scale-[1.02] hover:-translate-y-1`
            : "border-hairline shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-hairline-strong hover:-translate-y-0.5"
      }`}
    >
      {/* Selected — premium ambient glow */}
      {selected && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-3xl"
          style={{
            background:
              "radial-gradient(60% 80% at 50% 0%, hsl(var(--primary) / 0.18), transparent 60%), radial-gradient(60% 80% at 50% 100%, hsl(var(--accent) / 0.14), transparent 60%)",
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* Inner highlight sheen */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: "linear-gradient(135deg, hsl(var(--foreground) / 0.05) 0%, transparent 35%)" }} />

      {/* Badge */}
      <div className="absolute top-0 left-0 right-0 flex justify-center z-10">
        <span
          className={`${theme.badgeColor} text-[10px] font-black uppercase tracking-[0.15em] px-5 py-1.5 rounded-b-xl shadow-md`}
        >
          {theme.badge}
        </span>
      </div>

      {/* Top gradient bar */}
      <div className={`h-1.5 bg-gradient-to-r ${theme.gradient}`} />

      <div className="p-7 pt-10 relative">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-1">
          {t("Option", "Opción")} {optionKey}
        </p>
        <h2 className="text-xl font-display font-extrabold text-foreground mb-5 leading-tight">
          {name}
        </h2>

        {/* Price */}
        <div className={`relative rounded-2xl p-6 mb-6 ${theme.bgAccent} border ${theme.borderAccent} overflow-hidden`}>
          <div aria-hidden className="absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl opacity-40"
            style={{ background: `linear-gradient(135deg, hsl(var(--primary) / 0.4), transparent)` }} />

          {/* Total price */}
          <p className="relative text-[10px] font-bold text-muted-foreground uppercase tracking-[0.18em] mb-1.5">
            {t("Total investment", "Inversión total")}
          </p>
          {showStrike && (
            <div className="flex items-center gap-2 mb-1 relative">
              <p className="text-base font-bold text-muted-foreground line-through num">{fmt(originalPrice!)}</p>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-accent-foreground shadow-sm">
                −{discountPct}%
              </span>
            </div>
          )}
          <p className={`relative text-[2.75rem] leading-[1.05] font-extrabold ${theme.accent} tracking-[-0.02em] num-display`}>{fmt(opt.price)}</p>

          {/* Divider */}
          <div className="relative my-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Monthly */}
          <div className="relative">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.18em] mb-1.5">
              {t("As low as", "Desde solo")}
            </p>
            <div className="flex items-baseline gap-3 flex-wrap">
              {editing ? (
                <span className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <span className="font-extrabold text-foreground text-3xl tracking-tight">$</span>
                  <input
                    ref={inputRef}
                    type="number"
                    inputMode="decimal"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); commit(); }
                      if (e.key === "Escape") { e.preventDefault(); cancel(); }
                    }}
                    onBlur={commit}
                    className="w-36 rounded-md border border-hairline bg-background px-2 py-0.5 text-3xl font-extrabold text-foreground tracking-tight focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button type="button" onClick={commit} className="p-1 rounded text-accent hover:bg-accent/10" aria-label="Save">
                    <Check className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={cancel} className="p-1 rounded text-muted-foreground hover:bg-muted" aria-label="Cancel">
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); if (editable) setEditing(true); }}
                  disabled={!editable}
                  className={`inline-flex items-baseline gap-1.5 ${editable ? "hover:bg-muted/60 rounded-lg px-1.5 -mx-1.5 py-0.5 cursor-text" : "cursor-default"}`}
                  title={editable ? "Tap to adjust monthly payment" : undefined}
                >
                  <span className="text-3xl font-extrabold text-foreground tracking-[-0.02em] num-display leading-none">
                    {fmt(displayMonthly)}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">/mo</span>
                  {editable && <Pencil className="h-3.5 w-3.5 opacity-40 self-center ml-0.5" />}
                </button>
              )}
              <span className="text-xs font-medium text-muted-foreground">{t("with financing", "con financiamiento")}</span>
              {monthlyOverride !== undefined && editable && !editing && (
                <button type="button" onClick={reset} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground underline underline-offset-2">
                  reset
                </button>
              )}
            </div>
          </div>

          {showStrike && (
            <div className="relative mt-4 pt-3 border-t border-accent/30 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-accent">{t("You save", "Usted ahorra")}</span>
              <span className="text-lg font-extrabold text-accent num-display">{fmt(originalPrice! - opt.price)}</span>
            </div>
          )}
        </div>


        {/* Features */}
        <div className="space-y-2.5 mb-6">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
            {t("What's included", "Qué se incluye")}
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
          <ValueLine icon={TrendingUp} label="Home value increase" value={`+${fmt(opt.roiValue)}`} />
          <ValueLine icon={Zap} label="10-yr energy savings" value={`+${fmt(computed.energySavings)}`} />
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Net effective cost
              </span>
              <span className="text-[10px] text-muted-foreground">Price minus home value gain & energy savings</span>
            </div>
            <span className="text-base font-extrabold text-primary">{fmt(opt.netCost)}</span>
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
