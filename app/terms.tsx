import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { TopBar } from "@/components/TopBar";
import { TERMS, TERMS_UPDATED } from "@/legal/terms";
import { colors } from "@/theme";

export default function Terms() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Terms & privacy" close noInset />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 18, paddingBottom: 48 }}>
        <Text style={styles.updated}>Updated {TERMS_UPDATED}</Text>
        {TERMS.map((s) => (
          <View key={s.heading}>
            <Text style={styles.h}>{s.heading}</Text>
            <Text style={styles.p}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  updated: { color: colors.inkFaint, fontWeight: "700" },
  h: { fontSize: 17, fontWeight: "800", color: colors.ink, marginBottom: 4 },
  p: { fontSize: 15, lineHeight: 22, color: colors.inkSoft },
});
