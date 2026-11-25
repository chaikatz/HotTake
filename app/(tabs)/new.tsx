import { Redirect } from "expo-router";

/** The center tab only opens the post flow; this screen is never shown. */
export default function New() {
  return <Redirect href="/post" />;
}
