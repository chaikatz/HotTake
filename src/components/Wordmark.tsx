import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme";

/** "hot take" with a flame — the brand, set in heavy italic system type. */
export function Wordmark({ size = 28, light }: { size?: number; light?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.word, { fontSize: size, color: light ? "#fff" : colors.ink }]}>hot take</Text>
      <Text style={{ fontSize: size * 0.9, marginLeft: 2 }}>🔥</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  word: { fontWeight: "900", fontStyle: "italic", letterSpacing: -1.2 },
});
