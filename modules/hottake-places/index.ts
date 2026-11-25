/**
 * Native Apple Maps place search (MKLocalSearch). See `src/api/places.ts`,
 * which loads this optionally: Expo Go doesn't include it, so there the app
 * falls back to an OpenStreetMap search until you run a dev/TestFlight build.
 */
export interface NativePlace {
  /** Apple's identifier where the OS offers one, else a stable derived key. */
  id: string;
  name: string;
  /** Street address, e.g. "275 Mulberry St". */
  address: string;
  /** Apple's subLocality, which in New York is usually the neighborhood ("SoHo"). */
  neighborhood: string;
  city: string;
  lat: number;
  lng: number;
  /** Apple's category, e.g. "MKPOICategoryRestaurant", when known. */
  category: string;
}

export interface HotTakePlacesModule {
  search(query: string, lat: number | null, lng: number | null): Promise<NativePlace[]>;
}
