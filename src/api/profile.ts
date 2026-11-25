import { supabase } from "@/lib/supabase";
import type { DisplayMode, Invite } from "@/types/db";

export async function updateProfile(patch: { display_mode?: DisplayMode; real_name?: string }): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not signed in");
  const { error } = await supabase.from("profiles").update(patch).eq("id", uid);
  if (error) throw error;
}

export async function myInvites(): Promise<Invite[]> {
  const { data, error } = await supabase
    .from("invites")
    .select("code, used_at, created_at")
    .order("used_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Invite[]) ?? [];
}

export async function myTakeCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("takes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

/** Deletes the account and everything in it (edge function `delete-account`). */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke("delete-account", { body: {} });
  if (error) throw error;
  await supabase.auth.signOut({ scope: "local" });
}
