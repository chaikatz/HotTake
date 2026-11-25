import React from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { myTakeCount } from "@/api/profile";
import { useUserTakes } from "@/api/takes";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { TakeCard } from "@/components/TakeCard";
import { useSession } from "@/providers/SessionProvider";
import { colors, radii, shadow } from "@/theme";

export default function Me() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const takes = useUserTakes(profile?.id);
  const list = takes.data ?? [];
  const countQ = useQuery({
    queryKey: ["takeCount", profile?.id],
    enabled: !!profile?.id,
    queryFn: () => myTakeCount(profile!.id),
  });
  const count = countQ.data ?? list.length;
  const anonymous = profile?.display_mode === "anonymous";
  const spicy = list.filter((t) => t.is_spicy).length;
  const agrees = list.reduce((n, t) => n + t.agree_count, 0);

  const header = (
    <View>
      <View style={[styles.top, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.screenTitle}>Me</Text>
        <Pressable onPress={() => router.push("/settings")} hitSlop={10} accessibilityLabel="Settings">
          <Ionicons name="settings-outline" size={24} color={colors.ink} />
        </Pressable>
      </View>
      <View style={[styles.card, shadow.card]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Avatar name={profile?.real_name ?? "?"} anonymous={anonymous} size={60} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile?.real_name}</Text>
            <Text style={styles.shows}>
              {anonymous ? "🕶️ Your takes show as Anonymous" : "🙋 Your takes show your name"}
            </Text>
          </View>
        </View>
        <View style={styles.stats}>
          <Stat value={count} label={count === 1 ? "take" : "takes"} big />
          <Stat value={spicy} label="spicy 🌶️" />
          <Stat value={agrees} label="agrees 🙌" />
        </View>
        <Pressable onPress={() => router.push("/invites")} style={styles.inviteRow}>
          <Text style={{ fontSize: 20 }}>🎟️</Text>
          <Text style={styles.inviteText}>Invite friends</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
        </Pressable>
      </View>
      <Text style={styles.section}>Your takes</Text>
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      data={list}
      keyExtractor={(t) => t.id}
      renderItem={({ item }) => <TakeCard take={item} />}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: 32 }}
      onRefresh={() => {
        void takes.refetch();
        void countQ.refetch();
      }}
      refreshing={takes.isRefetching}
      ListEmptyComponent={
        takes.isLoading ? (
          <ActivityIndicator color={colors.hot} style={{ marginTop: 32 }} />
        ) : (
          <EmptyState
            emoji="🫣"
            title="No takes yet"
            body="Your first one takes 20 seconds. Pick something, crank the heat, say it."
            action={{ title: "Drop a hot take 🔥", onPress: () => router.push("/post") }}
          />
        )
      }
    />
  );
}

function Stat({ value, label, big }: { value: number; label: string; big?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, big && { color: colors.hot }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 10 },
  screenTitle: { fontSize: 30, fontWeight: "900", color: colors.ink, letterSpacing: -0.8 },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, marginHorizontal: 16, padding: 18 },
  name: { fontSize: 22, fontWeight: "900", color: colors.ink, letterSpacing: -0.4 },
  shows: { fontSize: 13, color: colors.inkSoft, marginTop: 3, fontWeight: "600" },
  stats: { flexDirection: "row", marginTop: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: 14 },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 28, fontWeight: "900", color: colors.ink, fontVariant: ["tabular-nums"] },
  statLabel: { fontSize: 12, color: colors.inkSoft, fontWeight: "700", marginTop: 2 },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    backgroundColor: colors.sunken,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inviteText: { flex: 1, fontWeight: "800", fontSize: 15, color: colors.ink },
  section: { fontSize: 13, fontWeight: "800", color: colors.inkFaint, letterSpacing: 0.6, textTransform: "uppercase", marginHorizontal: 20, marginTop: 24, marginBottom: 10 },
});
