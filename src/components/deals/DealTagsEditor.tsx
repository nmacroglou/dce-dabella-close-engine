import { useUpdateDeal } from "@/hooks/useDeals";
import { LEAD_SOURCE_LABELS, type Deal, type LeadSource } from "@/types/deal";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Presentation, Wrench } from "lucide-react";

interface Props {
  deal: Pick<Deal, "id" | "lead_source" | "was_presented" | "was_demoed">;
  size?: "sm" | "md";
}

export default function DealTagsEditor({ deal, size = "md" }: Props) {
  const update = useUpdateDeal();
  const compact = size === "sm";

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${compact ? "text-[11px]" : "text-xs"}`}>
      <Select
        value={deal.lead_source ?? "unset"}
        onValueChange={(v) =>
          update.mutate({
            id: deal.id,
            updates: { lead_source: v === "unset" ? null : (v as LeadSource) },
          })
        }
      >
        <SelectTrigger className={compact ? "h-7 w-[110px] text-[11px]" : "h-8 w-[130px] text-xs"}>
          <SelectValue placeholder="Lead source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unset">No source</SelectItem>
          {(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((k) => (
            <SelectItem key={k} value={k}>{LEAD_SOURCE_LABELS[k]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Toggle
        size="sm"
        pressed={deal.was_presented}
        onPressedChange={(p) =>
          update.mutate({ id: deal.id, updates: { was_presented: p } })
        }
        className="h-7 px-2 data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
        title="Were you able to present?"
      >
        <Presentation className="h-3 w-3 mr-1" /> Presented
      </Toggle>

      <Toggle
        size="sm"
        pressed={deal.was_demoed}
        onPressedChange={(p) =>
          update.mutate({ id: deal.id, updates: { was_demoed: p } })
        }
        className="h-7 px-2 data-[state=on]:bg-success/15 data-[state=on]:text-success"
        title="Were you able to demo?"
      >
        <Wrench className="h-3 w-3 mr-1" /> Demoed
      </Toggle>
    </div>
  );
}
