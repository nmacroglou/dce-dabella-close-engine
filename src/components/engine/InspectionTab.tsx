import { useActiveDeal } from "@/contexts/ActiveDealContext";
import InspectionPanel from "@/components/inspection/InspectionPanel";

export default function InspectionTab() {
  const { activeDealId } = useActiveDeal();

  if (!activeDealId) {
    return (
      <div className="card-premium p-8 text-center text-sm text-muted-foreground">
        Select or open a deal first — inspection reports are attached to a specific deal.
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <InspectionPanel dealId={activeDealId} />
    </div>
  );
}
