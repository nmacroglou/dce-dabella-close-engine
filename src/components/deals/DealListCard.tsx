import { memo, useMemo, useState } from "react";
import {
  Trash2, Briefcase, MapPin, Calendar, ArrowRight, Calculator, ChevronDown,
  ShieldAlert, User, Pencil, Camera,
} from "lucide-react";
import { STAGE_LABELS, STAGE_COLORS, type Deal } from "@/types/deal";
import { fmt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import DealTagsEditor from "@/components/deals/DealTagsEditor";
import DealContactEditor from "@/components/deals/DealContactEditor";
import PreliminaryEstimateCard from "@/components/deals/PreliminaryEstimateCard";
import ClosedAtEditor from "@/components/deals/ClosedAtEditor";
import { computeEstimate, type PreliminaryEstimateInput } from "@/data/roofingPricing";
import type { Profile } from "@/hooks/useProfiles";

interface Props {
  deal: Deal;
  compact: boolean;
  isAdmin: boolean;
  repProfile?: Profile;
  onOpen: (id: string, tab?: string) => void;
  onEdit: (deal: Deal) => void;
  onIncident: (deal: Deal) => void;
  onDelete: (id: string, name: string) => void;
}

function RepBadge({ profile, repId }: { profile?: Profile; repId: string }) {
  const label = profile?.display_name || profile?.email || repId.slice(0, 8);
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
      <User className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

function DealListCardImpl({
  deal, compact, isAdmin, repProfile, onOpen, onEdit, onIncident, onDelete,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Derived values memoized so search-typing parents don't redo math on
  // unchanged cards (React.memo + stable props ensures the body is skipped,
  // but if it does render, the work is cheap).
  const derived = useMemo(() => {
    const prelim = ((deal as unknown as { preliminary_estimate?: PreliminaryEstimateInput }).preliminary_estimate) ?? undefined;
    const hasPrelim = !!(prelim && (prelim.squares || prelim.shingleId));
    const original =
      deal.selected_option === "B" ? deal.price_b
      : deal.selected_option === "C" ? deal.price_c
      : deal.price_a;
    const discountPct = (deal.closed_amount && original && original > deal.closed_amount)
      ? Math.round((1 - deal.closed_amount / original) * 100)
      : null;
    const prelimBand = hasPrelim
      ? computeEstimate({
          squares: prelim!.squares ?? 0,
          shingleId: prelim!.shingleId ?? null,
          accessories: prelim!.accessories ?? {},
          hasSolar: prelim!.hasSolar ?? false,
          notes: prelim!.notes ?? "",
        })
      : null;
    return { prelim, hasPrelim, discountPct, prelimBand };
  }, [deal]);

  const { hasPrelim, discountPct, prelimBand, prelim } = derived;

  const name = deal.homeowner1 || "Untitled deal";
  const fullName = name + (deal.homeowner2 ? ` & ${deal.homeowner2}` : "");

  if (compact) {
    return (
      <div className="card-premium p-3 flex flex-col group">
        <div className="flex items-start justify-between mb-2 gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{fullName}</h3>
            {deal.stage === "won" && deal.closed_amount ? (
              <p className="text-xs font-semibold text-success mt-0.5">{fmt(deal.closed_amount)}</p>
            ) : deal.selected_option && deal.closed_amount ? (
              <p className="text-xs font-semibold text-primary mt-0.5">
                {fmt(deal.closed_amount)}
                {discountPct !== null && (
                  <span className="text-[10px] font-medium text-accent ml-1">({discountPct}% off)</span>
                )}
              </p>
            ) : deal.price_a ? (
              <p className="text-xs font-semibold text-foreground mt-0.5">{fmt(deal.price_a)}</p>
            ) : null}
            {deal.address && (
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                {deal.address}
              </p>
            )}
            {isAdmin && <div className="mt-1"><RepBadge profile={repProfile} repId={deal.rep_id} /></div>}
          </div>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0 ${STAGE_COLORS[deal.stage]}`}>
            {STAGE_LABELS[deal.stage]}
          </span>
        </div>

        <div className="space-y-1 text-[11px] text-muted-foreground mb-3">
          {deal.products.length > 0 && (
            <div className="truncate">{deal.products.join(", ")}</div>
          )}
          {deal.stage === "won" && deal.closed_amount ? (
            <div className="text-success font-semibold">Won {fmt(deal.closed_amount)}</div>
          ) : deal.stage === "lost" ? (
            <div className="text-destructive font-semibold">Lost</div>
          ) : deal.price_a ? (
            <div className="font-medium text-foreground">
              Top option: {fmt(deal.price_a)}
              {deal.selected_option && (
                <span className="ml-1 text-[10px] text-primary">· Option {deal.selected_option}</span>
              )}
              {discountPct !== null && (
                <span className="ml-1 text-[10px] text-accent">· {discountPct}% off</span>
              )}
            </div>
          ) : prelimBand ? (
            <div className="font-medium text-foreground flex items-center gap-1">
              <Calculator className="h-2.5 w-2.5 text-primary" />
              Prelim: {fmt(prelimBand.low)} – {fmt(prelimBand.high)}
            </div>
          ) : null}
        </div>

        <div className="mb-3">
          <DealTagsEditor deal={deal} size="sm" />
        </div>

        <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-hairline">
          <Button size="sm" className="flex-1 pressable h-7 text-[11px]" onClick={() => onOpen(deal.id)}>
            Open <ArrowRight className="h-2.5 w-2.5 ml-1" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Inspection report" onClick={() => onOpen(deal.id, "inspection")}>
            <Camera className="h-3.5 w-3.5 text-primary" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit deal details" onClick={() => onEdit(deal)}>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Log an incident for this deal" onClick={() => onIncident(deal)}>
            <ShieldAlert className="h-3.5 w-3.5 text-warning" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onDelete(deal.id, name)}>
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-premium p-5 flex flex-col group">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <h3 className="font-bold text-foreground truncate">{fullName}</h3>
          {deal.stage === "won" && deal.closed_amount ? (
            <p className="text-sm font-semibold text-success mt-0.5">{fmt(deal.closed_amount)}</p>
          ) : deal.selected_option && deal.closed_amount ? (
            <p className="text-sm font-semibold text-primary mt-0.5">
              {fmt(deal.closed_amount)}
              {discountPct !== null && (
                <span className="text-[10px] font-medium text-accent ml-1">({discountPct}% off)</span>
              )}
            </p>
          ) : deal.price_a ? (
            <p className="text-sm font-semibold text-foreground mt-0.5">{fmt(deal.price_a)}</p>
          ) : null}
          {deal.address && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              {deal.address}
            </p>
          )}
          {isAdmin && <div className="mt-1"><RepBadge profile={repProfile} repId={deal.rep_id} /></div>}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${STAGE_COLORS[deal.stage]}`}>
          {STAGE_LABELS[deal.stage]}
        </span>
      </div>

      <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
        {deal.products.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Briefcase className="h-3 w-3" />
            <span className="truncate">{deal.products.join(", ")}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          <span>Updated {new Date(deal.updated_at).toLocaleDateString()}</span>
        </div>
        {deal.stage === "won" && deal.closed_amount ? (
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-success font-semibold">Won {fmt(deal.closed_amount)}</span>
            <ClosedAtEditor dealId={deal.id} closedAt={deal.closed_at} label="Closed" />
          </div>
        ) : deal.stage === "lost" ? (
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-destructive font-semibold">Lost</span>
            <ClosedAtEditor dealId={deal.id} closedAt={deal.closed_at} label="On" />
          </div>
        ) : deal.price_a ? (
          <div className="flex items-center gap-2 pt-1">
            <span className="font-medium text-foreground">Top option: {fmt(deal.price_a)}</span>
            {deal.selected_option && (
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Option {deal.selected_option}</span>
            )}
            {discountPct !== null && (
              <span className="text-[10px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded">{discountPct}% off</span>
            )}
          </div>
        ) : prelimBand ? (
          <div className="font-medium text-foreground flex items-center gap-1">
            <Calculator className="h-3 w-3 text-primary" />
            Prelim: {fmt(prelimBand.low)} – {fmt(prelimBand.high)}
          </div>
        ) : null}
      </div>

      <div className="mb-3">
        <DealContactEditor deal={deal} />
      </div>

      <div className="mb-3">
        <DealTagsEditor deal={deal} />
      </div>

      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="flex items-center justify-between gap-2 rounded-lg border border-hairline bg-muted/30 px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40 transition-colors mb-3 pressable"
      >
        <span className="flex items-center gap-1.5">
          <Calculator className="h-3.5 w-3.5 text-primary" />
          Preliminary estimate
          {hasPrelim && <span className="text-[10px] font-normal text-muted-foreground">· saved</span>}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </button>

      {isExpanded && (
        <div className="mb-3 -mx-1">
          <PreliminaryEstimateCard dealId={deal.id} initial={prelim} />
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-hairline">
        <Button size="sm" className="flex-1 pressable" onClick={() => onOpen(deal.id)}>
          Open <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
        <Button size="sm" variant="ghost" title="Inspection report" onClick={() => onOpen(deal.id, "inspection")}>
          <Camera className="h-4 w-4 text-primary" />
        </Button>
        <Button size="sm" variant="ghost" title="Edit deal details" onClick={() => onEdit(deal)}>
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button size="sm" variant="ghost" title="Log an incident for this deal" onClick={() => onIncident(deal)}>
          <ShieldAlert className="h-4 w-4 text-warning" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(deal.id, name)}>
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}

const DealListCard = memo(DealListCardImpl);
export default DealListCard;
