/** Subject categories: what a take can be about. */
export interface Category {
  id: string;
  label: string;
  emoji: string;
}

export const CATEGORIES: Record<string, Category> = {
  restaurant: { id: "restaurant", label: "Restaurant", emoji: "🍽️" },
  dish: { id: "dish", label: "Dish", emoji: "🍝" },
  drink: { id: "drink", label: "Drink", emoji: "🍸" },
  cafe: { id: "cafe", label: "Café", emoji: "☕" },
  bar: { id: "bar", label: "Bar", emoji: "🍻" },
  bakery: { id: "bakery", label: "Bakery", emoji: "🥐" },
  store: { id: "store", label: "Shop", emoji: "🛍️" },
  place: { id: "place", label: "Place", emoji: "📍" },
  product: { id: "product", label: "Product", emoji: "📦" },
  film: { id: "film", label: "Film / TV", emoji: "🎬" },
  music: { id: "music", label: "Music", emoji: "🎵" },
  idea: { id: "idea", label: "Idea", emoji: "💡" },
  other: { id: "other", label: "Other", emoji: "✨" },
};

/** What someone can create by hand (places come from map search). */
export const CREATABLE: Category[] = ["dish", "drink", "product", "film", "music", "idea", "other"].map(
  (id) => CATEGORIES[id],
);

export function categoryEmoji(id: string | null | undefined): string {
  return (id && CATEGORIES[id]?.emoji) || "✨";
}

export function categoryLabel(id: string | null | undefined): string {
  return (id && CATEGORIES[id]?.label) || "Other";
}

/** Apple Maps point-of-interest categories → ours. */
export function categoryFromApple(poi: string | null | undefined): string {
  const p = (poi || "").replace("MKPOICategory", "").toLowerCase();
  if (!p) return "place";
  if (p === "restaurant" || p === "foodmarket") return p === "restaurant" ? "restaurant" : "store";
  if (p === "cafe") return "cafe";
  if (p === "bakery") return "bakery";
  if (p === "nightlife" || p === "brewery" || p === "winery" || p === "distillery") return "bar";
  if (p === "store") return "store";
  return "place";
}

/** OpenStreetMap tags (Photon fallback search) → ours. */
export function categoryFromOsm(key: string | undefined, value: string | undefined): string {
  const v = (value || "").toLowerCase();
  if (["restaurant", "fast_food", "food_court"].includes(v)) return "restaurant";
  if (["cafe", "coffee", "ice_cream"].includes(v)) return "cafe";
  if (["bar", "pub", "biergarten", "nightclub", "wine_bar"].includes(v)) return "bar";
  if (["bakery", "pastry", "confectionery"].includes(v)) return "bakery";
  if (key === "shop") return "store";
  return "place";
}
