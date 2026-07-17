import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return json({ error: "Missing Google Maps connector credentials" }, 500);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthenticated" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);

    // Find deals belonging to caller (RLS handles admin visibility via user client)
    const { data: deals, error: dealsErr } = await userClient
      .from("deals")
      .select("id, address, lat, lng, geocoded_address")
      .not("address", "is", null);
    if (dealsErr) return json({ error: dealsErr.message }, 500);

    const toGeocode = (deals ?? []).filter(
      (d) => d.address && (d.lat == null || d.lng == null || d.geocoded_address !== d.address),
    );

    let updated = 0;
    let failed = 0;
    for (const d of toGeocode) {
      try {
        const url = `${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(d.address!)}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
          },
        });
        if (!res.ok) {
          failed++;
          continue;
        }
        const body = await res.json();
        const loc = body?.results?.[0]?.geometry?.location;
        if (!loc) {
          failed++;
          continue;
        }
        await admin.from("deals").update({
          lat: loc.lat,
          lng: loc.lng,
          geocoded_at: new Date().toISOString(),
          geocoded_address: d.address,
        }).eq("id", d.id);
        updated++;
      } catch {
        failed++;
      }
    }

    return json({ updated, failed, considered: toGeocode.length });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
