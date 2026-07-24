import { useState } from "react";
import { ChevronDown, Check, AlertTriangle } from "lucide-react";
import type { Confidence } from "@/lib/propertyIntel/types";

export default function WhyConfidencePanel({ c, label = "Why this confidence rating?" }: { c: Confidence; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition"
      >
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        {label}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 rounded-lg border border-hairline bg-muted/30 p-3">
          {c.reasons.length > 0 && (
            <ul className="space-y-1">
              {c.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[12px] text-foreground/85">
                  <Check className="h-3.5 w-3.5 mt-0.5 text-emerald-400 shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}
          {c.conflicts.length > 0 && (
            <ul className="space-y-1 pt-1 border-t border-hairline/50">
              {c.conflicts.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[12px] text-amber-300/90">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-amber-400 shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
