import { Platform, type TextStyle } from "react-native";

/**
 * Hot Take design tokens.
 *
 * Loud and playful in colour, clean and premium in layout: a warm white page,
 * near-black ink, and heat — blue for a cold take through yellow to a red-pink
 * blaze for a 10. Heat is the only loud thing on the screen, so it always
 * means "rating".
 */
export const colors = {
  bg: "#FAF9F7",
  card: "#FFFFFF",
  sunken: "#F2F0EC",
  ink: "#111111",
  inkSoft: "#5E5A54",
  inkFaint: "#A39E96",
  line: "#ECE9E4",
  lineStrong: "#DCD8D1",
  hot: "#FF3B30",
  hotDeep: "#E5163F",
  orange: "#FF7A00",
  pink: "#FF2D7A",
  agree: "#12B76A",
  disagree: "#7A5AF8",
  spicy: "#FF3B30",
  white: "#FFFFFF",
  overlay: "rgba(17,17,17,0.5)",
} as const;

/** The primary "hot" gradient used for the post button and brand moments. */
export const hotGradient = ["#FF9500", "#FF3B30", "#FF2D7A"] as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radii = { sm: 8, md: 14, lg: 20, xl: 28, round: 999 } as const;

const rounded = Platform.select({ ios: "System", default: undefined });

export const type = {
  display: { fontSize: 40, fontWeight: "900", letterSpacing: -1.2, color: colors.ink } as TextStyle,
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.6, color: colors.ink } as TextStyle,
  heading: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3, color: colors.ink } as TextStyle,
  body: { fontSize: 16, lineHeight: 22, color: colors.ink } as TextStyle,
  take: { fontSize: 17, lineHeight: 24, color: colors.ink, letterSpacing: -0.1 } as TextStyle,
  label: { fontSize: 13, fontWeight: "700", color: colors.inkSoft, letterSpacing: 0.2 } as TextStyle,
  caption: { fontSize: 13, color: colors.inkFaint } as TextStyle,
  number: { fontFamily: rounded, fontWeight: "900", fontVariant: ["tabular-nums"] } as TextStyle,
};

export const shadow = {
  card: Platform.select({
    ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 2 },
    default: {},
  }),
  lift: Platform.select({
    ios: { shadowColor: "#FF3B30", shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
    android: { elevation: 6 },
    default: {},
  }),
};

// ---------------------------------------------------------------------------
// Heat: rating → colour, label and emoji
// ---------------------------------------------------------------------------

/** Colour stops along the 0–10 scale. */
export const HEAT_STOPS: readonly { at: number; color: string }[] = [
  { at: 0, color: "#2F6BFF" },
  { at: 2.5, color: "#22B8F0" },
  { at: 4.5, color: "#8BD17C" },
  { at: 6, color: "#FFC21A" },
  { at: 7.5, color: "#FF8A00" },
  { at: 8.7, color: "#FF3B30" },
  { at: 10, color: "#FF1F7A" },
];

/** Inputs and outputs for Reanimated's interpolateColor. */
export const HEAT_INPUT = HEAT_STOPS.map((s) => s.at);
export const HEAT_OUTPUT = HEAT_STOPS.map((s) => s.color);

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** The colour of a rating, blended between the heat stops. */
export function heatColor(rating: number): string {
  const r = Math.max(0, Math.min(10, rating));
  for (let i = 1; i < HEAT_STOPS.length; i++) {
    const a = HEAT_STOPS[i - 1];
    const b = HEAT_STOPS[i];
    if (r <= b.at) {
      const t = (r - a.at) / (b.at - a.at);
      const [ar, ag, ab] = hexToRgb(a.color);
      const [br, bg, bb] = hexToRgb(b.color);
      return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
    }
  }
  return HEAT_STOPS[HEAT_STOPS.length - 1].color;
}

/** A two-colour gradient for a rating badge: a touch cooler on the left. */
export function heatGradient(rating: number): [string, string] {
  return [heatColor(Math.max(0, rating - 1.2)), heatColor(rating)];
}

export interface HeatLevel {
  label: string;
  emoji: string;
}

export function heatLevel(rating: number): HeatLevel {
  if (rating >= 9.8) return { label: "Nuclear", emoji: "☢️" };
  if (rating >= 9) return { label: "Scorching", emoji: "🥵" };
  if (rating >= 8) return { label: "On fire", emoji: "🔥" };
  if (rating >= 7) return { label: "Hot", emoji: "😋" };
  if (rating >= 5.5) return { label: "Warm", emoji: "🙂" };
  if (rating >= 4) return { label: "Lukewarm", emoji: "😐" };
  if (rating >= 2) return { label: "Chilly", emoji: "🥶" };
  return { label: "Ice cold", emoji: "🧊" };
}

/** Pick black or white text for a background colour. */
export function onColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.72 ? colors.ink : colors.white;
}

export function formatRating(rating: number | string | null | undefined): string {
  const n = typeof rating === "string" ? parseFloat(rating) : rating;
  if (n == null || Number.isNaN(n)) return "–";
  return n.toFixed(1);
}
