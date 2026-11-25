// Tester sign-in, for while SMS isn't switched on in Supabase yet.
//
// The app tries a real SMS code first. When Supabase has no SMS provider it
// falls back to this: the tester enters their phone number and the shared
// TESTER CODE (secret TEST_LOGIN_CODE). We create or find the auth user for
// that phone (phone marked confirmed, so real SMS sign-in later finds the same
// account), set a throwaway password on a hidden email identity, sign in, and
// hand the session back.
//
// TURN OFF before real launch: delete the TEST_LOGIN_CODE secret (this then
// refuses every request), or delete this function.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.119.2";
import { corsHeaders, json } from "../_shared/cors.ts";

function randomPassword(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const secret = Deno.env.get("TEST_LOGIN_CODE");
  if (!secret) return json({ error: "Tester sign-in is switched off." }, 403);

  let body: { phone?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }
  const digits = (body.phone ?? "").replace(/\D/g, "");
  const code = (body.code ?? "").trim();
  if (digits.length < 8 || digits.length > 15) return json({ error: "That phone number doesn't look right." }, 400);
  if (!timingSafeEqual(code, secret)) {
    await new Promise((r) => setTimeout(r, 600));
    return json({ error: "Wrong tester code." }, 401);
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });

  const email = `p${digits}@testers.hottake.app`;
  const password = randomPassword();

  const { data: existingId, error: lookupError } = await admin.rpc("auth_user_id_by_phone", { p_phone: digits });
  if (lookupError) {
    console.error("lookup failed", lookupError);
    return json({ error: "Couldn't sign you in." }, 500);
  }

  if (existingId) {
    const { error } = await admin.auth.admin.updateUserById(existingId as string, {
      email,
      email_confirm: true,
      password,
    });
    if (error) {
      console.error("update failed", error);
      return json({ error: "Couldn't sign you in." }, 500);
    }
  } else {
    const { error } = await admin.auth.admin.createUser({
      phone: digits,
      phone_confirm: true,
      email,
      email_confirm: true,
      password,
      user_metadata: { tester: true },
    });
    if (error) {
      console.error("create failed", error);
      return json({ error: "Couldn't create your account." }, 500);
    }
  }

  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    console.error("sign-in failed", error);
    return json({ error: "Couldn't sign you in." }, 500);
  }
  return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
});
