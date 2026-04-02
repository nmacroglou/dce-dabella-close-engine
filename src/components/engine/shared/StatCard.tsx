import { memo } from "react";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

/** Reusable stat card with label, large value, and optional subtitle */
export default memo(function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-extrabold font-display ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
});
