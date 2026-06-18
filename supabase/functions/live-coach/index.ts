// Live coach: receives an audio chunk + rolling transcript + deal context,
// returns { transcriptDelta, tip, urgency, objection } using Lovable AI Gateway.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

async function requireUser(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  return null;
}

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface ReqBody {
  audioBase64: string;        // raw base64 (no data: prefix)
  mimeType: string;           // e.g. audio/webm
  recentTranscript?: string;  // last ~60s of prior transcript
  dealContext?: {
    homeowner?: string;
    products?: string[];
    stage?: string;
    selectedOption?: string | null;
  };
}

const SYSTEM = `You are a real-time elite in-ear sales coach for a DaBella home-improvement rep.
You listen to a snippet of the live rep<->homeowner conversation and respond INSTANTLY.

You know DaBella's 10-step sales process:
1 Intro & rapport  2 Company story  3 Inspection  4 Needs/why  5 Product education
6 Demo  7 Build value  8 Present price  9 Isolate objection  10 Close & paperwork

Coaching priorities:
- Spot the current step and what the homeowner ACTUALLY means (fear, money, spouse, trust, timing).
- Give the rep ONE concrete next move: a tie-down, a script line, or a question they should ask next.
- Detect objections (price/value/timing/trust/spouse) the moment they appear.
- Keep tips under 20 words. Coach like a Manager-on-Duty whispering in their ear.

Always reply with STRICT JSON only, no prose, matching:
{"transcriptDelta": string, "tip": string, "urgency": "low"|"med"|"high", "objection": "price"|"value"|"timing"|"trust"|"spouse"|null, "step": number}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ReqBody;
    if (!body.audioBase64 || !body.mimeType) {
      return new Response(JSON.stringify({ error: "audioBase64 and mimeType required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userText = `Recent transcript so far:\n"""${(body.recentTranscript ?? "").slice(-2000)}"""\n
Deal context: ${JSON.stringify(body.dealContext ?? {})}

Transcribe ONLY the new audio chunk (what was just said since the prior transcript) into transcriptDelta, then coach.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              {
                type: "input_audio",
                input_audio: {
                  data: body.audioBase64,
                  format: body.mimeType.includes("mp4") || body.mimeType.includes("aac") ? "aac"
                    : body.mimeType.includes("mp3") ? "mp3"
                    : body.mimeType.includes("wav") ? "wav"
                    : "webm",
                },
              },
            ],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI error", aiRes.status, txt);
      return new Response(JSON.stringify({ error: "ai_failed", status: aiRes.status, detail: txt }), {
        status: aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { transcriptDelta: "", tip: "", urgency: "low", objection: null, step: 0 }; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
