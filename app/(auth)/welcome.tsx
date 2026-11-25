import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Wordmark } from "@/components/Wordmark";
import { colors, hotGradient } from "@/theme";

const POINTS = [
  { emoji: "🔥", text: "Rate anything, 0.0 to 10.0" },
  { emoji: "🗺️", text: "See where the heat is" },
  { emoji: "🤖", text: "Ask an AI that only knows real takes" },
  { emoji: "🙋", text: "Verified humans only. Nothing paid." },
];

export default function Welcome() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={hotGradient as unknown as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.top, { paddingTop: insets.top + 56 }]}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Wordmark size={52} light />
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(120).duration(500)} style={styles.tagline}>
          AI powered only by real human opinions.
        </Animated.Text>
        <View style={{ marginTop: 36, gap: 14 }}>
          {POINTS.map((p, i) => (
            <Animated.View key={p.text} entering={FadeInDown.delay(260 + i * 90).duration(450)} style={styles.point}>
              <Text style={styles.pointEmoji}>{p.emoji}</Text>
              <Text style={styles.pointText}>{p.text}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Text style={styles.invite}>Invite only · New York</Text>
        <Button
          title="I have an invite code"
          onPress={() => router.push("/invite")}
          style={{ backgroundColor: colors.white }}
          variant="soft"
        />
        <Button
          title="I'm already in — sign in"
          onPress={() => router.push("/phone?returning=1")}
          variant="ghost"
          style={{ borderColor: "rgba(255,255,255,0.6)", marginTop: 12 }}
          textColor={colors.white}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flex: 1, paddingHorizontal: 28 },
  tagline: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 12, lineHeight: 28, letterSpacing: -0.4, opacity: 0.95 },
  point: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
  },
  pointEmoji: { fontSize: 24 },
  pointText: { color: "#fff", fontSize: 16, fontWeight: "700", flex: 1 },
  bottom: { paddingHorizontal: 24 },
  invite: { color: "rgba(255,255,255,0.85)", textAlign: "center", fontWeight: "700", marginBottom: 14, letterSpacing: 0.4 },
});

