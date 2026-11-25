import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mapSubjects } from "@/api/subjects";
import { TakeMap, type TakeMapHandle } from "@/components/TakeMap";
import { useMyLocation } from "@/hooks/useMyLocation";
import { colors, shadow } from "@/theme";

export default function MapTab() {
  const insets = useSafeAreaInsets();
  const map = useRef<TakeMapHandle>(null);
  const { location, request, quiet } = useMyLocation();
  const q = useQuery({ queryKey: ["map"], queryFn: mapSubjects });
  const subjects = q.data ?? [];

  useEffect(() => {
    void quiet();
  }, [quiet]);

  return (
    <View style={{ flex: 1 }}>
      <TakeMap ref={map} subjects={subjects} showsUser={!!location} onOpen={(id) => router.push(`/subject/${id}`)} />
      <View style={[styles.header, { top: insets.top + 8 }]} pointerEvents="box-none">
        <View style={[styles.pill, shadow.card]}>
          <Text style={styles.pillText}>🔥 {subjects.length} {subjects.length === 1 ? "spot" : "spots"} with takes</Text>
          {q.isFetching ? <ActivityIndicator size="small" color={colors.hot} /> : null}
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable onPress={() => q.refetch()} style={[styles.round, shadow.card]} accessibilityLabel="Refresh">
            <Ionicons name="refresh" size={20} color={colors.ink} />
          </Pressable>
          <Pressable
            onPress={async () => {
              const here = location ?? (await request());
              if (here) map.current?.centerOn(here.lat, here.lng, 0.025);
            }}
            style={[styles.round, shadow.card]}
            accessibilityLabel="Show my location"
          >
            <Ionicons name="navigate" size={20} color={colors.ink} />
          </Pressable>
        </View>
      </View>
      {!q.isLoading && subjects.length === 0 ? (
        <View style={[styles.empty, shadow.card]}>
          <Text style={styles.emptyTitle}>No pins yet 📍</Text>
          <Text style={styles.emptyBody}>Post a take about a place and it lands here.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { position: "absolute", left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 21,
  },
  pillText: { fontWeight: "800", fontSize: 14, color: colors.ink },
  round: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  empty: { position: "absolute", left: 24, right: 24, bottom: 24, backgroundColor: colors.card, borderRadius: 20, padding: 18 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: colors.ink },
  emptyBody: { color: colors.inkSoft, marginTop: 4 },
});
