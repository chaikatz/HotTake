import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { formatRating, heatGradient, type as t } from "@/theme";

interface Props {
  rating: number | null | undefined;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZES = {
  sm: { h: 26, px: 9, font: 14 },
  md: { h: 34, px: 12, font: 18 },
  lg: { h: 46, px: 16, font: 26 },
  xl: { h: 64, px: 20, font: 38 },
};

/** A rating, in the colour of its heat. */
export function HeatBadge({ rating, size = "md" }: Props) {
  const s = SIZES[size];
  const value = rating == null ? null : Number(rating);
  const [a, b] = heatGradient(value ?? 5);
  return (
    <View style={[styles.wrap, { height: s.h, borderRadius: s.h / 2 }]}>
      <LinearGradient
        colors={value == null ? ["#CFCAC2", "#B8B2A8"] : [a, b]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: s.h / 2 }]}
      />
      <Text style={[t.number, styles.text, { fontSize: s.font, paddingHorizontal: s.px }]}>
        {formatRating(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: "center", alignItems: "center", overflow: "hidden", minWidth: 44 },
  text: { color: "#fff", letterSpacing: -0.5 },
});
