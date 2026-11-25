import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFeed } from "@/api/takes";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { TakeCard } from "@/components/TakeCard";
import { Wordmark } from "@/components/Wordmark";
import { useSession } from "@/providers/SessionProvider";
import { colors, radii, shadow } from "@/theme";
import type { TakeCard as Take } from "@/types/db";
import { errorMessage } from "@/utils/errors";

export default function Feed() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const feed = useFeed();
  const [refreshing, setRefreshing] = useState(false);
  const takes = useMemo(() => feed.data?.pages.flat() ?? [], [feed.data]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await feed.refetch();
    setRefreshing(false);
  }, [feed]);

  const header = (
    <View>
      <Pressable onPress={() => router.push("/post")} style={styles.composer}>
        <Avatar name={profile?.real_name ?? "You"} anonymous={profile?.display_mode === "anonymous"} size={36} />
        <Text style={styles.composerText}>What's your hot take?</Text>
        <Text style={{ fontSize: 22 }}>🔥</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.top, { paddingTop: insets.top + 6 }]}>
        <Wordmark size={30} />
        <Pressable onPress={() => router.push("/invites")} hitSlop={10} style={styles.invite}>
          <Ionicons name="gift-outline" size={18} color={colors.ink} />
          <Text style={styles.inviteText}>Invite</Text>
        </Pressable>
      </View>
      <FlatList<Take>
        data={takes}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TakeCard take={item} />}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.hot} />}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
        }}
        ListEmptyComponent={
          feed.isLoading ? (
            <ActivityIndicator color={colors.hot} style={{ marginTop: 48 }} />
          ) : feed.error ? (
            <EmptyState emoji="😵" title="Couldn't load takes" body={errorMessage(feed.error)} action={{ title: "Try again", onPress: () => feed.refetch() }} />
          ) : (
            <EmptyState
              emoji="🌶️"
              title="No takes yet"
              body="Be the first. Rate a restaurant, a dish, a film — anything you have an opinion on."
              action={{ title: "Post the first take 🔥", onPress: () => router.push("/post") }}
            />
          )
        }
        ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator color={colors.hot} style={{ margin: 16 }} /> : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: colors.bg,
  },
  invite: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  inviteText: { fontWeight: "800", fontSize: 13, color: colors.ink },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 14,
    marginTop: 4,
    padding: 12,
    paddingRight: 16,
    borderRadius: radii.xl,
    ...shadow.card,
  },
  composerText: { flex: 1, fontSize: 16, color: colors.inkFaint, fontWeight: "600" },
});
