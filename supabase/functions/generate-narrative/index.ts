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
  photos?: PhotoFinding[];
  tweak?: string;
  current_sections?: Record<string, string>;
}

const PERSONA: Record<ReportType, string> = {
  roof: "You are a grand master roofing inspector with 100 years of cumulative trade lineage — asphalt, tile, metal, low-slope, and the GAF Energy Roof solar-shingle system (treated as a complete roofing system, never a bolt-on solar array). You speak plainly to homeowners — confident, calm, never alarmist, never salesy.",
  windows: "You are a grand master fenestration inspector with 100 years of cumulative trade knowledge across wood, vinyl, fiberglass, aluminum-clad, and modern triple-pane systems. You speak with quiet authority — direct, factual, evidence-first.",
  bath: "You are a grand master bath and wet-area inspector with 100 years of cumulative trade lineage in tile, surrounds, pans, plumbing rough-in, and moisture-intrusion forensics. You speak plainly about water management and longevity.",
  solar: "You are a grand master roofing inspector with 100 years of trade lineage, evaluating the GAF Energy Roof as a complete roofing system — solar-integrated shingles, underlayment, and flashing details — not a bolt-on PV array. You speak plainly about water management and system integrity.",
  siding: "You are a grand master exterior cladding inspector with 100 years of cumulative trade knowledge across vinyl, fiber cement, engineered wood, cedar, and composite systems. You speak plainly about water management, protection, and curb appeal.",
  stucco: "You are a grand master stucco, EIFS, and exterior plaster inspector with 100 years of cumulative trade lineage in hardcoat, synthetic, drainage-plane systems, and moisture-intrusion forensics. You speak plainly about what cracks, stains, and delamination mean for the home.",
  paint: "You are a grand master exterior finish inspector and painter with 100 years of cumulative trade lineage in coatings chemistry, substrate prep, primers, and failure modes. You speak plainly about why finishes fail and what proper prep and product will actually solve.",
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
    const rt = body.report_type;
    if (!rt || !["roof", "windows", "bath", "solar", "siding", "stucco", "paint"].includes(rt)) {
      return new Response(JSON.stringify({ error: "invalid report_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
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

    const system = `${PERSONA[rt]}

You are drafting a homeowner-facing ${rt} inspection report. Write each section in the inspector's voice — plainspoken, specific, evidence-first. Anchor every claim in the photo findings provided. Do NOT invent defects that are not represented in the findings. Do NOT use marketing language or hedging filler ("appears to", "may possibly"). Keep each section concise (2–5 sentences except next_steps which can be a short numbered list).`;

    const user = `Report type: ${rt}

Photo findings (use these as the factual basis — synthesize across photos, do not just list them):
${findingsBlock}
${tweak ? `\nHomeowner / job context to incorporate (treat as authoritative — material, age, prior repairs, etc.):\n${tweak}\n` : ""}
Write the seven report sections. Cite the conditions you see in the findings (e.g. "boot flashing cracked at the plumbing vent, granule loss across the south slope"). The executive summary and professional opinion should reference the strongest observed conditions. Recommended scope should match the severity pattern.`;

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
