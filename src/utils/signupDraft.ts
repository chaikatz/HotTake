import type { DisplayMode } from "@/types/db";

/** What someone has told us so far while joining, across the sign-up screens. */
export const signupDraft: { realName: string; displayMode: DisplayMode } = {
  realName: "",
  displayMode: "real",
};
