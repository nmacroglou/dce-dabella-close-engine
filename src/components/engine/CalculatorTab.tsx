import { useState } from "react";
import type { EngineTabProps, EngineState } from "@/types/engine";
import { RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
import { PRODUCT_OPTIONS } from "@/data/products";
import { fmt } from "@/lib/format";
import { parseNum, hasProduct } from "@/lib/engineHelpers";
import InputField from "./shared/InputField";
import OptionOutputCard from "./shared/OptionOutputCard";
import WindowEstimateSection from "./calculator/WindowEstimateSection";

const OPTION_ACCENTS = { A: "text-primary", B: "text-accent", C: "text-warning" } as const;

type OptionKey = "A" | "B" | "C";

const OPTION_CONFIG: { key: OptionKey; nameKey: keyof EngineState; priceKey: keyof EngineState; desc: string }[] = [
  { key: "A", nameKey: "optionAName", priceKey: "priceA", desc: "Your best-in-class option — maximum warranties, top-tier materials, and highest home value return" },
  { key: "B", nameKey: "optionBName", priceKey: "priceB", desc: "Our most popular choice — great balance of quality, protection, and long-term value" },
  { key: "C", nameKey: "optionCName", priceKey: "priceC", desc: "The smart-budget option — solid quality that still protects your investment" },
];

export default function CalculatorTab({ state, computed, update, reset }: EngineTabProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Inputs */}
      <div className="card-elevated-lg p-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-foreground">Live Deal Calculator</h3>
          {reset && (
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-border transition-colors text-sm font-semibold"
            >
              <RotateCcw className="h-4 w-4" /> Clear All
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          Walk through each section with your homeowner. As you enter their details together, the financing options, savings, and true cost of ownership update instantly — making the value crystal clear.
        </p>

        {/* Homeowners */}
        <div className="mb-8">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
            👤 Homeowner Information
          </h4>
          <p className="text-[11px] text-muted-foreground mb-4">
            "Let's start by getting your names so everything is personalized for you."
          </p>
          <div className="grid grid-cols-2 gap-5">
            <InputField
              label="Homeowner 1"
              description="The primary person on the home — this is who the proposal is addressed to"
              value={state.homeowner1}
              onChange={(v) => update("homeowner1", v)}
            />
            <InputField
              label="Homeowner 2"
              description="If there's a spouse or co-owner who'll be part of the decision, we include them here"
              value={state.homeowner2}
              onChange={(v) => update("homeowner2", v)}
            />
          </div>
        </div>

        {/* Project Details */}
        <div className="mb-8">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
            🏠 Project Details
          </h4>
          <p className="text-[11px] text-muted-foreground mb-4">
            "Based on our inspection, here's what we're recommending for your home."
          </p>
          <div className="grid grid-cols-3 gap-5">
            <div className="space-y-2 col-span-3">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Products</label>
              <p className="text-[11px] text-muted-foreground leading-relaxed -mt-0.5">Select all systems included in this bid — roofing, windows, solar, etc.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {PRODUCT_OPTIONS.map((p) => {
                  const selected = state.products.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        const next = selected
                          ? state.products.filter((x) => x !== p)
                          : [...state.products, p];
                        update("products", next.length > 0 ? next : [p]);
                      }}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
            <InputField
              label="Solar kW"
              description="How much solar power your roof can support — more kW means more energy offset and savings"
              value={state.solarKw}
              onChange={(v) => update("solarKw", v)}
            />
            <InputField
              label="Gutter Feet"
              description="Total linear feet of gutter guard protection — prevents clogs and extends roof life"
              value={state.gutterFeet}
              onChange={(v) => update("gutterFeet", v)}
            />
          </div>
        </div>

        {/* Options A/B/C */}
        <div className="mb-8">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
            📋 System Options & Pricing
          </h4>
          <p className="text-[11px] text-muted-foreground mb-4">
            "We put together three options so you can choose what fits best. Option A is our top-of-the-line, B is our most popular, and C is our value package. Let me show you the difference."
          </p>
          <div className="space-y-4">
            {OPTION_CONFIG.map(({ key, nameKey, priceKey, desc }) => (
              <div key={key} className="grid grid-cols-3 gap-5 items-end">
                <div className="col-span-2">
                  <InputField
                    label={`Option ${key} — System Name`}
                    description={desc}
                    value={state[nameKey] as string}
                    onChange={(v) => update(nameKey as "optionAName", v)}
                  />
                </div>
                <InputField
                  label={`Total Price ${key}`}
                  description="The full installed price including labor, materials, and warranties — before any promotions"
                  value={state[priceKey] as number}
                  onChange={(v) => update(priceKey as "priceA", parseNum(v))}
                  type="number"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Financing */}
        <div className="mb-8">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
            💰 Financing Factors
          </h4>
          <p className="text-[11px] text-muted-foreground mb-4">
            "Here's the great news — you don't have to pay this all at once. We work with top lenders to break this into an affordable monthly investment."
          </p>
          <div className="grid grid-cols-2 gap-5">
            <InputField
              label="Factor 1"
              description="The lender's rate that converts your total into a monthly payment — a lower factor means a lower monthly cost"
              value={state.financingFactor1}
              onChange={(v) => update("financingFactor1", parseNum(v))}
              type="number"
            />
            <InputField
              label="Factor 2"
              description="An alternate financing rate — we'll show you which one gives you the best monthly payment"
              value={state.financingFactor2}
              onChange={(v) => update("financingFactor2", parseNum(v))}
              type="number"
            />
          </div>
        </div>

        {/* Promo Discounts */}
        <div className="mb-8">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
            🏷️ Promotional Discounts
          </h4>
          <p className="text-[11px] text-muted-foreground mb-4">
            "Because you're working with us today, you qualify for some special promotions that can lower your price or your monthly payment."
          </p>
          <div className="grid grid-cols-2 gap-5 mb-5">
            <InputField
              label="Efficiency Discount ($)"
              description="A dollar-off incentive for choosing energy-efficient upgrades — this comes right off the top of your price"
              value={state.efficiencyDiscount}
              onChange={(v) => update("efficiencyDiscount", parseNum(v))}
              type="number"
            />
            <InputField
              label="Standby Discount ($)"
              description="A loyalty discount for being ready to move forward — we pass manufacturer savings directly to you"
              value={state.standbyDiscount}
              onChange={(v) => update("standbyDiscount", parseNum(v))}
              type="number"
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <InputField
              label="6 Month Deferred (%)"
              description="No payments for 6 months — the price adjusts slightly, but you get breathing room before your first payment"
              value={state.deferred6Pct}
              onChange={(v) => update("deferred6Pct", parseNum(v))}
              type="number"
            />
            <InputField
              label="12 Month Deferred (%)"
              description="No payments for a full year — enjoy your new system now and start paying later with a small price adjustment"
              value={state.deferred12Pct}
              onChange={(v) => update("deferred12Pct", parseNum(v))}
              type="number"
            />
          </div>
        </div>

        {/* Value & Energy */}
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
            ⚡ Value & Energy Analysis
          </h4>
          <p className="text-[11px] text-muted-foreground mb-4">
            "Now let's look at what this does for you long-term. This isn't just a cost — it's an investment that pays you back."
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <InputField
              label="ROI %"
              description="Studies show home improvements like this increase your home's resale value by this percentage of the project cost"
              value={state.roiPercent}
              onChange={(v) => update("roiPercent", parseNum(v))}
              type="number"
            />
            <InputField
              label="Monthly Energy Bill"
              description="What you're currently paying each month for electricity — this is the baseline we'll use to calculate your savings"
              value={state.monthlyBill}
              onChange={(v) => update("monthlyBill", parseNum(v))}
              type="number"
            />
            <InputField
              label="Energy Savings %"
              description="The estimated percentage your energy bill drops after installation — most homeowners see 50–80% reduction"
              value={state.energySavingsPct}
              onChange={(v) => update("energySavingsPct", parseNum(v))}
              type="number"
            />
            <InputField
              label="Down Payment ($)"
              description="Any amount you'd like to put down upfront — this reduces the financed balance and lowers your monthly payment"
              value={state.downPayment}
              onChange={(v) => update("downPayment", parseNum(v))}
              type="number"
            />
          </div>
        </div>

        {/* Windows Estimate — only when Windows is selected */}
        {state.product === "Windows" && (
          <div className="mt-8 pt-8 border-t border-border">
            <WindowEstimateSection state={state} update={update} />
          </div>
        )}
      </div>

      {/* Output: 3 option cards side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {(["A", "B", "C"] as const).map((key) => (
          <OptionOutputCard
            key={key}
            label={`Option ${key}`}
            name={state[`option${key}Name` as keyof typeof state] as string}
            opt={computed.options[key]}
            energySavings={computed.energySavings}
            accent={OPTION_ACCENTS[key]}
          />
        ))}
      </div>
    </div>
  );
}
