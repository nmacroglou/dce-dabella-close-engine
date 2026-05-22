// Refreshes live utility news for SRP, APS, TEP.
// 1) Firecrawl scrapes each utility's newsroom + AZCC rate-case page (markdown)
// 2) Lovable AI (GPT-5) extracts structured items via tool calling
// 3) Upsert into public.utility_updates (dedup by content_hash)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

type Utility = "SRP" | "APS" | "TEP";

const SOURCES: Record<Utility, { name: string; url: string }[]> = {
  SRP: [
    { name: "SRP Newsroom", url: "https://media.srpnet.com/" },
    { name: "SRP Prices", url: "https://www.srpnet.com/price-plans" },
  ],
  APS: [
    { name: "APS Newsroom", url: "https://www.aps.com/en/About/Our-Company/Newsroom" },
    { name: "APS Rates", url: "https://www.aps.com/en/Residential/Service-Plans" },
  ],
  TEP: [
    { name: "TEP Newsroom", url: "https://www.tep.com/news/" },
    { name: "TEP Rates", url: "https://www.tep.com/rates/" },
  ],
};

const AZCC = { name: "AZ Corporation Commission", url: "https://www.azcc.gov/news" };

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function firecrawlScrape(url: string, apiKey: string): Promise<string> {
  const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`Firecrawl ${url} failed [${res.status}]`, data);
    return "";
  }
  return data?.data?.markdown ?? data?.markdown ?? "";
}

async function extractItems(utility: Utility, sourceUrl: string, sourceName: string, markdown: string, lovableKey: string) {
  if (!markdown || markdown.length < 100) return [];
  const trimmed = markdown.slice(0, 15000);

  const systemPrompt = `You are a utility-news analyst for solar sales reps in Arizona. Extract the most important recent items from utility/regulatory pages that would affect a homeowner's bill or solar decision (rate hikes, plan changes, demand-charge changes, net-metering / export rules, fees, regulatory rulings, major programs, outages). Skip marketing fluff, job postings, sponsorships, and community PR.`;

  const userPrompt = `Utility: ${utility}\nSource: ${sourceName} (${sourceUrl})\n\nPage content (markdown):\n${trimmed}`;

  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [{
        type: "function",
        function: {
          name: "record_updates",
          description: "Return 0-6 high-signal updates relevant to a homeowner's bill or a solar sales conversation.",
          parameters: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Short headline, <100 chars" },
                    summary: { type: "string", description: "1-3 sentence plain-English summary for a sales rep" },
                    category: { type: "string", enum: ["rate_change","regulation","outage","announcement","program","other"] },
                    impact: { type: "string", enum: ["up","down","neutral"], description: "up = costs/risk increase for homeowner, down = saves money, neutral otherwise" },
                    published_at: { type: "string", description: "ISO date if visible on page, else empty string" },
                  },
                  required: ["title","summary","category","impact","published_at"],
                  additionalProperties: false,
                },
              },
            },
            required: ["items"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "record_updates" } },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error(`AI extract failed for ${sourceUrl} [${res.status}]`, txt.slice(0, 300));
    return [];
  }
  const data = await res.json();
  const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return [];
  try {
    const parsed = JSON.parse(args);
    return parsed.items ?? [];
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!FIRECRAWL_API_KEY) return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (!SUPABASE_URL || !SERVICE_ROLE) return new Response(JSON.stringify({ error: "Supabase env missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: run, error: runErr } = await supabase
    .from("utility_refresh_runs")
    .insert({ status: "running" })
    .select()
    .single();
  if (runErr) console.error("run insert error", runErr);
  const runId = run?.id;

  let totalItems = 0;
  let addedItems = 0;
  const errors: string[] = [];

  const utilities: Utility[] = ["SRP", "APS", "TEP"];

  for (const u of utilities) {
    const sources = [...SOURCES[u], AZCC];
    for (const src of sources) {
      try {
        const md = await firecrawlScrape(src.url, FIRECRAWL_API_KEY);
        if (!md) continue;
        const items = await extractItems(u, src.url, src.name, md, LOVABLE_API_KEY);
        for (const it of items) {
          totalItems += 1;
          const hash = await sha256(`${u}|${(it.title || "").trim().toLowerCase()}`);
          const published = it.published_at && /^\d{4}-\d{2}-\d{2}/.test(it.published_at) ? it.published_at : null;
          const { error: insErr } = await supabase
            .from("utility_updates")
            .upsert({
              utility: u,
              title: (it.title || "").slice(0, 280),
              summary: it.summary || null,
              category: it.category || "announcement",
              impact: it.impact || "neutral",
              source_url: src.url,
              source_name: src.name,
              published_at: published,
              content_hash: hash,
            }, { onConflict: "utility,content_hash", ignoreDuplicates: true });
          if (!insErr) addedItems += 1;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`source ${src.url} failed`, msg);
        errors.push(`${u} ${src.name}: ${msg}`);
      }
    }
  }

  const status = errors.length === 0 ? "success" : (totalItems > 0 ? "partial" : "error");
  if (runId) {
    await supabase
      .from("utility_refresh_runs")
      .update({
        finished_at: new Date().toISOString(),
        status,
        items_added: addedItems,
        items_total: totalItems,
        error: errors.length ? errors.join(" | ").slice(0, 1000) : null,
      })
      .eq("id", runId);
  }

  return new Response(JSON.stringify({ status, items_added: addedItems, items_total: totalItems, errors }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
