import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import type { MapSubject } from "@/types/db";
import { MapPin } from "./MapPin";

export interface TakeMapHandle {
  centerOn: (lat: number, lng: number, span?: number) => void;
}

export const NYC_REGION = { latitude: 40.7233, longitude: -73.998, latitudeDelta: 0.06, longitudeDelta: 0.06 };

/** Apple Maps with a pin for every subject that has a location. */
export const TakeMap = forwardRef<TakeMapHandle, {
  subjects: MapSubject[];
  onOpen: (id: string) => void;
  showsUser: boolean;
}>(function TakeMap({ subjects, onOpen, showsUser }, ref) {
  const map = useRef<MapView>(null);
  useImperativeHandle(ref, () => ({
    centerOn: (lat, lng, span = 0.03) =>
      map.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: span, longitudeDelta: span }, 450),
  }));
  return (
    <MapView
      ref={map}
      style={StyleSheet.absoluteFill}
      initialRegion={NYC_REGION}
      showsUserLocation={showsUser}
      showsPointsOfInterests={false}
      showsCompass={false}
      pitchEnabled={false}
    >
      {subjects.map((s) => (
        <Marker
          key={`${s.id}:${s.avg_rating}`}
          coordinate={{ latitude: s.lat, longitude: s.lng }}
          onPress={() => onOpen(s.id)}
          tracksViewChanges={false}
          title={s.name}
        >
          <MapPin rating={s.avg_rating} category={s.category} />
        </Marker>
      ))}
    </MapView>
  );
});
