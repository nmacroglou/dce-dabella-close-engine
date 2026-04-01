import { memo } from "react";
import { LucideIcon } from "lucide-react";

interface ValueRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}

export default memo(function ValueRow({ icon: Icon, label, value, color }: ValueRowProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors">
      <div className="flex items-center gap-3">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <span className={`text-base font-bold ${color}`}>{value}</span>
    </div>
  );
});
