import { router } from "expo-router";

/** Leave whatever stack we're in and let the root decide where we belong. */
export function resetTo(path: "/" | "/welcome-in" = "/"): void {
  try {
    router.dismissAll();
  } catch {
    // nothing pushed
  }
  router.replace(path);
}
