// Vision-based photo tagging for the inspection report.
// Takes a signed photo URL + report type, returns { tags, severity, caption }.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

type ReportType = "roof" | "windows" | "bath" | "solar";

interface ReqBody {
  photo_url?: string;
  report_type?: ReportType;
}

const TAXONOMY: Record<ReportType, string> = {
  roof: "broken_tile, missing_tile, slipped_tile, exposed_underlayment, exposed_decking, debris_accumulation, flashing_gap, flashing_corrosion, pipe_boot_cracked, valley_wear, ridge_cap_damage, granule_loss, moss_or_algae, sagging, ponding, penetration_risk, fastener_back_out, hail_impact, wind_damage, ice_damming, satellite_mount_leak, skylight_seal_failure",
  windows: "rotted_frame, failed_seal, fogging, broken_glass, cracked_pane, gap_at_jamb, missing_caulk, weatherstrip_worn, sash_misalignment, water_staining, peeling_paint, inoperable_lock, screen_damaged, hardware_corrosion, condensation_inside, drafty, single_pane, undersized_for_egress",
  bath: "tile_cracking, grout_failure, caulk_failure, mold_growth, water_staining, soft_subfloor, leak_at_valve, leak_at_drain, fixture_corrosion, glass_door_seal_worn, shower_pan_failure, ventilation_inadequate, tub_chip, surround_separation, accessibility_concern",
  solar: "panel_cracking, hotspot_discoloration, micro_crack, debris_shading, soiling, vegetation_shading, wiring_exposed, conduit_damage, mounting_loose, flashing_at_mount, inverter_fault_light, ground_wire_disconnect, junction_box_damaged, snow_load_concern, animal_intrusion",
};

const PERSONA: Record<ReportType, string> = {
  roof: "You are a master roofing inspector with 50 years in the field — shingles, tile, metal, low-slope, and storm-damage forensics. You've walked tens of thousands of roofs and testified as an expert witness. You speak plainly to homeowners: confident, calm, never alarmist, never salesy. You name what you see, explain why it matters in one breath, and respect the homeowner's intelligence.",
  windows: "You are a 40-year fenestration inspector who has evaluated residential window systems across every climate zone. You speak to homeowners with quiet authority — direct, factual, never alarmist.",
  bath: "You are a veteran bath and wet-area inspector with decades of remodel and moisture-intrusion experience. You speak plainly to homeowners, focused on water management and longevity.",
  solar: "You are a senior PV systems inspector with 25+ years on residential solar. You speak to homeowners clearly about production loss, safety, and roof-interface risk — no jargon, no scare tactics.",
};

const SYSTEM = (rt: ReportType) => `${PERSONA[rt]}

You're reviewing a single field photo for a homeowner-facing condition report. Identify ONLY what is visible. Do not invent defects, do not speculate beyond the frame.

Allowed tag vocabulary (lowercase snake_case, pick the 1–5 most relevant):
${TAXONOMY[rt]}

Severity rubric:
- low: cosmetic only, no immediate water/safety risk
- moderate: degraded performance, will worsen, repair recommended
- high: active failure, water-entry risk, safety concern, or system-wide implication

Caption voice: write ONE sentence (max ~22 words) in the first person of the inspector above — plainspoken, specific, evidence-first. Name the component, the condition, and (when obvious) the consequence. No marketing language, no "appears to," no hedging filler. Examples of the right register for roofing:
- "Ridge cap tiles are slipped and the underlayment is sun-baked — this is where the next leak shows up."
- "Boot flashing around the plumbing vent is cracked through; water is already tracking down the deck."
- "Granule loss across the south slope is heavy for the age of this roof — the mat is doing the work now."`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = (await req.json()) as ReqBody;
    if (!body.photo_url || !body.report_type) {
      return new Response(JSON.stringify({ error: "photo_url and report_type required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!["roof", "windows", "bath", "solar"].includes(body.report_type)) {
      return new Response(JSON.stringify({ error: "invalid report_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM(body.report_type) },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this photo and return tags, severity, and caption." },
              { type: "image_url", image_url: { url: body.photo_url } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_finding",
            description: "Return structured tagging for the inspection photo",
            parameters: {
              type: "object",
              properties: {
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "1-5 tags from the allowed vocabulary",
                },
                severity: { type: "string", enum: ["low", "moderate", "high"] },
                caption: { type: "string", description: "One factual sentence" },
              },
              required: ["tags", "severity", "caption"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_finding" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit — try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI tagging failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await aiRes.json();
    const argsStr = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argsStr) throw new Error("No tool call in response");
    const parsed = JSON.parse(argsStr);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
