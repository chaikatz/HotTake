import React, { forwardRef, useImperativeHandle } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme";
import type { MapSubject } from "@/types/db";
import { HeatBadge } from "./HeatBadge";

export interface TakeMapHandle {
  centerOn: (lat: number, lng: number, span?: number) => void;
}

export const NYC_REGION = { latitude: 40.7233, longitude: -73.998, latitudeDelta: 0.06, longitudeDelta: 0.06 };

/** The browser preview has no Apple Maps; list the pinned subjects instead. */
export const TakeMap = forwardRef<TakeMapHandle, {
  subjects: MapSubject[];
  onOpen: (id: string) => void;
  showsUser: boolean;
}>(function TakeMap({ subjects, onOpen }, ref) {
  useImperativeHandle(ref, () => ({ centerOn: () => {} }));
  return (
    <ScrollView style={[StyleSheet.absoluteFill, { backgroundColor: "#E9EEF2" }]} contentContainerStyle={{ padding: 16, paddingTop: 120, gap: 10 }}>
      <Text style={{ color: colors.inkSoft, marginBottom: 6 }}>Map preview (Apple Maps shows on iPhone)</Text>
      {subjects.map((s) => (
        <Pressable key={s.id} onPress={() => onOpen(s.id)} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "800", fontSize: 16 }}>{s.name}</Text>
            <Text style={{ color: colors.inkSoft }}>
              {s.lat.toFixed(4)}, {s.lng.toFixed(4)} · {s.take_count} takes
            </Text>
          </View>
          <HeatBadge rating={s.avg_rating} size="sm" />
        </Pressable>
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 14, borderRadius: 14 },
});
