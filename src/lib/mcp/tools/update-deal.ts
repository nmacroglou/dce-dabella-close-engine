import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_deal",
  title: "Update deal",
  description:
    "Update a deal owned by the signed-in rep: move its pipeline stage, set option pricing, closed amount, install date or notes.",
  inputSchema: {
    deal_id: z.string().describe("The deal id (uuid)."),
    stage: z
      .enum(["inspecting", "presented", "follow_up", "won", "lost", "disqualified"])
      .optional(),
    notes: z.string().optional(),
    address: z.string().optional(),
    lead_source: z.string().optional(),
    price_a: z.number().optional().describe("Good option price."),
    price_b: z.number().optional().describe("Better option price."),
    price_c: z.number().optional().describe("Best option price."),
    closed_amount: z.number().optional().describe("Contract amount when the deal is won."),
    install_date: z.string().optional().describe("Install date as YYYY-MM-DD."),
    lost_reason: z.string().optional(),
    disqualified_reason: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ deal_id, ...patch }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const updates = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined),
    );
    if (Object.keys(updates).length === 0) {
      return { content: [{ type: "text", text: "No fields to update" }], isError: true };
    }
    if (updates.stage) updates.stage_changed_at = new Date().toISOString();
    if (updates.stage === "won" && !updates.closed_at) updates.closed_at = new Date().toISOString();

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("deals")
      .update(updates as never)
      .eq("id", deal_id)
      .select("id, homeowner1, address, stage, price_a, price_b, price_c, closed_amount, install_date, notes, updated_at")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Deal not found" }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { deal: data },
    };
  },
});
