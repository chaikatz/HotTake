import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { deleteAccount, updateProfile } from "@/api/profile";
import { refreshTakes } from "@/api/takes";
import { TopBar } from "@/components/TopBar";
import { useSession } from "@/providers/SessionProvider";
import { colors, radii } from "@/theme";
import { errorMessage } from "@/utils/errors";
import { haptic } from "@/utils/haptics";
import { resetTo } from "@/utils/nav";
import { prettyPhone } from "@/utils/phone";

export default function Settings() {
  const { profile, refreshProfile, signOut } = useSession();
  const [saving, setSaving] = useState(false);
  const anonymous = profile?.display_mode === "anonymous";

  const toggleAnon = async (on: boolean) => {
    setSaving(true);
    try {
      await updateProfile({ display_mode: on ? "anonymous" : "real" });
      haptic.tick();
      await refreshProfile();
      refreshTakes();
    } catch (e) {
      Alert.alert("Couldn't save", errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete your account?",
      "This permanently deletes your account, your takes, photos, reactions and invites. It can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
              resetTo("/");
            } catch (e) {
              Alert.alert("Couldn't delete", errorMessage(e));
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Settings" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 48 }}>
        <Group title="You">
          <Row label="Name" value={profile?.real_name ?? ""} />
          <Row label="Phone" value={profile?.phone ? prettyPhone(profile.phone.startsWith("+") ? profile.phone : `+${profile.phone}`) : "—"} />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Post as Anonymous 🕶️</Text>
              <Text style={styles.hint}>
                {anonymous ? "Your takes show “Anonymous”." : `Your takes show “${profile?.real_name}”.`} Applies to all your takes.
              </Text>
            </View>
            <Switch value={anonymous} onValueChange={toggleAnon} disabled={saving} trackColor={{ true: colors.ink }} />
          </View>
        </Group>

        <Group title="Hot Take">
          <LinkRow icon="gift-outline" label="Invite friends" onPress={() => router.push("/invites")} />
          <LinkRow icon="document-text-outline" label="Terms & privacy" onPress={() => router.push("/terms")} />
        </Group>

        <Group title="Account">
          <LinkRow
            icon="log-out-outline"
            label="Sign out"
            onPress={async () => {
              await signOut();
              resetTo("/");
            }}
          />
          <LinkRow icon="trash-outline" label="Delete account" danger onPress={confirmDelete} />
        </Group>
        <Text style={styles.footer}>Hot Take · AI powered only by real human opinions.</Text>
      </ScrollView>
    </View>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function LinkRow(props: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={props.onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.sunken }]}>
      <Ionicons name={props.icon} size={20} color={props.danger ? colors.hot : colors.ink} />
      <Text style={[styles.label, { flex: 1 }, props.danger && { color: colors.hot }]}>{props.label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  groupTitle: { fontSize: 13, fontWeight: "800", color: colors.inkFaint, letterSpacing: 0.6, textTransform: "uppercase", marginLeft: 6, marginBottom: 8 },
  group: { backgroundColor: colors.card, borderRadius: radii.lg, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  label: { fontSize: 16, fontWeight: "700", color: colors.ink },
  value: { fontSize: 16, color: colors.inkSoft, marginLeft: "auto" },
  hint: { fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  footer: { textAlign: "center", color: colors.inkFaint, fontSize: 12, marginTop: 8 },
});
