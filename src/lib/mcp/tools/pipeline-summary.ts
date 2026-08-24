import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "pipeline_summary",
  title: "Pipeline summary",
  description:
    "Summarize the signed-in rep's pipeline: deal counts by stage, won revenue and open pipeline value over a recent window.",
  inputSchema: {
    days: z.number().int().optional().describe("Look-back window in days (default 90, max 730)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ days }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const window = Math.min(Math.max(days ?? 90, 1), 730);
    const since = new Date(Date.now() - window * 86_400_000).toISOString();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("deals")
      .select("stage, closed_amount, price_c, created_at")
      .gte("created_at", since);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const rows = data ?? [];
    const byStage: Record<string, number> = {};
    let wonRevenue = 0;
    let openValue = 0;
    for (const row of rows) {
      byStage[row.stage] = (byStage[row.stage] ?? 0) + 1;
      if (row.stage === "won") wonRevenue += Number(row.closed_amount ?? 0);
      else if (["inspecting", "presented", "follow_up"].includes(row.stage)) {
        openValue += Number(row.price_c ?? 0);
      }
    }
    const decided = (byStage.won ?? 0) + (byStage.lost ?? 0);
    const summary = {
      window_days: window,
      total_deals: rows.length,
      by_stage: byStage,
      won_revenue: wonRevenue,
      open_pipeline_value: openValue,
      close_rate: decided > 0 ? Number(((byStage.won ?? 0) / decided).toFixed(3)) : null,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary) }],
      structuredContent: summary,
    };
  },
});
