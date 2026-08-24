import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_follow_ups",
  title: "List follow-ups",
  description:
    "List the signed-in rep's follow-up touchpoints, soonest first. Defaults to open (not completed) follow-ups.",
  inputSchema: {
    include_completed: z.boolean().optional().describe("Include completed follow-ups too."),
    due_within_days: z
      .number()
      .int()
      .optional()
      .describe("Only follow-ups due within this many days from now."),
    limit: z.number().int().optional().describe("Max rows to return (default 25, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ include_completed, due_within_days, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const capped = Math.min(Math.max(limit ?? 25, 1), 100);
    let query = supabase
      .from("follow_ups")
      .select("id, deal_id, due_at, touchpoint_number, channel, notes, context_notes, completed_at")
      .order("due_at", { ascending: true })
      .limit(capped);
    if (!include_completed) query = query.is("completed_at", null);
    if (due_within_days !== undefined) {
      const until = new Date(Date.now() + Math.max(due_within_days, 0) * 86_400_000).toISOString();
      query = query.lte("due_at", until);
    }
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { follow_ups: data ?? [], count: data?.length ?? 0 },
    };
  },
});
