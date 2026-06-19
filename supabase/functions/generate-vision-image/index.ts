// Generate product vision image via Lovable AI Gateway.
// Optionally accepts a reference photo (data URL) to keep the rendering
// faithful to the homeowner's actual home/space.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { prompt, reference_image } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hasRef = typeof reference_image === "string" && reference_image.startsWith("data:image/");
    const userContent: unknown = hasRef
      ? [
          {
            type: "text",
            text:
              `${prompt}\n\nIMPORTANT: Use the attached reference photo as the SAME home / space. ` +
              `Preserve the home's architecture, roof line, siding layout, window placement, ` +
              `landscaping context, and viewing angle. Only re-render the relevant surfaces to ` +
              `reflect the new product described above. Do not invent a different house.`,
          },
          { type: "image_url", image_url: { url: reference_image } },
        ]
      : prompt;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: userContent }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return new Response(JSON.stringify({ error: "ai_failed", detail: txt }), {
        status: aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiRes.json();
    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) {
      return new Response(JSON.stringify({ error: "no_image", detail: json }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ image: `data:image/png;base64,${b64}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
