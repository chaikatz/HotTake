import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme";
import { Button } from "./Button";

export function EmptyState(props: {
  emoji: string;
  title: string;
  body?: string;
  action?: { title: string; onPress: () => void };
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{props.emoji}</Text>
      <Text style={styles.title}>{props.title}</Text>
      {props.body ? <Text style={styles.body}>{props.body}</Text> : null}
      {props.action ? (
        <Button title={props.action.title} variant="hot" onPress={props.action.onPress} style={{ marginTop: 20, alignSelf: "center" }} size="md" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingHorizontal: 32, paddingVertical: 48 },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "900", color: colors.ink, textAlign: "center", letterSpacing: -0.4 },
  body: { fontSize: 15, lineHeight: 21, color: colors.inkSoft, textAlign: "center", marginTop: 8 },
});
