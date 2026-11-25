// Deletes the signed-in member's account: their photos in storage, then the
// auth user, which cascades to their profile, takes, reactions, reports,
// blocks and invites. Apple requires in-app account deletion.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.119.2";
import { corsHeaders, json } from "../_shared/cors.ts";

const BUCKET = "take-photos";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const uid = userData?.user?.id;
  if (userError || !uid) return json({ error: "Not signed in." }, 401);

  // Photos live under "<uid>/..." in the bucket.
  for (let page = 0; page < 20; page++) {
    const { data: files, error } = await admin.storage.from(BUCKET).list(uid, { limit: 100 });
    if (error || !files || files.length === 0) break;
    await admin.storage.from(BUCKET).remove(files.map((f) => `${uid}/${f.name}`));
    if (files.length < 100) break;
  }

  const { error } = await admin.auth.admin.deleteUser(uid);
  if (error) {
    console.error("delete failed", error);
    return json({ error: "Couldn't delete the account. Try again." }, 500);
  }
  return json({ ok: true });
});
