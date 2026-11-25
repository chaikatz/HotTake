import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme";
import { TopBar } from "./TopBar";

/** Layout for each sign-up step: back, big question, content, button at the bottom. */
export function AuthScreen(props: {
  step?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  noBack?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {props.noBack ? <View style={{ height: insets.top + 52 }} /> : <TopBar title={props.step} />}
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{props.title}</Text>
        {props.subtitle ? <Text style={styles.subtitle}>{props.subtitle}</Text> : null}
        <View style={{ marginTop: 28 }}>{props.children}</View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{props.footer}</View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 },
  title: { fontSize: 34, fontWeight: "900", color: colors.ink, letterSpacing: -1 },
  subtitle: { fontSize: 16, lineHeight: 22, color: colors.inkSoft, marginTop: 10 },
  footer: { paddingHorizontal: 24, paddingTop: 8 },
});
