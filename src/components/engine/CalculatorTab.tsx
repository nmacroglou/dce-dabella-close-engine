import type { EngineTabProps, EngineState } from "@/types/engine";
import { RotateCcw } from "lucide-react";
import { PRODUCT_OPTIONS } from "@/data/products";
import { parseNum, hasProduct } from "@/lib/engineHelpers";
import { useT } from "@/contexts/LanguageContext";
import InputField from "./shared/InputField";
import OptionOutputCard from "./shared/OptionOutputCard";
import ProductAccordion from "./shared/ProductAccordion";
import WindowEstimateSection from "./calculator/WindowEstimateSection";
import FormSection from "./calculator/FormSection";
import OptionPricingRow from "./calculator/OptionPricingRow";

const OPTION_ACCENTS = { A: "text-primary", B: "text-accent", C: "text-warning" } as const;

type OptionKey = "A" | "B" | "C";

const OPTION_CONFIG: { key: OptionKey; nameKey: keyof EngineState; priceKey: keyof EngineState; desc: string }[] = [
  { key: "A", nameKey: "optionAName", priceKey: "priceA", desc: "Your best-in-class option — maximum warranties, top-tier materials, and highest home value return" },
  { key: "B", nameKey: "optionBName", priceKey: "priceB", desc: "Our most popular choice — great balance of quality, protection, and long-term value" },
  { key: "C", nameKey: "optionCName", priceKey: "priceC", desc: "The smart-budget option — solid quality that still protects your investment" },
];

export default function CalculatorTab({ state, computed, update, reset }: EngineTabProps) {
  const t = useT();
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="card-premium p-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-display font-extrabold tracking-tight">
            {t("Live", "En vivo")} <span className="gradient-text">{t("Deal Calculator", "Calculadora de Deal")}</span>
          </h3>
          {reset && (
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/60 text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-hairline hover:border-destructive/30 transition-colors text-sm font-semibold pressable"
            >
              <RotateCcw className="h-4 w-4" /> {t("Clear All", "Limpiar Todo")}
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          {t(
            "Walk through each section with your homeowner. As you enter their details together, the financing options, savings, and true cost of ownership update instantly — making the value crystal clear.",
            "Recorre cada sección con tu propietario. Al ingresar los detalles juntos, las opciones de financiamiento, los ahorros y el costo real de propiedad se actualizan al instante — dejando el valor claro como el cristal."
          )}
        </p>

        <FormSection icon="👤" title={t("Homeowner Information", "Información del propietario")} quote={t('"Let\'s start by getting your names so everything is personalized for you."', '"Empecemos con sus nombres para que todo esté personalizado para ustedes."')}>
          <div className="grid grid-cols-2 gap-5">
            <InputField label="Homeowner 1" description="The primary person on the home — this is who the proposal is addressed to" value={state.homeowner1} onChange={(v) => update("homeowner1", v)} />
            <InputField label="Homeowner 2" description="If there's a spouse or co-owner who'll be part of the decision, we include them here" value={state.homeowner2} onChange={(v) => update("homeowner2", v)} />
          </div>
        </FormSection>

        <FormSection icon="🏠" title={t("Project Details", "Detalles del Proyecto")} quote={t('"Based on our inspection, here\'s what we\'re recommending for your home."', '"Basado en nuestra inspección, esto es lo que recomendamos para su casa."')}>
          <div className="grid grid-cols-3 gap-5">
            <div className="space-y-2 col-span-3">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">{t("Products", "Productos")}</label>
              <p className="text-[11px] text-muted-foreground leading-relaxed -mt-0.5">{t("Select all systems included in this bid — roofing, windows, solar, etc.", "Selecciona todos los sistemas incluidos en esta cotización — techos, ventanas, solar, etc.")}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {PRODUCT_OPTIONS.map((p) => {
                  const selected = state.products.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        const next = selected ? state.products.filter((x) => x !== p) : [...state.products, p];
                        update("products", next.length > 0 ? next : [p]);
                      }}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all pressable ${
                        selected
                          ? "gradient-brand text-primary-foreground border-transparent shadow-[var(--shadow-glow)]"
                          : "bg-muted/50 text-muted-foreground border-hairline hover:bg-muted hover:border-hairline-strong"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
            <InputField label="Solar kW" description="How much solar power your roof can support — more kW means more energy offset and savings" value={state.solarKw} onChange={(v) => update("solarKw", v)} />
            <InputField label="Gutter Feet" description="Total linear feet of gutter guard protection — prevents clogs and extends roof life" value={state.gutterFeet} onChange={(v) => update("gutterFeet", v)} />
          </div>
        </FormSection>

        <FormSection icon="📋" title={t("System Options & Pricing", "Opciones del Sistema y Precios")} quote={t('"We put together three options so you can choose what fits best. Option A is our top-of-the-line, B is our most popular, and C is our value package."', '"Preparamos tres opciones para que elija la que mejor se ajuste. La A es la premium, la B la más popular y la C nuestro paquete de valor."')}>
          <div className="space-y-4">
            {OPTION_CONFIG.map((cfg) => (
              <OptionPricingRow key={cfg.key} optionKey={cfg.key} nameKey={cfg.nameKey} priceKey={cfg.priceKey} desc={cfg.desc} state={state} update={update} />
            ))}
          </div>
        </FormSection>

        <FormSection icon="💰" title={t("Financing Factors", "Factores de Financiamiento")} quote={t('"Here\'s the great news — you don\'t have to pay this all at once. We work with top lenders to break this into an affordable monthly investment."', '"La gran noticia — no tiene que pagar todo de una vez. Trabajamos con los mejores prestamistas para convertir esto en una inversión mensual accesible."')}>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
            <InputField label="Factor 1" description="The lender's rate that converts your total into a monthly payment — a lower factor means a lower monthly cost" value={state.financingFactor1} onChange={(v) => update("financingFactor1", parseNum(v))} type="number" />
            <InputField label="Factor 2" description="An alternate financing rate — we'll show you which one gives you the best monthly payment" value={state.financingFactor2} onChange={(v) => update("financingFactor2", parseNum(v))} type="number" />
            <InputField
              label="Credit Score"
              description="Optional (300–850). Auto-sets Factor 2: ≥720 → .0108, 640–719 → .012, <640 → .015."
              value={state.creditScore ?? ""}
              onChange={(v) => {
                const n = parseInt(v, 10);
                const score = Number.isFinite(n) ? n : null;
                update("creditScore", score);
                if (score !== null) {
                  const auto = score >= 720 ? 0.0108 : score >= 640 ? 0.012 : 0.015;
                  update("financingFactor2", auto);
                }
              }}
              type="number"
            />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick credit presets — sets Factor 2</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Great credit", factor: 0.0108, hint: "Top-tier APR" },
                { label: "OK credit / 6-mo deferral", factor: 0.012, hint: "Mid-tier or short deferral" },
                { label: "Bad credit + 1–2 yr deferral", factor: 0.015, hint: "Subprime or long deferral" },
              ].map((p) => {
                const active = Math.abs((state.financingFactor2 ?? 0) - p.factor) < 1e-6;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => update("financingFactor2", p.factor)}
                    title={p.hint}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all touch-target ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/60"
                    }`}
                  >
                    {p.label} <span className="opacity-75 ml-1">{p.factor.toFixed(4)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </FormSection>

        <FormSection icon="🏷️" title={t("Promotional Discounts", "Descuentos Promocionales")} quote={t('"Because you\'re working with us today, you qualify for some special promotions that can lower your price or your monthly payment."', '"Por trabajar con nosotros hoy, califican para promociones especiales que reducen el precio o el pago mensual."')}>
          <div className="grid grid-cols-2 gap-5 mb-5">
            <InputField label="Efficiency Discount ($)" description="A dollar-off incentive for choosing energy-efficient upgrades — this comes right off the top of your price" value={state.efficiencyDiscount} onChange={(v) => update("efficiencyDiscount", parseNum(v))} type="number" />
            <InputField label="Standby Discount ($)" description="A loyalty discount for being ready to move forward — we pass manufacturer savings directly to you" value={state.standbyDiscount} onChange={(v) => update("standbyDiscount", parseNum(v))} type="number" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <InputField label="6 Month Deferred (%)" description="No payments for 6 months — the price adjusts slightly, but you get breathing room before your first payment" value={state.deferred6Pct} onChange={(v) => update("deferred6Pct", parseNum(v))} type="number" />
            <InputField label="12 Month Deferred (%)" description="No payments for a full year — enjoy your new system now and start paying later with a small price adjustment" value={state.deferred12Pct} onChange={(v) => update("deferred12Pct", parseNum(v))} type="number" />
          </div>
        </FormSection>

        <FormSection icon="⚡" title={t("Value & Energy Analysis", "Análisis de Valor y Energía")} quote={t('"Now let\'s look at what this does for you long-term. This isn\'t just a cost — it\'s an investment that pays you back."', '"Ahora veamos qué hace esto por ustedes a largo plazo. No es solo un costo — es una inversión que les paga de regreso."')} className="">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <InputField label="ROI %" description="Studies show home improvements like this increase your home's resale value by this percentage of the project cost" value={state.roiPercent} onChange={(v) => update("roiPercent", parseNum(v))} type="number" />
            <InputField label="Monthly Energy Bill" description="What you're currently paying each month for electricity — this is the baseline we'll use to calculate your savings" value={state.monthlyBill} onChange={(v) => update("monthlyBill", parseNum(v))} type="number" />
            <InputField label="Energy Savings %" description="The estimated percentage your energy bill drops after installation — most homeowners see 50–80% reduction" value={state.energySavingsPct} onChange={(v) => update("energySavingsPct", parseNum(v))} type="number" />
            <InputField label="Down Payment ($)" description="Any amount you'd like to put down upfront — this reduces the financed balance and lowers your monthly payment" value={state.downPayment} onChange={(v) => update("downPayment", parseNum(v))} type="number" />
          </div>
        </FormSection>

        {hasProduct(state.products, "Windows") && (
          <ProductAccordion title={t("🪟 Window Estimate", "🪟 Estimado de Ventanas")} defaultOpen>
            <WindowEstimateSection state={state} update={update} />
          </ProductAccordion>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {(["A", "B", "C"] as const).map((key) => (
          <OptionOutputCard
            key={key}
            label={`${t("Option", "Opción")} ${key}`}
            name={state[`option${key}Name` as keyof typeof state] as string}
            opt={computed.options[key]}
            energySavings={computed.energySavings}
            accent={OPTION_ACCENTS[key]}
            financingFactor={state.financingFactor2}
            downPayment={state.downPayment}
            creditScore={state.creditScore}
          />
        ))}
      </div>
    </div>
  );
}
