import { memo } from "react";
import { BookOpen } from "lucide-react";
import type { ReferenceSection } from "@/data/sellingSteps";
import CollapsibleCard from "../shared/CollapsibleCard";

interface ReferencePanelProps {
  reference: ReferenceSection;
  isOpen: boolean;
  onToggle: () => void;
}

export default memo(function ReferencePanel({ reference, isOpen, onToggle }: ReferencePanelProps) {
  return (
    <CollapsibleCard
      title={reference.title}
      icon={<BookOpen className="h-4 w-4 text-primary" />}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        {reference.content.map((p, i) => (
          <p key={i} className="text-sm text-muted-foreground">{p}</p>
        ))}
        {reference.subSections?.map((sub, sIdx) => (
          <div key={sIdx} className="space-y-1.5">
            <h5 className="text-sm font-bold text-foreground">{sub.heading}</h5>
            <ul className="space-y-1 ml-1">
              {sub.items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
});
