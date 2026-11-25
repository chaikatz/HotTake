import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import type { DisplayMode, Profile } from "@/types/db";

const PENDING_INVITE_KEY = "hottake.pendingInvite";

export function normalizeInvite(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** True when the code exists and hasn't been used. Works signed out. */
export async function checkInvite(code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_invite", { p_code: normalizeInvite(code) });
  if (error) throw error;
  return data === true;
}

/** The invite someone entered, kept until their account exists. */
export async function savePendingInvite(code: string): Promise<void> {
  await AsyncStorage.setItem(PENDING_INVITE_KEY, normalizeInvite(code));
}
export async function getPendingInvite(): Promise<string | null> {
  return AsyncStorage.getItem(PENDING_INVITE_KEY);
}
export async function clearPendingInvite(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_INVITE_KEY);
}

export type SendCodeResult = { mode: "sms" } | { mode: "tester"; reason: string };

/**
 * Text a sign-in code. When Supabase has no SMS provider switched on yet the
 * request fails with a provider error; the caller can then offer tester
 * sign-in instead (see `allowTestLogin`).
 */
export async function sendCode(phone: string): Promise<SendCodeResult> {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (!error) return { mode: "sms" };
  const msg = `${error.message} ${(error as { code?: string }).code ?? ""}`;
  if (/provider|disabled|unsupported|sms|twilio|not enabled|phone_provider/i.test(msg)) {
    return { mode: "tester", reason: error.message };
  }
  throw error;
}

export async function verifyCode(phone: string, token: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) throw error;
}

/** Sign in with the shared tester code (edge function `test-login`). */
export async function testerSignIn(phone: string, code: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("test-login", { body: { phone, code } });
  if (error) {
    let message = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      const body = ctx ? await ctx.json() : null;
      if (body?.error) message = body.error;
    } catch {
      // keep the generic message
    }
    throw new Error(message);
  }
  const { access_token, refresh_token } = data as { access_token: string; refresh_token: string };
  const { error: setError } = await supabase.auth.setSession({ access_token, refresh_token });
  if (setError) throw setError;
}

export async function fetchMyProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function completeSignup(args: {
  code: string;
  realName: string;
  displayMode: DisplayMode;
}): Promise<Profile> {
  const { data, error } = await supabase.rpc("complete_signup", {
    p_code: normalizeInvite(args.code),
    p_real_name: args.realName.trim(),
    p_display_mode: args.displayMode,
  });
  if (error) throw error;
  await clearPendingInvite();
  return data as Profile;
}
