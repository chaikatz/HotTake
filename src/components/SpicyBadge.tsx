import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme";

/** A take that lands 2+ points from the crowd once a subject has 5 takes. */
export function SpicyBadge({ small }: { small?: boolean }) {
  return (
    <View style={[styles.wrap, small && styles.small]}>
      <Text style={[styles.text, small && { fontSize: 11 }]}>🌶️ Spicy</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#FFE9E6",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  small: { paddingHorizontal: 8, paddingVertical: 3 },
  text: { color: colors.spicy, fontWeight: "800", fontSize: 12, letterSpacing: 0.2 },
});
