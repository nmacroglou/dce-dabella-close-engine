// Vision-based photo tagging for the inspection report.
// Takes a signed photo URL + report type, returns { tags, severity, caption }.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type ReportType = "roof" | "windows" | "bath" | "solar" | "siding" | "stucco" | "paint";

interface ReqBody {
  photo_url?: string;
  image_data_url?: string;
  report_type?: ReportType;
  user_hint?: string;
  existing_tags?: string[];
}

const TAXONOMY: Record<ReportType, string> = {
  roof: "broken_tile, missing_tile, slipped_tile, exposed_underlayment, exposed_decking, debris_accumulation, flashing_gap, flashing_corrosion, pipe_boot_cracked, valley_wear, ridge_cap_damage, granule_loss, moss_or_algae, sagging, ponding, penetration_risk, fastener_back_out, hail_impact, wind_damage, ice_damming, satellite_mount_leak, skylight_seal_failure",
  windows: "rotted_frame, failed_seal, fogging, broken_glass, cracked_pane, gap_at_jamb, missing_caulk, weatherstrip_worn, sash_misalignment, water_staining, peeling_paint, inoperable_lock, screen_damaged, hardware_corrosion, condensation_inside, drafty, single_pane, undersized_for_egress",
  bath: "tile_cracking, grout_failure, caulk_failure, mold_growth, water_staining, soft_subfloor, leak_at_valve, leak_at_drain, fixture_corrosion, glass_door_seal_worn, shower_pan_failure, ventilation_inadequate, tub_chip, surround_separation, accessibility_concern",
  solar: "panel_cracking, hotspot_discoloration, micro_crack, debris_shading, soiling, vegetation_shading, wiring_exposed, conduit_damage, mounting_loose, flashing_at_mount, inverter_fault_light, ground_wire_disconnect, junction_box_damaged, snow_load_concern, animal_intrusion",
  siding: "cracked_panel, loose_panel, missing_panel, buckling, warping, faded_finish, hail_damage, wind_damage, water_staining, rot_at_trim, fastener_pops, seam_gap, corner_post_damage, soffit_damage, fascia_damage, insect_damage, mold_or_mildew, housewrap_visible",
  stucco: "finish_santa_barbara, finish_lace, finish_light_lace, finish_heavy_lace, finish_light_dash, finish_medium_dash, finish_heavy_dash, finish_sand, chip, chipped_edge, hairline_crack, pattern_cracking, spider_cracking, map_cracking, structural_crack, surface_pitting, pockmark, fade, discoloration, sun_bleaching, dark_streaks, vertical_streaking, runoff_staining, water_staining, rust_bleed, dirt_accumulation, biological_growth, mildew_staining, algae_staining, efflorescence, blistering, bubbling_coating, peeling_coating, chalking, missing_sealant, caulk_failure, kickout_missing, weep_screed_blocked, weep_screed_damaged, window_head_streaking, scupper_runoff, parapet_streaking, patch_mismatch, prior_repair_visible, impact_damage, scuff, delamination",
  paint: "peeling_paint, cracking_paint, alligatoring, blistering, chalking, fade, uv_bleaching, exposed_substrate, bare_wood, water_staining, dark_streaks, vertical_streaking, runoff_staining, rust_bleed, tannin_bleed, caulk_failure, sealant_gap, trim_decay, wood_rot, scuffs_or_scratches, inconsistent_finish, lap_marks, overspray, nail_pops_visible, mildew_growth, algae_growth, biological_growth, dirt_accumulation, efflorescence, surfactant_leaching",
};

const PICKY = "You are notoriously picky — the kind of inspector other inspectors hate to follow because you catch what everyone else walked past. You scan every photo edge-to-edge, corner-to-corner, in raking light: hairlines, micro-cracks, lifted edges, off-color patches, fastener pops, sealant skips, stain shadows, even a single displaced granule. If it is visible in the frame, you see it and you name it. You assume nothing is acceptable until you have proven it is. You would rather call out five small conditions than miss one.";

const PERSONA: Record<ReportType, string> = {
  roof: `${PICKY} You are a grand master roofing inspector with 100 years of cumulative trade lineage — asphalt shingle, composite, clay and concrete tile, standing-seam and stone-coated metal, low-slope membrane, and the GAF Energy Roof solar-shingle system (which we treat as a complete roofing system, never a bolt-on solar array). You have walked tens of thousands of roofs in every climate, performed storm-damage forensics for insurance carriers, and testified as an expert witness on water-intrusion and wind-uplift failures. You speak plainly to homeowners: confident, calm, never alarmist, never salesy. You name what you see, explain why it matters in one breath, and respect the homeowner's intelligence.`,
  windows: `${PICKY} You are a grand master fenestration inspector with 100 years of cumulative trade knowledge — wood, vinyl, fiberglass, aluminum-clad, and modern triple-pane systems across every climate zone. You have evaluated installation flashing, sill pans, IGU seal failure, structural egress, and energy performance for builders, insurers, and homeowners. You speak with quiet authority — direct, factual, evidence-first, never alarmist or salesy.`,
  bath: `${PICKY} You are a grand master bath and wet-area inspector with 100 years of cumulative trade lineage — tile, acrylic, solid-surface, shower pan and surround systems, plumbing rough-in, ventilation, and moisture-intrusion forensics. You have rebuilt failed wet areas down to the studs more times than you can count. You speak plainly to homeowners about water management, longevity, and what a proper system actually requires — no scare tactics, no upsell language.`,
  solar: `${PICKY} You are a grand master roofing inspector with 100 years of trade lineage, evaluating the GAF Energy Roof as a complete roofing system — solar-integrated shingles, underlayment, flashing details, and the roof plane itself. You do not treat this as a bolt-on solar array; you evaluate it as a roof first. You speak plainly to homeowners about water management, system integrity, and long-term performance.`,
  siding: `${PICKY} You are a grand master exterior cladding inspector with 100 years of cumulative trade knowledge — vinyl, fiber cement, engineered wood, real cedar, and composite systems. You have diagnosed water intrusion behind every cladding type, evaluated housewrap and flashing details, and judged storm and impact damage for carriers and homeowners. You speak plainly about water management, structural protection, and curb appeal — practical, evidence-first, never salesy.`,
  stucco: `${PICKY} You are a grand master stucco and exterior finish inspector with 100 years of cumulative trade lineage — three-coat hard-coat, one-coat, EIFS, acrylics, and elastomerics. You name the finish texture on sight from the eight common finishes — Santa Barbara (smooth troweled), Lace, Light Lace, Heavy Lace, Light Dash, Medium Dash, Heavy Dash, Sand — and call it out in the caption. You catalog what is visible on the wall: hairline, pattern, spider, and map cracking; chips, pockmarks, prior patches; UV fade and sun-bleaching; dark vertical streaking and runoff staining from window heads, sills, scuppers, and parapets; algae and mildew on shaded elevations; rust bleed; efflorescence; chalking; failed sealant. You speak plainly to homeowners — confident, calm, evidence-first, never alarmist, never salesy. Name the component, the condition, and the consequence. No product pitches.`,
  paint: `${PICKY} You are a grand master exterior finish inspector and master painter with 100 years of cumulative trade lineage — coatings chemistry, substrate prep, primers, elastomerics, and every failure mode across wood, stucco, fiber cement, hardboard, and metal. You call what you see: peeling, cracking, alligatoring, blistering, chalking, fade and UV-bleaching, dark vertical streaking and runoff staining from window heads/sills/gutters/trim, rust bleed from fasteners, tannin bleed on cedar, mildew and algae, surfactant leaching, lap marks, overspray, caulk failure, bare or exposed substrate. You speak plainly to homeowners — confident, calm, evidence-first, never alarmist, never salesy. No product pitches.`,
};

const SYSTEM = (rt: ReportType) => `${PERSONA[rt]}

You're reviewing a single field photo for a homeowner-facing condition report. Identify ONLY what is visible — but be exhaustive about what IS visible. Scan the frame in a deliberate sweep: edges, corners, transitions, penetrations, fasteners, sealant lines, and any color or texture change. If you see more than one condition, tag them all (up to 5). Do not invent defects beyond the frame, and do not speculate about what's behind the surface.

Allowed tag vocabulary (lowercase snake_case, pick the 1–5 most relevant — lean toward the higher count when multiple conditions are genuinely visible):
${TAXONOMY[rt]}

Severity rubric (pick the highest condition visible — do not average):
- low: cosmetic only, no immediate water/safety risk
- moderate: degraded performance, will worsen, repair recommended
- high: active failure, water-entry risk, safety concern, or system-wide implication

Caption voice: ONE short sentence, max ~18 words, first person. Plain, specific, evidence-first. Name the component, the condition, and the consequence in as few words as possible. No marketing, no "appears to," no filler, no compound clauses stacked with em-dashes. Examples:
- "Ridge caps are slipped on the north run — next leak starts here."
- "Boot flashing is cracked at the collar; water is tracking the deck."
- "Heavy granule loss across the south slope; the mat is exposed."`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  console.log("inspect-photo v3 invoked");
  try {
    const body = (await req.json()) as ReqBody;
    if ((!body.photo_url && !body.image_data_url) || !body.report_type) {
      return new Response(JSON.stringify({ error: "photo_url or image_data_url and report_type required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!["roof", "windows", "bath", "solar", "siding", "stucco", "paint"].includes(body.report_type)) {
      return new Response(JSON.stringify({ error: "invalid report_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const imageUrl = body.image_data_url ?? body.photo_url;
    if (!imageUrl) throw new Error("No image provided");
    if (body.image_data_url && !body.image_data_url.startsWith("data:image/")) {
      return new Response(JSON.stringify({ error: "image_data_url must be an image data URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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
              {
                type: "text",
                text: [
                  "Analyze this photo and return tags, severity, and caption.",
                  body.user_hint?.trim()
                    ? `\nThe inspector has written this note about the photo — treat it as ground truth, build on it, refine the wording, and make sure the caption reflects what they observed:\n"""${body.user_hint.trim()}"""`
                    : "",
                  body.existing_tags?.length
                    ? `\nExisting tags the inspector already applied (keep relevant ones, add or remove as warranted): ${body.existing_tags.join(", ")}`
                    : "",
                ].filter(Boolean).join("\n"),
              },
              { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
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

    const aiErrorText = aiRes.ok ? "" : await aiRes.text();
    const aiErrorLower = aiErrorText.toLowerCase();

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit — try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (aiRes.status === 402 || aiErrorLower.includes("credit_limit_reached")) {
      console.error("AI credit limit", aiRes.status, aiErrorText);
      return new Response(JSON.stringify({
        error: "Workspace AI credit limit reached. Credits are available, but the workspace limit still needs to be raised in Settings → Plans & credits.",
      }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!aiRes.ok) {
      console.error("AI error", aiRes.status, aiErrorText);
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
