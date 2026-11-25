import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { askHotTake } from "@/api/ask";
import { useTakesByIds } from "@/api/takes";
import { TakeCard } from "@/components/TakeCard";
import { useMyLocation } from "@/hooks/useMyLocation";
import { colors, hotGradient } from "@/theme";
import { errorMessage } from "@/utils/errors";
import { haptic } from "@/utils/haptics";

interface Msg {
  id: string;
  role: "user" | "ai";
  text: string;
  takeIds?: string[];
  mode?: "ai" | "basic" | "none";
  error?: boolean;
}

const SUGGESTIONS = [
  "What's the top restaurant in SoHo?",
  "Best dish people are raving about?",
  "Good coffee near me?",
  "What's the hottest take right now?",
];

const NEAR_ME = /\b(near me|nearby|around here|close by|near here|walking distance)\b/i;

export default function Ask() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [useLoc, setUseLoc] = useState(false);
  const { location, request } = useMyLocation();
  const list = useRef<FlatList<Msg>>(null);

  const send = async (raw: string) => {
    const q = raw.trim();
    if (!q || busy) return;
    haptic.light();
    setInput("");
    const userMsg: Msg = { id: `u${Date.now()}`, role: "user", text: q };
    setMessages((m) => [...m, userMsg]);
    setBusy(true);
    try {
      let here = useLoc ? location : null;
      if ((useLoc || NEAR_ME.test(q)) && !here) {
        here = await request();
        if (here) setUseLoc(true);
      }
      const res = await askHotTake(q, here);
      setMessages((m) => [
        ...m,
        { id: `a${Date.now()}`, role: "ai", text: res.answer, takeIds: res.take_ids, mode: res.mode },
      ]);
      haptic.success();
    } catch (e) {
      setMessages((m) => [...m, { id: `e${Date.now()}`, role: "ai", text: errorMessage(e), error: true }]);
    } finally {
      setBusy(false);
      setTimeout(() => list.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.title}>Hot Take AI ✨</Text>
        <Text style={styles.subtitle}>Answers only from real takes by real people</Text>
      </View>

      <FlatList
        ref={list}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[styles.listContent, messages.length === 0 && { flexGrow: 1 }]}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (item.role === "user" ? <UserBubble text={item.text} /> : <AiAnswer msg={item} />)}
        ListEmptyComponent={<Intro onPick={send} />}
        ListFooterComponent={
          busy ? (
            <Animated.View entering={FadeIn} style={styles.thinking}>
              <ActivityIndicator color={colors.hot} />
              <Text style={styles.thinkingText}>Reading the takes…</Text>
            </Animated.View>
          ) : undefined
        }
      />

      <View style={styles.inputBar}>
        <Pressable
          onPress={async () => {
            haptic.tick();
            if (useLoc) return setUseLoc(false);
            const here = location ?? (await request());
            setUseLoc(!!here);
          }}
          style={[styles.locBtn, useLoc && styles.locOn]}
          accessibilityLabel={useLoc ? "Stop using my location" : "Use my location"}
        >
          <Ionicons name={useLoc ? "location" : "location-outline"} size={20} color={useLoc ? "#fff" : colors.ink} />
        </Pressable>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={useLoc ? "Ask about places near you…" : "Ask the takes anything…"}
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
          multiline
          maxLength={300}
          onSubmitEditing={() => send(input)}
          submitBehavior="submit"
          returnKeyType="send"
        />
        <Pressable onPress={() => send(input)} disabled={!input.trim() || busy} style={[styles.send, (!input.trim() || busy) && { opacity: 0.35 }]}>
          <LinearGradient
            colors={hotGradient as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          />
          <Ionicons name="arrow-up" size={22} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Intro({ onPick }: { onPick: (q: string) => void }) {
  return (
    <View style={styles.intro}>
      <Text style={{ fontSize: 56 }}>🤖🔥</Text>
      <Text style={styles.introTitle}>Ask the takes</Text>
      <Text style={styles.introBody}>
        No internet, no ads, no paid reviews. I only answer from hot takes members have posted — and I'll tell you
        whose take it is.
      </Text>
      <View style={styles.chips}>
        {SUGGESTIONS.map((s) => (
          <Pressable key={s} onPress={() => onPick(s)} style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}>
            <Text style={styles.chipText}>{s}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <Animated.View entering={FadeInUp.duration(250)} style={styles.userRow}>
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{text}</Text>
      </View>
    </Animated.View>
  );
}

function AiAnswer({ msg }: { msg: Msg }) {
  const ids = msg.takeIds ?? [];
  const takes = useTakesByIds(ids);
  const none = msg.mode === "none";
  return (
    <Animated.View entering={FadeInUp.duration(300)} style={styles.aiRow}>
      <Text style={styles.aiLabel}>{msg.error ? "⚠️ Hot Take AI" : "✨ Hot Take AI"}</Text>
      <Text style={[styles.aiText, none && { fontWeight: "800" }]}>{none ? `🤷 ${msg.text}` : msg.text}</Text>
      {none ? (
        <Pressable onPress={() => router.push("/post")} style={styles.beFirst}>
          <Text style={styles.beFirstText}>Be the first to post one 🔥</Text>
        </Pressable>
      ) : null}
      {msg.mode === "basic" ? (
        <Text style={styles.basicNote}>Basic mode — the AI key isn't connected yet, so these are the top matching takes.</Text>
      ) : null}
      {ids.length ? (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.sources}>From {ids.length} {ids.length === 1 ? "take" : "takes"}</Text>
          {takes.isLoading ? <ActivityIndicator color={colors.hot} style={{ marginTop: 8 }} /> : null}
          {(takes.data ?? []).map((t) => (
            <TakeCard key={t.id} take={t} compact />
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  title: { fontSize: 26, fontWeight: "900", color: colors.ink, letterSpacing: -0.6 },
  subtitle: { fontSize: 13, color: colors.inkSoft, marginTop: 2, fontWeight: "600" },
  listContent: { padding: 16, paddingBottom: 24 },
  intro: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, paddingVertical: 24 },
  introTitle: { fontSize: 28, fontWeight: "900", color: colors.ink, marginTop: 8, letterSpacing: -0.6 },
  introBody: { fontSize: 15, lineHeight: 21, color: colors.inkSoft, textAlign: "center", marginTop: 8 },
  chips: { marginTop: 24, gap: 10, alignSelf: "stretch" },
  chip: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13 },
  chipText: { fontSize: 15, fontWeight: "700", color: colors.ink },
  userRow: { alignItems: "flex-end", marginBottom: 14 },
  userBubble: { backgroundColor: colors.ink, borderRadius: 20, borderBottomRightRadius: 6, paddingHorizontal: 16, paddingVertical: 11, maxWidth: "85%" },
  userText: { color: "#fff", fontSize: 16, lineHeight: 22 },
  aiRow: { marginBottom: 22 },
  aiLabel: { fontSize: 12, fontWeight: "800", color: colors.hot, marginBottom: 6, letterSpacing: 0.3 },
  aiText: { fontSize: 17, lineHeight: 25, color: colors.ink },
  basicNote: { fontSize: 12, color: colors.inkFaint, marginTop: 8 },
  sources: { fontSize: 12, fontWeight: "800", color: colors.inkFaint, marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" },
  beFirst: { marginTop: 12, alignSelf: "flex-start", backgroundColor: colors.ink, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  beFirstText: { color: "#fff", fontWeight: "800" },
  thinking: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  thinkingText: { color: colors.inkSoft, fontWeight: "600" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.card,
  },
  locBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.sunken, alignItems: "center", justifyContent: "center" },
  locOn: { backgroundColor: colors.ink },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.sunken,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    color: colors.ink,
  },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
