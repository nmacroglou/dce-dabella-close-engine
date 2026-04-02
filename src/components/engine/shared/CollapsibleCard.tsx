import { memo } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleCardProps {
  title: string;
  icon?: React.ReactNode;
  badge?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/** Reusable collapsible card with header toggle */
export default memo(function CollapsibleCard({ title, icon, badge, isOpen, onToggle, children }: CollapsibleCardProps) {
  return (
    <div className="card-elevated-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          {badge && (
            <span className="inline-flex items-center rounded-full bg-warning/15 px-2.5 py-0.5 text-[10px] font-semibold text-warning uppercase">
              {badge}
            </span>
          )}
          <span className="text-sm font-bold text-foreground">{title}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 animate-fade-in">{children}</div>
      )}
    </div>
  );
});
