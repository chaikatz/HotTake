import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AuthScreen } from "@/components/AuthScreen";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { colors, radii } from "@/theme";
import type { DisplayMode } from "@/types/db";
import { haptic } from "@/utils/haptics";
import { signupDraft } from "@/utils/signupDraft";

export default function Display() {
  const [mode, setMode] = useState<DisplayMode>(signupDraft.displayMode);
  const name = signupDraft.realName || "You";
  const pick = (m: DisplayMode) => {
    haptic.tick();
    setMode(m);
  };
  return (
    <AuthScreen
      step="5 of 5"
      title="How should you show up? 👀"
      subtitle="On your takes and when the Hot Take AI quotes you. You can change this anytime in Settings."
      footer={
        <Button
          title="Continue"
          onPress={() => {
            signupDraft.displayMode = mode;
            router.push("/agree");
          }}
        />
      }
    >
      <View style={{ gap: 12 }}>
        <Option
          selected={mode === "real"}
          onPress={() => pick("real")}
          avatar={<Avatar name={name} size={44} />}
          title={`As ${name}`}
          body="Your takes show your real name. Own your opinions."
        />
        <Option
          selected={mode === "anonymous"}
          onPress={() => pick("anonymous")}
          avatar={<Avatar name="" anonymous size={44} />}
          title="Anonymous"
          body="Your takes say Anonymous. Still a verified human behind every one."
        />
      </View>
    </AuthScreen>
  );
}

function Option(props: { selected: boolean; onPress: () => void; avatar: React.ReactNode; title: string; body: string }) {
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: props.selected }}
      style={[styles.option, props.selected && styles.selected]}
    >
      {props.avatar}
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{props.title}</Text>
        <Text style={styles.body}>{props.body}</Text>
      </View>
      <View style={[styles.radio, props.selected && styles.radioOn]}>
        {props.selected ? <View style={styles.dot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.line,
  },
  selected: { borderColor: colors.ink },
  title: { fontSize: 18, fontWeight: "800", color: colors.ink },
  body: { fontSize: 14, color: colors.inkSoft, marginTop: 2, lineHeight: 19 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.lineStrong, alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: colors.ink },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.ink },
});
