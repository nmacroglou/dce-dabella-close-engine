import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ProductAccordionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/** Accordion section used in CalculatorTab for product-specific inputs */
export default function ProductAccordion({ title, defaultOpen = false, children }: ProductAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-8 pt-8 border-t border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left group"
      >
        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          {title}
        </h4>
        {open ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform" />
        )}
      </button>
      {open && <div className="mt-4 animate-fade-in">{children}</div>}
    </div>
  );
}
