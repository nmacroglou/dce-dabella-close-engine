import { memo } from "react";
import type { ComputedValues, EngineState } from "@/types/engine";
import TCloseBoard from "./TCloseBoard";
import FinancialImpactPanel from "./FinancialImpactPanel";

interface FinancialImpactProps {
  state: EngineState;
  computed: ComputedValues;
}

export default memo(function FinancialImpact({ state, computed }: FinancialImpactProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <TCloseBoard state={state} computed={computed} />
      <FinancialImpactPanel state={state} computed={computed} />
    </div>
  );
});
