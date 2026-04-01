import { Shield, Award, Star, Home } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TRUST_ITEMS: { icon: LucideIcon; text: string }[] = [
  { icon: Shield, text: "Lifetime Warranty Protection" },
  { icon: Award, text: "GAF Master Elite Certified" },
  { icon: Star, text: "Top-Rated Installation Crews" },
  { icon: Home, text: "Locally Owned & Operated" },
];

export default function TrustBar() {
  return (
    <div className="max-w-4xl mx-auto px-6 pb-10">
      <div className="rounded-2xl bg-muted/50 border border-border p-6 text-center">
        <div className="flex items-center justify-center gap-8 flex-wrap">
          {TRUST_ITEMS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
