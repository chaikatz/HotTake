import React from "react";
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { myInvites } from "@/api/profile";
import { TopBar } from "@/components/TopBar";
import { useSession } from "@/providers/SessionProvider";
import { colors, radii, shadow } from "@/theme";
import { haptic } from "@/utils/haptics";

export default function Invites() {
  const { profile } = useSession();
  const q = useQuery({ queryKey: ["invites"], queryFn: myInvites });
  const invites = q.data ?? [];
  const open = invites.filter((i) => !i.used_at);

  const share = async (code: string) => {
    haptic.light();
    const first = profile?.real_name?.split(" ")[0];
    await Share.share({
      message:
        `${first ? `${first} invited you to` : "You're invited to"} Hot Take 🔥 — real takes from real people, and an AI that only answers from them.\n\n` +
        `Your invite code: ${code}`,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Invites" close noInset />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <Text style={styles.title}>Bring your people 🎟️</Text>
        <Text style={styles.body}>
          Hot Take is invite only. Each code works once — send them to friends whose taste you actually trust.
        </Text>
        <Text style={styles.left}>
          {open.length} of {invites.length} left
        </Text>
        {q.isLoading ? <ActivityIndicator color={colors.hot} style={{ marginTop: 24 }} /> : null}
        <View style={{ gap: 10, marginTop: 12 }}>
          {invites.map((inv) => (
            <View key={inv.code} style={[styles.row, shadow.card, inv.used_at && { opacity: 0.5 }]}>
              <Text style={[styles.code, inv.used_at && { textDecorationLine: "line-through" }]}>{inv.code}</Text>
              {inv.used_at ? (
                <Text style={styles.used}>Used ✓</Text>
              ) : (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    onPress={async () => {
                      await Clipboard.setStringAsync(inv.code);
                      haptic.success();
                    }}
                    style={styles.iconBtn}
                    accessibilityLabel="Copy code"
                  >
                    <Ionicons name="copy-outline" size={18} color={colors.ink} />
                  </Pressable>
                  <Pressable onPress={() => share(inv.code)} style={[styles.iconBtn, { backgroundColor: colors.ink }]} accessibilityLabel="Share code">
                    <Ionicons name="share-outline" size={18} color="#fff" />
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: "900", color: colors.ink, letterSpacing: -0.8 },
  body: { fontSize: 16, lineHeight: 22, color: colors.inkSoft, marginTop: 8 },
  left: { fontSize: 13, fontWeight: "800", color: colors.hot, marginTop: 20, letterSpacing: 0.4, textTransform: "uppercase" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.card, borderRadius: radii.lg, paddingHorizontal: 18, paddingVertical: 14 },
  code: { fontSize: 22, fontWeight: "900", letterSpacing: 3, color: colors.ink, fontVariant: ["tabular-nums"] },
  used: { fontWeight: "800", color: colors.inkSoft },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.sunken, alignItems: "center", justifyContent: "center" },
});
