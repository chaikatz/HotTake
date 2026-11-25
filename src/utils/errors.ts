/** A message a person can read, from whatever was thrown. */
export function errorMessage(e: unknown): string {
  if (!e) return "Something went wrong.";
  if (typeof e === "string") return e;
  const anyE = e as { message?: string; error_description?: string };
  const raw = anyE.message || anyE.error_description || "Something went wrong.";
  if (/invite_invalid/.test(raw)) return "That invite code isn't valid or was already used.";
  if (/name_required/.test(raw)) return "Add your real name to continue.";
  if (/not_member/.test(raw)) return "Finish joining first.";
  if (/Network request failed|Failed to fetch/i.test(raw)) return "No connection. Check your internet and try again.";
  return raw;
}
