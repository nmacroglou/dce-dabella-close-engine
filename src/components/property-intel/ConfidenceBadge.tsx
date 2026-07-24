import type { Confidence } from "@/lib/propertyIntel/types";
import { badgeClass } from "@/lib/propertyIntel/confidence";
import { ShieldCheck } from "lucide-react";

export default function ConfidenceBadge({ c, compact = false }: { c: Confidence; compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold ${badgeClass(c.label)}`}
      title={c.reasons.join(" · ")}
    >
      <ShieldCheck className="h-3 w-3" />
      {c.score}% {!compact && `· ${c.label}`}
    </span>
  );
}
