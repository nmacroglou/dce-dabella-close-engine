import { memo } from "react";
import type { EngineState } from "@/types/engine";
import { parseNum } from "@/lib/engineHelpers";
import InputField from "../shared/InputField";
import { Checkbox } from "@/components/ui/checkbox";

type OptionKey = "A" | "B" | "C";

interface OptionPricingRowProps {
  optionKey: OptionKey;
  nameKey: keyof EngineState;
  priceKey: keyof EngineState;
  desc: string;
  state: EngineState;
  update: <K extends keyof EngineState>(k: K, v: EngineState[K]) => void;
}

/** A/B/C system-name + total-price row used in the Calculator. */
export default memo(function OptionPricingRow({
  optionKey,
  nameKey,
  priceKey,
  desc,
  state,
  update,
}: OptionPricingRowProps) {
  const stickyKey = `stickyOption${optionKey}Name` as
    | "stickyOptionAName"
    | "stickyOptionBName"
    | "stickyOptionCName";
  const sticky = (state[stickyKey] ?? true) as boolean;

  return (
    <div className="grid grid-cols-3 gap-5 items-end">
      <div className="col-span-2 space-y-2">
        <InputField
          label={`Option ${optionKey} — System Name`}
          description={desc}
          value={state[nameKey] as string}
          onChange={(v) => update(nameKey as "optionAName", v as EngineState["optionAName"])}
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <Checkbox
            checked={sticky}
            onCheckedChange={(c) => update(stickyKey, (c === true) as EngineState["stickyOptionAName"])}
          />
          <span>
            Auto-fill from selected product
            {!sticky && <span className="ml-1 text-primary font-medium">(custom)</span>}
          </span>
        </label>
      </div>
      <InputField
        label={`Total Price ${optionKey}`}
        description="The full installed price including labor, materials, and warranties — before any promotions"
        value={state[priceKey] as number}
        onChange={(v) => update(priceKey as "priceA", parseNum(v) as EngineState["priceA"])}
        type="number"
      />
    </div>
  );
});
