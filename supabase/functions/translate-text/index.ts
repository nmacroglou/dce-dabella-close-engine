// Batch text translator. Takes an array of strings + a target language and returns
// the translated strings in the same order. Preserves empty strings.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface ReqBody {
  texts?: string[];
  target_lang?: "en" | "es";
  context?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = (await req.json()) as ReqBody;
    const target = body.target_lang === "es" ? "es" : "en";
    const rawTexts = Array.isArray(body.texts) ? body.texts : [];
    if (rawTexts.length === 0) {
      return new Response(JSON.stringify({ texts: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Preserve empty strings — no AI round-trip needed.
    const idx: number[] = [];
    const nonEmpty: string[] = [];
    rawTexts.forEach((t, i) => {
      const s = typeof t === "string" ? t : "";
      if (s.trim().length === 0) return;
      idx.push(i);
      nonEmpty.push(s);
    });
    if (nonEmpty.length === 0) {
      return new Response(JSON.stringify({ texts: rawTexts.map(() => "") }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const targetLabel = target === "es"
      ? "natural, professional Latin-American Spanish"
      : "natural, professional English";
    const system = `You are a professional translator for a residential home-improvement inspection app (DaBella).
Translate every input string into ${targetLabel}.
Keep meaning, tone, line breaks, bullet symbols (•), numbering, and units (°F, ft, sq ft, %) intact.
Never add commentary. Never omit content. If a string is already in the target language, return it unchanged.
${target === "en" ? "IMPORTANT: Many inputs may be Spanish. Translate Spanish sentences fully into English and do not leave Spanish wording in the output except proper names." : "IMPORTANT: Translate English sentences fully into Spanish and do not leave English wording in the output except proper names, brands, and units."}
Preserve trade jargon accurately (roofing, windows, stucco, paint, bath, solar).`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `${body.context ? `Context: ${body.context}\n\n` : ""}Translate each of the following strings. Return them in the SAME order via the tool call.\n\n${nonEmpty.map((s, i) => `#${i + 1}\n${s}`).join("\n---\n")}`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_translations",
            description: "Return the translated strings in the same order as input",
            parameters: {
              type: "object",
              properties: {
                texts: {
                  type: "array",
                  items: { type: "string" },
                  description: "Translated strings, same length and order as input.",
                },
              },
              required: ["texts"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_translations" } },
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
      console.error("Translate AI error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "Translation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await aiRes.json();
    const argsStr = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argsStr) throw new Error("No tool call in translator response");
    const parsed = JSON.parse(argsStr) as { texts?: string[] };
    const translated = Array.isArray(parsed.texts) ? parsed.texts : [];

    // Zip translations back into the original slots. Fallback to source on mismatch.
    const out = rawTexts.map((v) => (typeof v === "string" ? v : ""));
    idx.forEach((originalIdx, i) => {
      const val = typeof translated[i] === "string" ? translated[i] : nonEmpty[i];
      out[originalIdx] = val;
    });

    return new Response(JSON.stringify({ texts: out }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
