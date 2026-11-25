import React from "react";
import { ActivityIndicator, FlatList, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { childSubjects, subjectSummary } from "@/api/subjects";
import { useSubjectTakes } from "@/api/takes";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { HeatBadge } from "@/components/HeatBadge";
import { TakeCard } from "@/components/TakeCard";
import { TopBar } from "@/components/TopBar";
import { colors, heatColor, heatLevel, radii, shadow } from "@/theme";
import { categoryEmoji, categoryLabel } from "@/utils/categories";

export default function SubjectPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const summary = useQuery({ queryKey: ["subject", id], queryFn: () => subjectSummary(id), enabled: !!id });
  const children = useQuery({ queryKey: ["children", id], queryFn: () => childSubjects(id), enabled: !!id });
  const takes = useSubjectTakes(id);
  const s = summary.data;

  if (summary.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <TopBar />
        <ActivityIndicator color={colors.hot} style={{ marginTop: 48 }} />
      </View>
    );
  }
  if (!s) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <TopBar />
        <EmptyState emoji="🫥" title="Not found" body="This subject doesn't exist anymore." />
      </View>
    );
  }

  const avg = s.avg_rating == null ? null : Number(s.avg_rating);
  const level = avg == null ? null : heatLevel(avg);
  const where = [s.address, s.neighborhood, s.city].filter(Boolean).join(" · ");

  const openInMaps = () => {
    if (s.lat == null || s.lng == null) return;
    const q = encodeURIComponent(s.name);
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?q=${q}&ll=${s.lat},${s.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`;
    void Linking.openURL(url);
  };

  const header = (
    <View>
      <View style={[styles.hero, shadow.card]}>
        <View style={styles.kind}>
          <Text style={{ fontSize: 16 }}>{categoryEmoji(s.category)}</Text>
          <Text style={styles.kindText}>{categoryLabel(s.category)}</Text>
        </View>
        <Text style={styles.name}>{s.name}</Text>
        {s.parent_id ? (
          <Pressable onPress={() => router.push(`/subject/${s.parent_id}`)}>
            <Text style={styles.parent}>at {s.parent_name} ›</Text>
          </Pressable>
        ) : null}
        {where ? (
          <Pressable onPress={openInMaps} style={styles.whereRow} disabled={s.lat == null}>
            <Ionicons name="location-outline" size={15} color={colors.inkSoft} />
            <Text style={styles.where} numberOfLines={2}>
              {where}
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.scoreRow}>
          <HeatBadge rating={avg} size="xl" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.level, { color: avg == null ? colors.inkFaint : heatColor(avg) }]}>
              {level ? `${level.label} ${level.emoji}` : "No takes yet"}
            </Text>
            <Text style={styles.count}>
              {s.take_count} {s.take_count === 1 ? "take" : "takes"} · average heat
            </Text>
          </View>
        </View>
        <Button
          title="Add your take 🔥"
          variant="hot"
          size="md"
          style={{ marginTop: 16 }}
          onPress={() => router.push({ pathname: "/post", params: { subjectId: s.id, subjectName: s.name } })}
        />
      </View>

      {children.data && children.data.length ? (
        <View style={[styles.menu, shadow.card]}>
          <Text style={styles.sectionInCard}>{s.is_place ? "On the menu" : "Related"}</Text>
          {children.data.map((c) => (
            <Pressable key={c.id} onPress={() => router.push(`/subject/${c.id}`)} style={styles.childRow}>
              <Text style={{ fontSize: 18 }}>{categoryEmoji(c.category)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.childName} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={styles.childMeta}>
                  {c.take_count} {c.take_count === 1 ? "take" : "takes"}
                </Text>
              </View>
              <HeatBadge rating={c.avg_rating == null ? null : Number(c.avg_rating)} size="sm" />
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={styles.section}>Takes</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title={s.name} />
      <FlatList
        data={takes.data ?? []}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TakeCard take={item} hideSubject />}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 40 }}
        onRefresh={() => {
          void summary.refetch();
          void children.refetch();
          void takes.refetch();
        }}
        refreshing={takes.isRefetching}
        ListEmptyComponent={
          takes.isLoading ? <ActivityIndicator color={colors.hot} style={{ marginTop: 24 }} /> : (
            <Text style={styles.noTakes}>No takes on this yet. Yours could be the first.</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.card, borderRadius: radii.xl, marginHorizontal: 16, padding: 20, marginTop: 4 },
  kind: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: colors.sunken, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  kindText: { fontSize: 12, fontWeight: "800", color: colors.inkSoft, letterSpacing: 0.3 },
  name: { fontSize: 32, fontWeight: "900", color: colors.ink, letterSpacing: -1, marginTop: 10 },
  parent: { fontSize: 16, fontWeight: "800", color: colors.hot, marginTop: 4 },
  whereRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  where: { fontSize: 14, color: colors.inkSoft, flex: 1 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 18 },
  level: { fontSize: 20, fontWeight: "900", letterSpacing: -0.3 },
  count: { fontSize: 14, color: colors.inkSoft, marginTop: 2, fontWeight: "600" },
  menu: { backgroundColor: colors.card, borderRadius: radii.xl, marginHorizontal: 16, padding: 16, marginTop: 12 },
  sectionInCard: { fontSize: 13, fontWeight: "800", color: colors.inkFaint, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 },
  childRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  childName: { fontSize: 16, fontWeight: "800", color: colors.ink },
  childMeta: { fontSize: 12, color: colors.inkSoft, marginTop: 1 },
  section: { fontSize: 13, fontWeight: "800", color: colors.inkFaint, letterSpacing: 0.6, textTransform: "uppercase", marginHorizontal: 20, marginTop: 24, marginBottom: 10 },
  noTakes: { textAlign: "center", color: colors.inkSoft, marginTop: 12 },
});
