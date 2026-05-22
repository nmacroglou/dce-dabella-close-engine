import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "accent" | "warning" | "destructive" | "muted";

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  tone?: Tone;
  action?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

const toneMap: Record<Tone, string> = {
  primary:     "bg-primary/10 text-primary",
  accent:      "bg-accent/10 text-accent",
  warning:     "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  muted:       "bg-muted text-muted-foreground",
};

/** Reusable section header with icon, title, subtitle, optional badge + right action. */
export default memo(function SectionHeader({
  icon, title, subtitle, tone = "primary", action, badge, className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3 mb-4", className)}>
      <div className="flex items-start gap-3 min-w-0">
        <div className={cn("flex items-center justify-center w-9 h-9 rounded-xl shrink-0", toneMap[tone])}>
          {icon}
        </div>
        <div className="min-w-0 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-display font-extrabold text-foreground tracking-tight leading-tight">{title}</h3>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
});
