import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listDealsTool from "./tools/list-deals";
import getDealTool from "./tools/get-deal";
import createDealTool from "./tools/create-deal";
import updateDealTool from "./tools/update-deal";
import pipelineSummaryTool from "./tools/pipeline-summary";
import listFollowUpsTool from "./tools/list-follow-ups";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "dabella-close-assist",
  title: "DaBella Close Assist",
  version: "0.1.0",
  instructions:
    "Tools for the DaBella Close Engine sales app. Every tool acts as the signed-in rep. Use `list_deals` and `get_deal` to read the rep's pipeline, `create_deal` and `update_deal` to add leads or move stages, `pipeline_summary` for stage counts, won revenue and close rate, and `list_follow_ups` for upcoming touchpoints.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listDealsTool,
    getDealTool,
    createDealTool,
    updateDealTool,
    pipelineSummaryTool,
    listFollowUpsTool,
  ],
});
