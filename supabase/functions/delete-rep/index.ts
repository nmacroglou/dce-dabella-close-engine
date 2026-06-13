// Deletes a rep entirely: their auth user + every public.* row they own.
// Caller must be an authenticated admin.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return json({ error: "Missing Authorization" }, 401);

    // Verify caller
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const callerId = userData.user.id;

    // Admin check
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Admins only" }, 403);

    const { target_user_id } = await req.json();
    if (!target_user_id || typeof target_user_id !== "string") {
      return json({ error: "target_user_id required" }, 400);
    }
    if (target_user_id === callerId) {
      return json({ error: "You cannot delete yourself" }, 400);
    }

    // Wipe rep-owned rows. Order doesn't matter (no FKs), but child-first feels safer.
    const tables = [
      "deal_incident_notes",
      "deal_incidents",
      "deal_objections",
      "deal_photos",
      "deal_stage_history",
      "follow_ups",
      "commission_payments",
      "commission_grids",
      "coaching_sessions",
      "paycheck_overrides",
      "deals",
      "user_roles",
      "profiles",
    ];
    for (const t of tables) {
      const { error } = await admin.from(t).delete().eq(t === "user_roles" || t === "profiles" ? "user_id" : "rep_id", target_user_id);
      if (error && !/column .* does not exist/i.test(error.message)) {
        console.warn(`[delete-rep] ${t}:`, error.message);
      }
    }

    // Finally remove auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(target_user_id);
    if (delErr) return json({ error: `Auth delete failed: ${delErr.message}` }, 500);

    return json({ ok: true });
  } catch (e) {
    console.error("[delete-rep] fatal:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
