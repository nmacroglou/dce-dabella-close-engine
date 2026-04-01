import { memo } from "react";
import { Shield, Award, Star, Home } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TRUST_ITEMS: { icon: LucideIcon; label: string }[] = [
  { icon: Shield, label: "Lifetime Warranty Protection" },
  { icon: Award, label: "GAF Master Elite Certified" },
  { icon: Star, label: "Top-Rated Installation Crews" },
  { icon: Home, label: "Locally Owned & Operated" },
];

export default memo(function TrustBar() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TRUST_ITEMS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl bg-card border border-border px-5 py-4 hover:shadow-sm transition-shadow"
          >
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
