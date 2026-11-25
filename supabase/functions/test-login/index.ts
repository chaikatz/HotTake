// Tester sign-in, for while SMS isn't switched on in Supabase yet.
//
// The app tries a real SMS code first. When Supabase has no SMS provider it
// falls back to this: the tester enters their phone number and the shared
// tester code (stored in private.settings, key 'tester_code'). We create or find the auth user for
// that phone (phone marked confirmed, so real SMS sign-in later finds the same
// account), set a throwaway password on a hidden email identity, sign in, and
// hand the session back.
//
// TURN OFF before real launch: run
//   delete from private.settings where key = 'tester_code';
// (this then refuses every request), or delete this function.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.119.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function randomPassword(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let body: { phone?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }
  const digits = (body.phone ?? "").replace(/\D/g, "");
  const code = (body.code ?? "").trim();
  if (digits.length < 8 || digits.length > 15) return json({ error: "That phone number doesn't look right." }, 400);

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });

  const { data: matches, error: codeError } = await admin.rpc("tester_code_matches", { p_code: code });
  if (codeError) {
    console.error("code check failed", codeError);
    return json({ error: "Couldn't sign you in." }, 500);
  }
  if (matches === null) return json({ error: "Tester sign-in is switched off." }, 403);
  if (matches !== true) {
    await new Promise((r) => setTimeout(r, 600));
    return json({ error: "Wrong tester code." }, 401);
  }

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
