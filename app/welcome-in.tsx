import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { ZoomIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { useSession } from "@/providers/SessionProvider";
import { colors, hotGradient } from "@/theme";

/** Right after joining: celebrate, hand over the invites, nudge the first take. */
export default function WelcomeIn() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const first = profile?.real_name?.split(" ")[0] ?? "";
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={hotGradient as unknown as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.body, { paddingTop: insets.top + 80 }]}>
        <Animated.Text entering={ZoomIn.springify().damping(9)} style={styles.emoji}>
          🔥
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(150)} style={styles.title}>
          You're in{first ? `, ${first}` : ""}.
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(250)} style={styles.sub}>
          You've got 5 invites to share with people whose taste you trust. Every take here comes from a real person —
          now it's your turn.
        </Animated.Text>
      </View>
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Button
          title="Drop my first hot take"
          variant="soft"
          style={{ backgroundColor: colors.white }}
          onPress={() => {
            router.replace("/feed");
            setTimeout(() => router.push("/post"), 50);
          }}
        />
        <Button
          title="Look around first"
          variant="ghost"
          textColor={colors.white}
          style={{ borderColor: "rgba(255,255,255,0.6)", marginTop: 12 }}
          onPress={() => router.replace("/feed")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 28 },
  emoji: { fontSize: 96 },
  title: { color: "#fff", fontSize: 44, fontWeight: "900", letterSpacing: -1.5, marginTop: 12 },
  sub: { color: "#fff", fontSize: 18, lineHeight: 25, fontWeight: "600", marginTop: 14, opacity: 0.95 },
  bottom: { paddingHorizontal: 24 },
});
