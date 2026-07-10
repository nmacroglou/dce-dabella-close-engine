// Generate inspection narrative sections from photo findings + optional tweak prompt.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type ReportType = "roof" | "windows" | "bath" | "solar" | "siding" | "stucco" | "paint";

interface PhotoFinding {
  caption?: string | null;
  tags?: string[] | null;
  severity?: "low" | "moderate" | "high" | null;
}

interface ReqBody {
  report_type?: ReportType;
  report_types?: ReportType[];
  photos?: PhotoFinding[];
  tweak?: string;
  current_sections?: Record<string, string>;
  language?: "en" | "es";
}

const TRADE_LABEL: Record<ReportType, string> = {
  roof: "roofing",
  windows: "window",
  bath: "bath / wet-area",
  solar: "GAF Energy Roof",
  siding: "siding",
  stucco: "stucco / exterior coating",
  paint: "exterior paint",
};

const VOICE: Record<ReportType, string> = {
  roof: "Use roofer's language: shingles, underlayment, flashing, valleys, ridge caps, boot flashing, granule loss, deck. Frame findings around water-entry risk and system longevity. When relevant, frame solar as part of the GAF Energy Roof — a complete roofing system.",
  windows: "Use fenestration language: sash, jamb, sill, IGU seal, weatherstripping, egress, U-value, low-E. Frame findings around air/water infiltration, energy loss, and operation.",
  bath: "Use wet-area language: pan, surround, valve, drain, grout, caulk joint, ventilation. Frame findings around water management, mold risk, and longevity.",
  solar: "Treat the array as part of the GAF Energy Roof — a complete roofing system. Use roofing language for the roof plane plus PV-integrated shingle language. Frame findings around the roof envelope first, generation second.",
  siding: "Use cladding language: panels, trim, J-channel, housewrap, flashing, fastener pattern. Frame findings around water management, structural protection, and curb appeal.",
  stucco: "Use stucco language: finish texture, hairline/pattern/spider/map cracking, chips, pockmarks, fade, chalking, efflorescence, rust bleed, runoff staining, biological growth, sealant joints, weep screed. Identify the existing finish by name when visible (Santa Barbara, Lace, Light Lace, Heavy Lace, Light Dash, Medium Dash, Heavy Dash, Sand). Call dark streaks and runoff by name and where they originate. Frame findings around what is visible and why it matters — no product pitches, no marketing.",
  paint: "Use coatings language: substrate, prep, primer, top coat, mil thickness, adhesion, peeling, cracking, alligatoring, chalking, fade, runoff staining, rust/tannin bleed, mildew. Frame findings around why the finish is failing and what condition the substrate is in — no product pitches, no marketing.",
};

const PICKY = "You are notoriously picky — the kind of inspector other inspectors hate to follow because you catch what everyone else walked past. You scan every detail edge-to-edge and would rather call out five small conditions than miss one. Nothing is acceptable until you have proven it is.";

const PERSONA: Record<ReportType, string> = {
  roof: `${PICKY} You are a grand master roofing inspector with 100 years of cumulative trade lineage — asphalt, tile, metal, low-slope, and the GAF Energy Roof solar-shingle system (treated as a complete roofing system, never a bolt-on solar array). You speak plainly to homeowners — confident, calm, never alarmist, never salesy.`,
  windows: `${PICKY} You are a grand master fenestration inspector with 100 years of cumulative trade knowledge across wood, vinyl, fiberglass, aluminum-clad, and modern triple-pane systems. You speak with quiet authority — direct, factual, evidence-first.`,
  bath: `${PICKY} You are a grand master bath and wet-area inspector with 100 years of cumulative trade lineage in tile, surrounds, pans, plumbing rough-in, and moisture-intrusion forensics. You speak plainly about water management and longevity.`,
  solar: `${PICKY} You are a grand master roofing inspector with 100 years of trade lineage, evaluating the GAF Energy Roof as a complete roofing system — solar-integrated shingles, underlayment, and flashing details — not a bolt-on PV array. You speak plainly about water management and system integrity.`,
  siding: `${PICKY} You are a grand master exterior cladding inspector with 100 years of cumulative trade knowledge across vinyl, fiber cement, engineered wood, cedar, and composite systems. You speak plainly about water management, protection, and curb appeal.`,
  stucco: `${PICKY} You are a grand master stucco and exterior finish inspector with 100 years of cumulative trade lineage — three-coat hard-coat, one-coat, EIFS, acrylics, elastomerics. You name the existing finish on sight (Santa Barbara, Lace, Light Lace, Heavy Lace, Light Dash, Medium Dash, Heavy Dash, Sand) and you call cracking, fade, runoff staining, biological growth, rust bleed, and failed sealant by name. You speak plainly to homeowners — confident, calm, evidence-first, never alarmist, never salesy.`,
  paint: `${PICKY} You are a grand master exterior finish inspector and master painter with 100 years of cumulative trade lineage in coatings chemistry, substrate prep, primers, and every failure mode. You speak plainly to homeowners — confident, calm, evidence-first, never alarmist, never salesy.`,
};

const SECTION_KEYS = [
  "executive_summary",
  "inspection_scope",
  "measurements",
  "professional_opinion",
  "recommended_scope",
  "next_steps",
  "limitations",
] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = (await req.json()) as ReqBody;
    const VALID: ReportType[] = ["roof", "windows", "bath", "solar", "siding", "stucco", "paint"];
    // Accept either `report_types: ReportType[]` (multi-select) or legacy `report_type: ReportType`.
    const rawTypes = (body.report_types && body.report_types.length)
      ? body.report_types
      : (body.report_type ? [body.report_type] : []);
    const types = Array.from(new Set(rawTypes.filter((t): t is ReportType => VALID.includes(t as ReportType))));
    if (types.length === 0) {
      return new Response(JSON.stringify({ error: "invalid report_type(s)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const primary = types[0];
    const photos = body.photos ?? [];
    const tweak = (body.tweak ?? "").trim();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const findingsBlock = photos.length
      ? photos.map((p, i) => {
          const tags = (p.tags ?? []).join(", ") || "—";
          const sev = p.severity ?? "—";
          const cap = (p.caption ?? "").trim() || "(no caption)";
          return `Photo ${i + 1} [severity: ${sev}] [tags: ${tags}]\n  ${cap}`;
        }).join("\n")
      : "(no tagged photos provided)";

    const personaBlock = types.map((t) => `• ${PERSONA[t]}`).join("\n");
    const voiceBlock = types.map((t) => `• ${TRADE_LABEL[t].toUpperCase()}: ${VOICE[t]}`).join("\n");
    const tradeList = types.map((t) => TRADE_LABEL[t]).join(" + ");

    const system = `You are speaking as a single, unified DaBella inspector who carries every one of the following trade lineages at once. Do not introduce yourself — write the report straight.

${personaBlock}

You are drafting a homeowner-facing ${tradeList} inspection report${types.length > 1 ? " (multiple trades combined into one report)" : ""}. Write tight. Each section: 2–3 short sentences max (next_steps can be a 3–5 item numbered list, one short line each). No marketing language, no hedging ("appears to", "may possibly"), no compound run-ons. Plainspoken, specific, evidence-first. Anchor every claim in the photo findings provided. Do NOT invent defects that are not represented in the findings. Prefer short declarative sentences over long qualified ones.

Trade-specific voice and terminology to use throughout:
${voiceBlock}`;

    const user = `Report type(s): ${types.join(", ")}

Photo findings (use these as the factual basis — synthesize across photos, do not just list them):
${findingsBlock}
${tweak ? `\nHomeowner / job context to incorporate (treat as authoritative — material, age, prior repairs, etc.):\n${tweak}\n` : ""}
Write the seven report sections. Cite the conditions you see in the findings using the trade-specific vocabulary above (e.g. roofing terms for roof findings, fenestration terms for window findings, Forever Paint framing for stucco findings). The executive summary and professional opinion should reference the strongest observed conditions across ${types.length > 1 ? "all selected trades" : "the trade"}. Recommended scope should match the severity pattern${types.length > 1 ? " and explicitly cover each trade involved (" + tradeList + ")" : ""}.`;
    void primary;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        tools: [{
          type: "function",
          function: {
            name: "write_report",
            description: "Return the seven narrative sections",
            parameters: {
              type: "object",
              properties: Object.fromEntries(SECTION_KEYS.map((k) => [k, { type: "string" }])),
              required: [...SECTION_KEYS],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "write_report" } },
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
      return new Response(JSON.stringify({ error: "Narrative generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await aiRes.json();
    const argsStr = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argsStr) throw new Error("No tool call in response");
    const parsed = JSON.parse(argsStr);

    return new Response(JSON.stringify({ sections: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
