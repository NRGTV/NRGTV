import { Router, type IRouter } from "express";
import { createClient } from "@supabase/supabase-js";

// Service-role client — only ever used server-side. Never ship this key to the client.
const adminSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Anon-scoped client, used only to resolve who the caller is from their JWT.
const anonSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const ADMIN_USER_IDS = ["your-own-uid-here"]; // swap for a real allowlist / roles table later

const router: IRouter = Router();

router.post("/admin/set-verified", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }
  const token = authHeader.slice("Bearer ".length);

  const { data: { user }, error: userError } = await anonSupabase.auth.getUser(token);
  if (userError || !user || !ADMIN_USER_IDS.includes(user.id)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { targetUserId, verifiedType } = req.body ?? {};
  if (!targetUserId || typeof targetUserId !== "string") {
    return res.status(400).json({ error: "Missing targetUserId" });
  }

  const { error } = await adminSupabase
    .from("profiles")
    .update({ is_verified: true, verified_type: verifiedType ?? "creator" })
    .eq("id", targetUserId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ success: true });
});

export default router;
