import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_deal",
  title: "Get deal",
  description:
    "Fetch one deal by id with its pricing, stage history and open follow-ups. Only returns deals owned by the signed-in rep.",
  inputSchema: { deal_id: z.string().describe("The deal id (uuid).") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ deal_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: deal, error } = await supabase
      .from("deals")
      .select("*")
      .eq("id", deal_id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!deal) return { content: [{ type: "text", text: "Deal not found" }], isError: true };

    const [{ data: history }, { data: followUps }] = await Promise.all([
      supabase
        .from("deal_stage_history")
        .select("*")
        .eq("deal_id", deal_id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("follow_ups")
        .select("id, due_at, touchpoint_number, channel, notes, completed_at")
        .eq("deal_id", deal_id)
        .order("due_at", { ascending: true })
        .limit(20),
    ]);

    const payload = { deal, stage_history: history ?? [], follow_ups: followUps ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
