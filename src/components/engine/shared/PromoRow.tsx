import { memo } from "react";
import { fmt } from "@/lib/format";

interface PromoRowProps {
  label: string;
  price: number;
  monthly: number;
}

export default memo(function PromoRow({ label, price, monthly }: PromoRowProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <div className="text-right">
        <p className="text-base font-bold text-foreground">{fmt(price)}</p>
        <p className="text-xs text-muted-foreground">{fmt(monthly)}/mo</p>
      </div>
    </div>
  );
});
