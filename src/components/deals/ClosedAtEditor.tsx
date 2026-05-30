import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUpdateDeal } from "@/hooks/useDeals";
import { toast } from "sonner";

interface Props {
  dealId: string;
  closedAt: string | null;
  label?: string;
  className?: string;
}

/** Inline editor for deals.closed_at — supports backdating won/lost dates. */
export default function ClosedAtEditor({ dealId, closedAt, label = "Closed", className }: Props) {
  const update = useUpdateDeal();
  const [open, setOpen] = useState(false);
  const current = closedAt ? new Date(closedAt) : undefined;

  const onPick = async (d: Date | undefined) => {
    if (!d) return;
    // Preserve existing time-of-day if we had one, otherwise default to noon local.
    const next = new Date(d);
    if (current) {
      next.setHours(current.getHours(), current.getMinutes(), 0, 0);
    } else {
      next.setHours(12, 0, 0, 0);
    }
    try {
      await update.mutateAsync({ id: dealId, updates: { closed_at: next.toISOString() } });
      toast.success("Close date updated");
      setOpen(false);
    } catch {
      /* hook surfaces toast */
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2 text-[11px] font-semibold gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60",
            className,
          )}
          title="Edit close date — useful for backdating"
        >
          {update.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <CalendarIcon className="h-3 w-3" />
          )}
          <span>
            {label}: {current ? format(current, "MMM d, yyyy") : "set date"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={current}
          onSelect={onPick}
          disabled={(d) => d > new Date()}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
