import React, { memo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { patchTake, react } from "@/api/takes";
import { openTakeMenu } from "@/hooks/useTakeActions";
import { colors, radii, shadow, type as t } from "@/theme";
import type { ReactionType, TakeCard as Take } from "@/types/db";
import { categoryEmoji } from "@/utils/categories";
import { errorMessage } from "@/utils/errors";
import { haptic } from "@/utils/haptics";
import { timeAgo } from "@/utils/time";
import { Avatar } from "./Avatar";
import { HeatBadge } from "./HeatBadge";
import { PhotoStrip } from "./PhotoStrip";
import { SpicyBadge } from "./SpicyBadge";

interface Props {
  take: Take;
  /** Hide the subject header (on the subject's own page). */
  hideSubject?: boolean;
  compact?: boolean;
}

function applyReaction(take: Take, next: ReactionType | null): Take {
  let { agree_count, disagree_count } = take;
  if (take.my_reaction === "agree") agree_count--;
  if (take.my_reaction === "disagree") disagree_count--;
  if (next === "agree") agree_count++;
  if (next === "disagree") disagree_count++;
  return { ...take, my_reaction: next, agree_count, disagree_count };
}

function TakeCardImpl({ take, hideSubject, compact }: Props) {
  const [busy, setBusy] = useState(false);

  const onReact = async (type: ReactionType) => {
    if (take.is_mine || busy) return;
    const next = take.my_reaction === type ? null : type;
    if (next === "agree") haptic.medium();
    else if (next === "disagree") haptic.rigid();
    else haptic.light();
    const before = take;
    patchTake(take.id, (x) => applyReaction(x, next));
    setBusy(true);
    try {
      const saved = await react(take.id, type);
      if (saved !== next) patchTake(take.id, (x) => applyReaction(x, saved));
    } catch (e) {
      patchTake(take.id, () => before);
      Alert.alert("Couldn't save that", errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const openSubject = () => router.push(`/subject/${take.subject_id}`);
  const subtitle = [take.parent_name ? `at ${take.parent_name}` : null, take.subject_neighborhood]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {!hideSubject ? (
        <Pressable onPress={openSubject} style={styles.subjectRow} hitSlop={4}>
          <View style={styles.emojiBubble}>
            <Text style={styles.emoji}>{categoryEmoji(take.subject_category)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.subject} numberOfLines={1}>
              {take.subject_name}
            </Text>
            {subtitle ? (
              <Text style={styles.subjectMeta} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <HeatBadge rating={take.rating} size={compact ? "sm" : "md"} />
        </Pressable>
      ) : (
        <View style={[styles.subjectRow, { marginBottom: 6 }]}>
          <View style={styles.authorRow}>
            <Avatar name={take.author_name} anonymous={take.author_is_anonymous} size={28} />
            <Text style={styles.author} numberOfLines={1}>
              {take.author_name}
              {take.is_mine ? " (you)" : ""}
            </Text>
            <Text style={styles.time}>· {timeAgo(take.created_at)}</Text>
          </View>
          <HeatBadge rating={take.rating} size="md" />
        </View>
      )}

      <Text style={[t.take, compact && { fontSize: 15, lineHeight: 21 }]} numberOfLines={compact ? 4 : undefined}>
        {take.text}
      </Text>

      {take.is_spicy ? (
        <View style={{ marginTop: 10 }}>
          <SpicyBadge small={compact} />
        </View>
      ) : null}

      {take.photos.length && !compact ? (
        <View style={{ marginTop: 12 }}>
          <PhotoStrip paths={take.photos} />
        </View>
      ) : null}

      {!hideSubject ? (
        <View style={styles.footer}>
          <View style={styles.authorRow}>
            <Avatar name={take.author_name} anonymous={take.author_is_anonymous} size={compact ? 22 : 26} />
            <Text style={styles.author} numberOfLines={1}>
              {take.author_name}
              {take.is_mine ? " (you)" : ""}
            </Text>
            <Text style={styles.time}>· {timeAgo(take.created_at)}</Text>
          </View>
          {!compact ? (
            <Pressable onPress={() => openTakeMenu(take)} hitSlop={12} style={styles.more}>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.inkFaint} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {!compact ? (
        <View style={styles.reactions}>
          <ReactionButton
            label="Agree"
            emoji="🙌"
            count={take.agree_count}
            active={take.my_reaction === "agree"}
            color={colors.agree}
            disabled={take.is_mine}
            onPress={() => onReact("agree")}
          />
          <ReactionButton
            label="Disagree"
            emoji="🙅"
            count={take.disagree_count}
            active={take.my_reaction === "disagree"}
            color={colors.disagree}
            disabled={take.is_mine}
            onPress={() => onReact("disagree")}
          />
          {hideSubject ? (
            <Pressable onPress={() => openTakeMenu(take)} hitSlop={12} style={styles.moreInline}>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.inkFaint} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function ReactionButton(props: {
  label: string;
  emoji: string;
  count: number;
  active: boolean;
  color: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { label, emoji, count, active, color, disabled, onPress } = props;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      style={({ pressed }) => [
        styles.reaction,
        active && { backgroundColor: color, borderColor: color },
        pressed && { transform: [{ scale: 0.95 }] },
      ]}
    >
      <Text style={styles.reactionEmoji}>{emoji}</Text>
      <Text style={[styles.reactionLabel, active && { color: "#fff" }]}>{label}</Text>
      {count > 0 ? <Text style={[styles.reactionCount, active && { color: "#fff" }]}>{count}</Text> : null}
    </Pressable>
  );
}

export const TakeCard = memo(TakeCardImpl);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    ...shadow.card,
  },
  cardCompact: { marginHorizontal: 0, padding: 14, marginBottom: 10 },
  subjectRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  emojiBubble: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.sunken,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 20 },
  subject: { fontSize: 17, fontWeight: "800", color: colors.ink, letterSpacing: -0.3 },
  subjectMeta: { fontSize: 13, color: colors.inkSoft, marginTop: 1 },
  footer: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  author: { fontSize: 14, fontWeight: "700", color: colors.ink, flexShrink: 1 },
  time: { fontSize: 13, color: colors.inkFaint },
  more: { paddingLeft: 12, paddingVertical: 4 },
  moreInline: { marginLeft: "auto", paddingHorizontal: 6, paddingVertical: 8 },
  reactions: { flexDirection: "row", gap: 8, marginTop: 12 },
  reaction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  reactionEmoji: { fontSize: 16 },
  reactionLabel: { fontSize: 14, fontWeight: "700", color: colors.ink },
  reactionCount: { fontSize: 14, fontWeight: "800", color: colors.inkSoft },
});
