import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme";

/** A simple header: back/close on the left, title, optional right slot. */
export function TopBar(props: {
  title?: string;
  close?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  noInset?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const back = props.onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/")));
  return (
    <View style={[styles.bar, { paddingTop: props.noInset ? 8 : insets.top + 4 }]}>
      <Pressable onPress={back} hitSlop={12} style={styles.btn} accessibilityLabel={props.close ? "Close" : "Back"}>
        <Ionicons name={props.close ? "close" : "chevron-back"} size={26} color={colors.ink} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {props.title ?? ""}
      </Text>
      <View style={[styles.btn, { alignItems: "flex-end" }]}>{props.right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 8 },
  btn: { width: 44, height: 40, justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: colors.ink },
});
