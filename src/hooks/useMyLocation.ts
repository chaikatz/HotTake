import { useCallback, useState } from "react";
import * as Location from "expo-location";

export interface LatLng {
  lat: number;
  lng: number;
}

/** Ask for the phone's location only when the person taps for it. */
export function useMyLocation() {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [denied, setDenied] = useState(false);

  const request = useCallback(async (): Promise<LatLng | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setDenied(true);
        return null;
      }
      const last = await Location.getLastKnownPositionAsync();
      const pos = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLocation(here);
      return here;
    } catch {
      return null;
    }
  }, []);

  /** Location without prompting, if permission was already given. */
  const quiet = useCallback(async (): Promise<LatLng | null> => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return null;
      const last = await Location.getLastKnownPositionAsync();
      if (!last) return null;
      const here = { lat: last.coords.latitude, lng: last.coords.longitude };
      setLocation(here);
      return here;
    } catch {
      return null;
    }
  }, []);

  return { location, denied, request, quiet };
}
