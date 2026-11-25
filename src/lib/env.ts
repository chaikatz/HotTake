/**
 * Environment configuration.
 *
 * Values come from EXPO_PUBLIC_* variables in `.env` (committed: both values
 * are public by design — row level security protects the data, not the key).
 * The Claude API key is NOT here and never will be: it lives only in the
 * Supabase edge function secrets.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export function requireEnv(): { supabaseUrl: string; supabaseAnonKey: string } {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and " +
        "EXPO_PUBLIC_SUPABASE_ANON_KEY in .env (or in the EAS environment for builds).",
    );
  }
  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Tester sign-in: while SMS isn't switched on in Supabase, testers can sign in
 * with a shared tester code checked by the `test-login` edge function. It is
 * also gated server-side (the function refuses unless TEST_LOGIN_CODE is set),
 * so turning it off is a one-line change on either side.
 */
export function allowTestLogin(): boolean {
  const flag = process.env.EXPO_PUBLIC_ALLOW_TEST_LOGIN;
  return flag !== "0" && flag !== "false";
}
