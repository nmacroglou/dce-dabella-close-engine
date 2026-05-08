import { memo } from "react";
import { Info } from "lucide-react";
import { fmt } from "@/lib/format";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PromoRowProps {
  label: string;
  price: number;
  monthly: number;
  formula?: string;
  explanation?: string;
}

export default memo(function PromoRow({ label, price, monthly, formula, explanation }: PromoRowProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {(formula || explanation) && (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={`How ${label} is calculated`}
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs space-y-1.5">
                {explanation && <p className="text-xs leading-relaxed">{explanation}</p>}
                {formula && (
                  <p className="text-[11px] font-mono bg-muted/80 rounded px-1.5 py-1 text-foreground">
                    {formula}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="text-right">
        <p className="text-base font-bold text-foreground">{fmt(price)}</p>
        <p className="text-xs text-muted-foreground">{fmt(monthly)}/mo</p>
      </div>
    </div>
  );
});
