// AI-drafted follow-up email for a DaBella sales rep.
// Returns { subject, body } as a JSON object using tool calling.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

async function requireUser(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  return null;
}

interface ReqAttachment { url?: string; name?: string; type?: string; caption?: string; }
interface ReqBody {
  homeowner?: string;
  rep_name?: string;
  rep_email?: string;
  address?: string;
  products?: string[];
  notes?: string;
  selected_option?: string | null;
  price_a?: number | null;
  price_b?: number | null;
  price_c?: number | null;
  objections?: string[];
  touchpoint_number?: number;
  context_notes?: string;
  attachments?: ReqAttachment[];
}

const SYSTEM = `You are an elite DaBella exterior remodeling sales coach writing
warm, professional follow-up emails on behalf of a field rep to a homeowner
after an in-home consultation. DaBella differentiators to weave in naturally
(do not list them mechanically — pick 1-2 most relevant per email):
- Industry-leading lifetime workmanship & manufacturer Golden Pledge warranties
- Factory-trained, in-house DaBella crews (never sub-contracted)
- GAF Master Elite (top 2% of roofers nationally)
- SolarMAX integrated energy roofing
- White-glove project management from contract to completion
- Transparent, locked-in pricing — no surprise change orders
Tone: confident, human, succinct. No hype, no exclamation overload. American English.
Reference specifics from the appointment notes when possible. Make the
homeowner feel taken care of, not chased. Always end with a low-pressure CTA.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = (await req.json()) as ReqBody;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const ctxLines = [
      `Homeowner: ${body.homeowner || "(unknown)"}`,
      body.address ? `Address: ${body.address}` : "",
      `Rep: ${body.rep_name || "the DaBella rep"}`,
      body.products?.length ? `Products discussed: ${body.products.join(", ")}` : "",
      body.selected_option ? `Leaning option: ${body.selected_option}` : "",
      body.price_a ? `Option A price: $${body.price_a}` : "",
      body.price_b ? `Option B price: $${body.price_b}` : "",
      body.price_c ? `Option C price: $${body.price_c}` : "",
      body.objections?.length ? `Objections raised: ${body.objections.join(", ")}` : "",
      body.notes ? `Appointment notes: ${body.notes}` : "",
      body.context_notes ? `Additional rep context for this touch: ${body.context_notes}` : "",
      body.attachments?.length
        ? `Attachments the rep gathered (reference these naturally — e.g. "I've attached the photo of your north slope"):\n${body.attachments.map((a, i) => `  ${i + 1}. ${a.name ?? "file"}${a.type ? ` (${a.type})` : ""}${a.caption ? ` — ${a.caption}` : ""}`).join("\n")}`
        : "",
      `Touchpoint #: ${body.touchpoint_number ?? 1}`,
    ].filter(Boolean).join("\n");

    const userPrompt = `Draft a personalized follow-up email using this context:\n\n${ctxLines}\n\nIf this is touchpoint 1, recap the visit and key takeaways. If 2+, add new value (financing, warranty depth, neighbor reference) and gently re-open the conversation. Address objections directly when present. 150-220 words.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "compose_email",
            description: "Return the drafted email",
            parameters: {
              type: "object",
              properties: {
                subject: { type: "string", description: "Email subject (under 70 chars)" },
                body: { type: "string", description: "Email body, plain text with line breaks" },
              },
              required: ["subject", "body"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "compose_email" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit — try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI draft failed" }),
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
