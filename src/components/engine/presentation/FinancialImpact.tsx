import { memo } from "react";
import { ComputedValues, EngineState } from "@/hooks/useCloseEngine";
import { Scale, TrendingUp } from "lucide-react";
import { fmt } from "@/lib/format";

interface FinancialImpactProps {
  state: EngineState;
  computed: ComputedValues;
}

export default memo(function FinancialImpact({ state, computed }: FinancialImpactProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="card-elevated-lg p-6">
        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" /> T-close board
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-accent/10 p-4 text-center">
            <p className="text-xs font-semibold text-accent uppercase mb-1">YES</p>
            <p className="text-xl font-extrabold text-foreground">{fmt(computed.selectedPrice || state.priceA)}</p>
            <p className="text-xs text-muted-foreground mt-1">DaBella roof</p>
          </div>
          <div className="rounded-xl bg-destructive/10 p-4 text-center">
            <p className="text-xs font-semibold text-destructive uppercase mb-1">NO</p>
            <p className="text-xl font-extrabold text-foreground">$0</p>
            <p className="text-xs text-muted-foreground mt-1">Do nothing</p>
          </div>
        </div>
      </div>

      <div className="card-elevated-lg p-6">
        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" /> 10-year financial impact
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 font-medium text-muted-foreground"></th>
              <th className="text-center py-2 font-semibold text-accent text-xs">Move Forward</th>
              <th className="text-center py-2 font-semibold text-destructive text-xs">Do Nothing</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50">
              <td className="py-2 font-medium text-foreground">ROI</td>
              <td className="py-2 text-center font-semibold text-accent">+{fmt(computed.roiValue)}</td>
              <td className="py-2 text-center text-muted-foreground">$0</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 font-medium text-foreground">Energy</td>
              <td className="py-2 text-center font-semibold text-accent">+{fmt(computed.energySavings)}</td>
              <td className="py-2 text-center font-semibold text-destructive">-{fmt(computed.tenYearCost)}</td>
            </tr>
            <tr>
              <td className="py-2 font-bold text-foreground">Total</td>
              <td className="py-2 text-center font-bold text-accent">+{fmt(computed.moveForwardImpact)}</td>
              <td className="py-2 text-center font-bold text-destructive">{fmt(computed.doNothingImpact)}</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-3 p-3 rounded-xl bg-foreground text-background text-center">
          <p className="text-xs font-medium opacity-70">Net Difference</p>
          <p className="text-2xl font-extrabold">{fmt(computed.netDifference)}</p>
        </div>
      </div>
    </div>
  );
});
