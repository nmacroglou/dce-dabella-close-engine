import { memo } from "react";
import { DollarSign } from "lucide-react";
import { PAYMENT_FACTORS, PAYMENT_TERMS } from "@/data/paymentFactors";
import CollapsibleCard from "../shared/CollapsibleCard";

interface PaymentFactorsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default memo(function PaymentFactorsPanel({ isOpen, onToggle }: PaymentFactorsPanelProps) {
  return (
    <CollapsibleCard
      title="Payment Factors Table"
      icon={<DollarSign className="h-4 w-4 text-primary" />}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="overflow-x-auto -mx-5 px-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-1.5 font-semibold text-muted-foreground">Rate</th>
              {PAYMENT_TERMS.map((t) => (
                <th key={t} className="text-center py-2 px-1 font-semibold text-muted-foreground">
                  {t}mo
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PAYMENT_FACTORS.map((row) => (
              <tr key={row.rate} className="border-b border-border/50 hover:bg-muted/30">
                <td className="py-1.5 px-1.5 font-semibold text-foreground">{row.rate}</td>
                {PAYMENT_TERMS.map((t) => (
                  <td key={t} className="text-center py-1.5 px-1 text-muted-foreground font-mono">
                    {row.factors[t] != null ? row.factors[t]!.toFixed(5) : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CollapsibleCard>
  );
});
