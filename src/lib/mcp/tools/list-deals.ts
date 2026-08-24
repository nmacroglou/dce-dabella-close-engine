import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const DEAL_FIELDS =
  "id, homeowner1, homeowner2, address, stage, products, lead_source, price_a, price_b, price_c, closed_amount, closed_at, install_date, notes, updated_at, created_at";

export default defineTool({
  name: "list_deals",
  title: "List deals",
  description:
    "List the signed-in rep's deals, newest first. Optionally filter by pipeline stage or search homeowner name / address.",
  inputSchema: {
    stage: z
      .enum(["inspecting", "presented", "follow_up", "won", "lost", "disqualified"])
      .optional()
      .describe("Only return deals in this pipeline stage."),
    search: z.string().optional().describe("Case-insensitive match on homeowner name or address."),
    limit: z.number().int().optional().describe("Max deals to return (default 25, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ stage, search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const capped = Math.min(Math.max(limit ?? 25, 1), 100);
    let query = supabase
      .from("deals")
      .select(DEAL_FIELDS)
      .order("updated_at", { ascending: false })
      .limit(capped);
    if (stage) query = query.eq("stage", stage);
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(
        `homeowner1.ilike.${term},homeowner2.ilike.${term},address.ilike.${term}`,
      );
    }
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { deals: data ?? [], count: data?.length ?? 0 },
    };
  },
});
