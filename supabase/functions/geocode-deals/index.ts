import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

// Continental US + Alaska/Hawaii rough bounds. Anything outside is almost
// certainly a bad match for a US home-improvement lead.
const US_BOUNDS = { minLat: 18.0, maxLat: 72.0, minLng: -180.0, maxLng: -66.0 };
function inUS(lat: number, lng: number) {
  return (
    lat >= US_BOUNDS.minLat &&
    lat <= US_BOUNDS.maxLat &&
    lng >= US_BOUNDS.minLng &&
    lng <= US_BOUNDS.maxLng
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return json({ error: "Missing Google Maps connector credentials" }, 500);
    }

    // Optional body: { force?: boolean }
    let force = false;
    try {
      const body = await req.json();
      force = !!body?.force;
    } catch {
      /* no body */
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthenticated" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: deals, error: dealsErr } = await userClient
      .from("deals")
      .select("id, address, lat, lng, geocoded_address")
      .not("address", "is", null);
    if (dealsErr) return json({ error: dealsErr.message }, 500);

    const toGeocode = (deals ?? []).filter((d) => {
      if (!d.address) return false;
      if (force) return true;
      // Missing coords
      if (d.lat == null || d.lng == null) return true;
      // Address changed since last geocode
      if (d.geocoded_address !== d.address) return true;
      // Existing coordinates fell outside US → fix them
      if (!inUS(Number(d.lat), Number(d.lng))) return true;
      return false;
    });

    let updated = 0;
    let failed = 0;
    let cleared = 0;

    for (const d of toGeocode) {
      try {
        // Bias to the US and prefer country-scoped results. This stops
        // partial addresses like "1013 Deer Creek Drive" from resolving
        // to random places in Canada / New Jersey / Louisiana.
        const url =
          `${GATEWAY_URL}/maps/api/geocode/json` +
          `?address=${encodeURIComponent(d.address!)}` +
          `&components=country:US` +
          `&region=us`;

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
        const result = body?.results?.[0];
        const loc = result?.geometry?.location;
        const locType: string | undefined = result?.geometry?.location_type;
        const isPartial: boolean = !!result?.partial_match;

        if (!loc || !inUS(loc.lat, loc.lng)) {
          // Bad match — clear any stale coords so the pin doesn't stay
          // in the wrong state.
          if (d.lat != null || d.lng != null) {
            await admin
              .from("deals")
              .update({ lat: null, lng: null, geocoded_at: null, geocoded_address: null })
              .eq("id", d.id);
            cleared++;
          }
          failed++;
          continue;
        }

        // If the geocoder had to guess (partial_match + approximate/geometric
        // center), the pin is unreliable — usually a "street name only" input
        // that Google snapped to a random city. Skip rather than mislead.
        if (isPartial && (locType === "APPROXIMATE" || locType === "GEOMETRIC_CENTER")) {
          if (d.lat != null || d.lng != null) {
            await admin
              .from("deals")
              .update({ lat: null, lng: null, geocoded_at: null, geocoded_address: null })
              .eq("id", d.id);
            cleared++;
          }
          failed++;
          continue;
        }

        await admin
          .from("deals")
          .update({
            lat: loc.lat,
            lng: loc.lng,
            geocoded_at: new Date().toISOString(),
            geocoded_address: d.address,
          })
          .eq("id", d.id);
        updated++;
      } catch {
        failed++;
      }
    }

    return json({ updated, failed, cleared, considered: toGeocode.length, force });
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
