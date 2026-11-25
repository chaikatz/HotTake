import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import { requireEnv } from "./env";

const { supabaseUrl, supabaseAnonKey } = requireEnv();

export const SUPABASE_URL = supabaseUrl;
export const PHOTO_BUCKET = "take-photos";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh tokens only while the app is in the foreground.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Public URL for a photo in storage. */
export function photoUrl(path: string, width = 1080): string {
  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  // Width is a hint for future image transforms; the public URL works as is.
  void width;
  return data.publicUrl;
}
