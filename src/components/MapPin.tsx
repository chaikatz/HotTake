import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { formatRating, heatGradient, type as t } from "@/theme";
import { categoryEmoji } from "@/utils/categories";

/** A map pin: the subject's emoji and its average heat. */
export function MapPin({ rating, category }: { rating: number; category: string | null }) {
  const [a, b] = heatGradient(rating);
  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />
        <Text style={styles.emoji}>{categoryEmoji(category)}</Text>
        <Text style={[t.number, styles.text]}>{formatRating(rating)}</Text>
      </View>
      <View style={[styles.tip, { borderTopColor: b }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 7,
    paddingRight: 9,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fff",
  },
  emoji: { fontSize: 14 },
  text: { color: "#fff", fontSize: 15 },
  tip: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1,
  },
});
