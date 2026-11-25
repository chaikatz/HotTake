import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
import type { HotTakePlacesModule } from "../../modules/hottake-places";
import { categoryFromApple, categoryFromOsm } from "@/utils/categories";

/**
 * Place search for the post flow.
 *
 * Primary: Apple Maps (MKLocalSearch) through the local module in
 * `modules/hottake-places` — real restaurants, bars and shops, no key needed.
 * Expo Go doesn't contain that module, so there we fall back to Photon, a free
 * OpenStreetMap search, so the whole flow can be tested in Expo Go today.
 */
export interface Place {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  lat: number;
  lng: number;
  category: string;
  source: "apple" | "osm";
}

const native = Platform.OS === "ios" ? requireOptionalNativeModule<HotTakePlacesModule>("HotTakePlaces") : null;

export function placeSearchSource(): "apple" | "osm" {
  return native ? "apple" : "osm";
}

const NYC = { lat: 40.7306, lng: -73.9866 };

export async function searchPlaces(query: string, near?: { lat: number; lng: number } | null): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const center = near ?? NYC;
  if (native) {
    const results = await native.search(q, center.lat, center.lng);
    return results
      .filter((p) => p && p.name && Number.isFinite(p.lat) && Number.isFinite(p.lng))
      .map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        neighborhood: p.neighborhood,
        city: p.city,
        lat: p.lat,
        lng: p.lng,
        category: categoryFromApple(p.category),
        source: "apple" as const,
      }));
  }
  return searchPhoton(q, center);
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id?: number;
    osm_type?: string;
    osm_key?: string;
    osm_value?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    locality?: string;
    city?: string;
    state?: string;
    type?: string;
  };
}

async function searchPhoton(q: string, center: { lat: number; lng: number }): Promise<Place[]> {
  const url =
    `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}` +
    `&lat=${center.lat}&lon=${center.lng}&limit=12&lang=en`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = (await res.json()) as { features?: PhotonFeature[] };
  const out: Place[] = [];
  const seen = new Set<string>();
  for (const f of json.features ?? []) {
    const p = f.properties;
    if (!p.name) continue;
    const id = `osm:${p.osm_type ?? ""}${p.osm_id ?? ""}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const [lng, lat] = f.geometry.coordinates;
    out.push({
      id,
      name: p.name,
      address: [p.housenumber, p.street].filter(Boolean).join(" "),
      neighborhood: p.locality || p.district || "",
      city: p.city || p.state || "",
      lat,
      lng,
      category: categoryFromOsm(p.osm_key, p.osm_value),
      source: "osm",
    });
  }
  return out;
}

export function placeSubtitle(p: { address?: string | null; neighborhood?: string | null; city?: string | null }): string {
  return [p.address, p.neighborhood, p.city].filter((x) => x && x.trim()).join(" · ");
}
