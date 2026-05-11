import { memo, type ReactNode } from "react";

interface FormSectionProps {
  icon: string;
  title: string;
  quote: string;
  children: ReactNode;
  className?: string;
}

/**
 * Standardized "form section" inside the Calculator card.
 * Replaces the repeated icon-heading + italic-quote + grid pattern.
 */
export default memo(function FormSection({
  icon,
  title,
  quote,
  children,
  className = "mb-8",
}: FormSectionProps) {
  return (
    <div className={className}>
      <h4 className="text-eyebrow text-foreground mb-1 flex items-center gap-2">
        <span aria-hidden>{icon}</span>
        {title}
      </h4>
      <p className="text-[11px] text-muted-foreground mb-4">{quote}</p>
      {children}
    </div>
  );
});
