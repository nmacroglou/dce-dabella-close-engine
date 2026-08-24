import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_deal",
  title: "Create deal",
  description: "Create a new deal (lead) owned by the signed-in rep.",
  inputSchema: {
    homeowner1: z.string().describe("Primary homeowner name."),
    homeowner2: z.string().optional().describe("Second homeowner name, if any."),
    address: z.string().optional().describe("Property address."),
    homeowner_email: z.string().optional(),
    homeowner_phone: z.string().optional(),
    lead_source: z.string().optional().describe("Where the lead came from, e.g. canvass, referral."),
    products: z
      .array(z.string())
      .optional()
      .describe("Product lines in play, e.g. roofing, windows, siding, bath, cool life."),
    notes: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("deals")
      .insert({ ...input, rep_id: ctx.getUserId(), stage: "inspecting" })
      .select("id, homeowner1, homeowner2, address, stage, products, lead_source, created_at")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { deal: data },
    };
  },
});
