import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import type { PropertyIntelReport } from "@/lib/propertyIntel/types";
import {
  Check, X, HomeIcon, UserX, MapPinned, MessageCircle, Camera, StickyNote, Ban, Wrench,
} from "lucide-react";

interface Props { report: PropertyIntelReport }

async function logAudit(user_id: string | null, event_type: string, entity_id: string | null, event_data: Record<string, unknown>) {
  if (!user_id) return;
  await supabase.from("pi_audit_logs").insert({
    user_id, event_type, entity_type: "property", entity_id, event_data,
  } as never);
}

async function upsertProperty(userId: string, report: PropertyIntelReport): Promise<string | null> {
  const m = report.property_match;
  const i = report.info;
  const { data, error } = await supabase.from("properties").insert({
    created_by: userId,
    standardized_address: m.standardized_address,
    parcel_number: m.parcel_number,
    city: m.city, state: m.state, postal_code: m.postal_code,
    latitude: m.latitude, longitude: m.longitude,
    property_type: m.property_type,
    year_built: i.year_built, square_feet: i.square_feet, lot_size: i.lot_size,
    stories: i.stories, bedrooms: i.bedrooms, bathrooms: i.bathrooms,
    assessed_value: i.assessed_value, estimated_market_value: i.estimated_market_value,
    roof_material: i.roof_material, estimated_roof_age: i.estimated_roof_age,
    exterior_material: i.exterior_material, solar_present: i.solar_present,
    is_demo: report.is_demo,
  } as never).select("id").maybeSingle();
  if (error) { console.error(error); toast.error("Could not save property"); return null; }
  return (data as { id: string } | null)?.id ?? null;
}

function Btn({
  icon: Icon, label, onClick, tone = "default", disabled,
}: { icon: React.ElementType; label: string; onClick: () => void; tone?: "default" | "primary" | "danger"; disabled?: boolean }) {
  const cls =
    tone === "primary" ? "bg-primary text-primary-foreground hover:bg-primary/90"
    : tone === "danger" ? "bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25"
    : "bg-muted/40 text-foreground border border-hairline hover:bg-muted/60";
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition ${cls} disabled:opacity-50`}>
      <Icon className="h-3.5 w-3.5" />{label}
    </button>
  );
}

export default function RepActionsBar({ report }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setActiveDealId } = useActiveDeal();
  const [savedId, setSavedId] = useState<string | null>(null);
  const dnk = report.info.do_not_knock;

  const ensureProperty = async (): Promise<string | null> => {
    if (savedId) return savedId;
    if (!user) { toast.error("Sign in required"); return null; }
    const id = await upsertProperty(user.id, report);
    if (id) { setSavedId(id); await logAudit(user.id, "property_saved", id, { source: "PropertyIntel" }); }
    return id;
  };

  const confirmName = async (status: "confirmed" | "corrected" | "incorrect", value?: string) => {
    const id = await ensureProperty(); if (!id || !user) return;
    await supabase.from("property_confirmations").insert({
      property_id: id, user_id: user.id,
      field_name: "owner_name",
      source_value: report.ownership.owner_name,
      confirmed_value: value ?? report.ownership.owner_name,
      confirmation_status: status,
    } as never);
    await logAudit(user.id, `owner_${status}`, id, { source_value: report.ownership.owner_name });
    toast.success(status === "confirmed" ? "Owner confirmed" : status === "corrected" ? "Owner corrected" : "Marked incorrect");
  };

  const markOccupancy = async (kind: "renter" | "vacant" | "owner_occupied") => {
    const id = await ensureProperty(); if (!id || !user) return;
    await supabase.from("property_confirmations").insert({
      property_id: id, user_id: user.id,
      field_name: "occupancy",
      source_value: report.identity.owner_occupancy_status,
      confirmed_value: kind,
      confirmation_status: "confirmed",
    } as never);
    await logAudit(user.id, `occupancy_${kind}`, id, {});
    toast.success(`Marked ${kind.replace("_", " ")}`);
  };

  const addToRoute = async () => {
    if (dnk) { toast.error("Cannot route a Do Not Knock property"); return; }
    const id = await ensureProperty(); if (!id || !user) return;
    const { data, error } = await supabase.from("deals").insert({
      rep_id: user.id,
      homeowner1: report.identity.likely_owner_name ?? "Prospect",
      address: report.property_match.standardized_address,
      lat: report.property_match.latitude,
      lng: report.property_match.longitude,
      stage: "inspecting",
      lead_source: "canvass",
    } as never).select("id").maybeSingle();
    if (error) { toast.error("Could not add to route"); return; }
    const dealId = (data as { id: string } | null)?.id;
    if (dealId) {
      setActiveDealId(dealId);
      await logAudit(user.id, "added_to_route", id, { deal_id: dealId });
      toast.success("Added to route — deal opened");
      navigate("/pipeline");
    }
  };

  const launchCloseEngine = async () => {
    await addToRoute();
    navigate("/");
  };

  const markDNK = async () => {
    const id = await ensureProperty(); if (!id || !user) return;
    await supabase.from("suppressions").insert({
      property_id: id, suppression_type: "do_not_knock",
      reason: "Marked by rep in Property Intelligence",
      created_by: user.id,
    } as never);
    await logAudit(user.id, "marked_do_not_knock", id, {});
    toast.success("Marked Do Not Knock");
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-background/95 backdrop-blur px-3 py-2">
      <div className="max-w-3xl mx-auto flex flex-wrap gap-1.5 justify-center">
        <Btn icon={Check} tone="primary" label="Confirm owner" onClick={() => confirmName("confirmed")} disabled={dnk} />
        <Btn icon={X} label="Mark incorrect" onClick={() => {
          const v = prompt("Correct owner name (leave blank if unknown):") ?? "";
          if (v.trim()) confirmName("corrected", v.trim());
          else confirmName("incorrect");
        }} />
        <Btn icon={HomeIcon} label="Owner occ." onClick={() => markOccupancy("owner_occupied")} />
        <Btn icon={UserX} label="Renter" onClick={() => markOccupancy("renter")} />
        <Btn icon={UserX} label="Vacant" onClick={() => markOccupancy("vacant")} />
        <Btn icon={MapPinned} tone="primary" label="Add to route" onClick={addToRoute} disabled={dnk} />
        <Btn icon={MessageCircle} label="Start door convo" onClick={() => toast.info("Opener copied to clipboard").then?.(() => {})} disabled={dnk} />
        <Btn icon={StickyNote} label="Add notes" onClick={async () => {
          const id = await ensureProperty(); if (!id || !user) return;
          const v = prompt("Notes:") ?? "";
          if (!v.trim()) return;
          await supabase.from("property_confirmations").insert({
            property_id: id, user_id: user.id, field_name: "notes",
            source_value: null, confirmed_value: null, notes: v.trim(),
            confirmation_status: "note",
          } as never);
          toast.success("Note saved");
        }} />
        <Btn icon={Camera} label="Upload photo" onClick={() => toast.info("Use Inspection tab in the deal")} disabled={dnk} />
        <Btn icon={Ban} tone="danger" label="Do Not Knock" onClick={markDNK} />
        <Btn icon={Wrench} label="Launch Close Engine" onClick={launchCloseEngine} disabled={dnk} />
      </div>
    </div>
  );
}
