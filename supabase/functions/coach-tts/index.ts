import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { encode as b64encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

interface Body {
  text: string;
  voiceId: string;
  modelId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ElevenLabs not connected" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = (await req.json()) as Body;
    if (!body?.text || !body?.voiceId) {
      return new Response(JSON.stringify({ error: "text and voiceId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const text = body.text.slice(0, 1000);
    const model = body.modelId || "eleven_turbo_v2_5";

    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(body.voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: { stability: 0.45, similarity_boost: 0.85, style: 0.25, use_speaker_boost: true, speed: 1.05 },
        }),
      }
    );
    if (!r.ok) {
      const txt = await r.text();
      console.error("ElevenLabs TTS failed", r.status, txt);
      return new Response(JSON.stringify({ error: txt || `TTS failed: ${r.status}` }), {
        status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const buf = await r.arrayBuffer();
    const audioBase64 = b64encode(new Uint8Array(buf));
    return new Response(JSON.stringify({ audioBase64, mime: "audio/mpeg" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
