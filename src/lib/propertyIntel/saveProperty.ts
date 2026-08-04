import { supabase } from "@/integrations/supabase/client";
import type { PropertyIntelReport } from "./types";

/**
 * Saves (or re-uses) a property row for this rep so every Property Intelligence
 * search shows up under "Recent searches". Dedupes on standardized address.
 */
export async function saveSearchedProperty(
  userId: string,
  report: PropertyIntelReport
): Promise<string | null> {
  const m = report.property_match;
  const i = report.info;

  const { data: existing } = await supabase
    .from("properties")
    .select("id")
    .eq("created_by", userId)
    .eq("standardized_address", m.standardized_address)
    .maybeSingle();

  const payload = {
    created_by: userId,
    standardized_address: m.standardized_address,
    parcel_number: m.parcel_number,
    city: m.city,
    state: m.state,
    postal_code: m.postal_code,
    latitude: m.latitude,
    longitude: m.longitude,
    property_type: m.property_type,
    year_built: i.year_built,
    square_feet: i.square_feet,
    lot_size: i.lot_size,
    stories: i.stories,
    bedrooms: i.bedrooms,
    bathrooms: i.bathrooms,
    assessed_value: i.assessed_value,
    estimated_market_value: i.estimated_market_value,
    roof_material: i.roof_material,
    estimated_roof_age: i.estimated_roof_age,
    exterior_material: i.exterior_material,
    solar_present: i.solar_present,
    is_demo: report.is_demo,
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("properties")
      .update(payload as never)
      .eq("id", existing.id);
    if (error) console.error(error);
    return existing.id;
  }

  const { data, error } = await supabase
    .from("properties")
    .insert(payload as never)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error(error);
    return null;
  }
  return (data as { id: string } | null)?.id ?? null;
}
