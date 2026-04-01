import { memo } from "react";

interface ScriptCardProps {
  title: string;
  text: string;
}

export default memo(function ScriptCard({ title, text }: ScriptCardProps) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
      <div className="script-block text-base">{text}</div>
    </div>
  );
});
