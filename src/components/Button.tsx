import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, hotGradient, radii, shadow } from "@/theme";
import { haptic } from "@/utils/haptics";

type Variant = "primary" | "hot" | "ghost" | "soft" | "danger";

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  left?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  size?: "lg" | "md" | "sm";
  textColor?: string;
}

export function Button({ title, onPress, variant = "primary", loading, disabled, left, style, size = "lg", textColor: forcedText }: Props) {
  const inactive = disabled || loading;
  const height = size === "lg" ? 56 : size === "md" ? 46 : 36;
  const fontSize = size === "lg" ? 17 : size === "md" ? 15 : 14;
  const textColor =
    forcedText ?? (variant === "primary" || variant === "hot" || variant === "danger" ? colors.white : colors.ink);

  const content = (
    <View style={[styles.inner, { height }]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {left}
          <Text style={[styles.text, { color: textColor, fontSize }]} numberOfLines={1}>
            {title}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive }}
      disabled={inactive}
      onPress={() => {
        haptic.light();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        { borderRadius: height / 2 },
        variant === "primary" && styles.primary,
        variant === "ghost" && styles.ghost,
        variant === "soft" && styles.soft,
        variant === "danger" && styles.danger,
        variant === "hot" && shadow.lift,
        inactive && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {variant === "hot" ? (
        <LinearGradient
          colors={hotGradient as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { borderRadius: height / 2 }]}
        />
      ) : null}
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { overflow: "visible", justifyContent: "center" },
  inner: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 22, gap: 8 },
  text: { fontWeight: "800", letterSpacing: -0.2 },
  primary: { backgroundColor: colors.ink },
  ghost: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.lineStrong },
  soft: { backgroundColor: colors.sunken },
  danger: { backgroundColor: colors.hot },
  disabled: { opacity: 0.4 },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
});
