import React from "react";
import { StyleSheet, Text, View } from "react-native";

const PALETTE = ["#FF7A00", "#FF3B30", "#FF2D7A", "#7A5AF8", "#2F6BFF", "#12B76A", "#F5B300", "#00A6C7"];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({ name, anonymous, size = 36 }: { name: string; anonymous?: boolean; size?: number }) {
  if (anonymous) {
    return (
      <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: "#1C1C1E" }]}>
        <Text style={{ fontSize: size * 0.5 }}>🕶️</Text>
      </View>
    );
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const bg = PALETTE[hash(name) % PALETTE.length];
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials || "?"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  text: { color: "#fff", fontWeight: "800" },
});
