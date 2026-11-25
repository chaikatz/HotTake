import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { colors, HEAT_INPUT, HEAT_OUTPUT, heatColor, heatLevel, type as t } from "@/theme";
import { haptic } from "@/utils/haptics";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

const TRACK_HEIGHT = 64;
const THUMB = 52;

function clamp(v: number) {
  return Math.max(0, Math.min(10, Math.round(v * 10) / 10));
}

/**
 * The heat meter: drag along the bar and the whole screen heats up — the
 * number, the glow, the emoji, rising flames past 8, a shake past 9.5, and a
 * haptic tick for every tenth of a point.
 */
export function HeatMeter({ value, onChange }: Props) {
  const heat = useSharedValue(value);
  const [width, setWidth] = useState(0);
  const trackWidth = useSharedValue(0);
  const last = useRef(value);
  const level = heatLevel(value);
  const color = heatColor(value);

  // Pop the emoji when the level changes.
  const pop = useSharedValue(1);
  const prevLabel = useRef(level.label);
  useEffect(() => {
    heat.value = withSpring(value, { damping: 18, stiffness: 320, mass: 0.6 });
    if (prevLabel.current !== level.label) {
      prevLabel.current = level.label;
      pop.value = withSequence(withSpring(1.35, { damping: 6, stiffness: 400 }), withSpring(1, { damping: 10 }));
    }
  }, [value, level.label, heat, pop]);

  // Shake when it's scorching.
  const shake = useSharedValue(0);
  const scorching = value >= 9.5;
  useEffect(() => {
    if (scorching) {
      shake.value = withRepeat(
        withSequence(withTiming(-1, { duration: 60 }), withTiming(1, { duration: 60 })),
        -1,
        true,
      );
    } else {
      shake.value = withTiming(0, { duration: 80 });
    }
  }, [scorching, shake]);

  const set = (raw: number) => {
    const v = clamp(raw);
    if (v === last.current) return;
    const prev = last.current;
    last.current = v;
    if (v === 10) haptic.success();
    else if (Math.floor(v) !== Math.floor(prev)) haptic.medium();
    else haptic.tick();
    onChange(v);
  };

  const fromTouch = (e: GestureResponderEvent) => {
    if (!width) return;
    const x = e.nativeEvent.locationX;
    set((x / width) * 10);
  };

  // Keep the external value and our "last" in sync when changed from outside.
  useEffect(() => {
    last.current = value;
  }, [value]);

  const glowStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(heat.value, HEAT_INPUT, HEAT_OUTPUT),
    opacity: interpolate(heat.value, [0, 10], [0.16, 0.5]),
    transform: [{ scale: interpolate(heat.value, [0, 10], [0.7, 1.35]) }],
  }));

  const numberWrapStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${shake.value * 2.2}deg` },
      { scale: interpolate(heat.value, [0, 10], [0.92, 1.08]) },
    ],
  }));

  const emojiStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  const fillStyle = useAnimatedStyle(() => ({
    width: Math.max(TRACK_HEIGHT, (heat.value / 10) * trackWidth.value),
  }));

  const thumbStyle = useAnimatedStyle(() => {
    const maxX = Math.max(0, trackWidth.value - THUMB - 12);
    const x = (heat.value / 10) * trackWidth.value - THUMB / 2 - 6;
    return {
      transform: [
        { translateX: Math.max(0, Math.min(maxX, x)) },
        { scale: interpolate(heat.value, [0, 10], [0.9, 1.12]) },
      ],
      borderColor: interpolateColor(heat.value, HEAT_INPUT, HEAT_OUTPUT),
    };
  });

  return (
    <View style={styles.root}>
      <View style={styles.stage}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <Flames heat={heat} />
        <Animated.Text style={[styles.emoji, emojiStyle]}>{level.emoji}</Animated.Text>
        <Animated.View style={[styles.numberRow, numberWrapStyle]}>
          <Text style={[t.number, styles.number, { color }]} accessibilityLabel={`Rating ${value.toFixed(1)} out of 10`}>
            {value.toFixed(1)}
          </Text>
        </Animated.View>
        <Text style={[styles.label, { color }]}>{level.label}</Text>
      </View>

      <View style={styles.controls}>
        <Nudge label="−" onPress={() => set(value - 0.1)} />
        <View
          style={styles.trackTouch}
          onLayout={(e: LayoutChangeEvent) => {
            setWidth(e.nativeEvent.layout.width);
            trackWidth.value = e.nativeEvent.layout.width;
          }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={fromTouch}
          onResponderMove={fromTouch}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Heat"
          accessibilityValue={{ min: 0, max: 10, now: value, text: value.toFixed(1) }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) => set(value + (e.nativeEvent.actionName === "increment" ? 0.5 : -0.5))}
        >
          <View style={styles.track} pointerEvents="none">
            <Animated.View style={[styles.fill, fillStyle]}>
              <LinearGradient
                colors={HEAT_OUTPUT as unknown as [string, string, ...string[]]}
                locations={HEAT_INPUT.map((x) => x / 10) as unknown as [number, number, ...number[]]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ width: width || 1, height: TRACK_HEIGHT }}
              />
            </Animated.View>
            <Animated.View style={[styles.thumb, thumbStyle]}>
              <Text style={styles.thumbEmoji}>{value >= 5.5 ? "🔥" : "🧊"}</Text>
            </Animated.View>
          </View>
          <View style={styles.scale} pointerEvents="none">
            {[0, 2, 4, 6, 8, 10].map((n) => (
              <Text key={n} style={styles.scaleText}>
                {n}
              </Text>
            ))}
          </View>
        </View>
        <Nudge label="+" onPress={() => set(value + 0.1)} />
      </View>
      <Text style={styles.hint}>Drag to set the heat · tap ± for tenths</Text>
    </View>
  );
}

function Nudge({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.nudge, pressed && { transform: [{ scale: 0.9 }] }]}>
      <Text style={styles.nudgeText}>{label}</Text>
    </Pressable>
  );
}

const FLAME_COUNT = 9;

/** Flames that rise from the bottom of the stage once things get hot. */
function Flames({ heat }: { heat: SharedValue<number> }) {
  const seeds = useMemo(
    () =>
      Array.from({ length: FLAME_COUNT }, (_, i) => ({
        left: 8 + ((i * 37) % 84),
        delay: (i * 260) % 1400,
        duration: 1300 + ((i * 173) % 700),
        size: 18 + ((i * 7) % 16),
        drift: ((i % 3) - 1) * 18,
        emoji: i % 4 === 0 ? "✨" : "🔥",
      })),
    [],
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {seeds.map((s, i) => (
        <Flame key={i} heat={heat} {...s} />
      ))}
    </View>
  );
}

function Flame(props: {
  heat: SharedValue<number>;
  left: number;
  delay: number;
  duration: number;
  size: number;
  drift: number;
  emoji: string;
}) {
  const { heat, left, delay, duration, size, drift, emoji } = props;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.out(Easing.quad) }), -1, false));
  }, [p, delay, duration]);
  const style = useAnimatedStyle(() => {
    const intensity = interpolate(heat.value, [7.6, 9, 10], [0, 0.7, 1], "clamp");
    return {
      opacity: interpolate(p.value, [0, 0.15, 0.7, 1], [0, 1, 0.6, 0]) * intensity,
      transform: [
        { translateY: interpolate(p.value, [0, 1], [0, -240]) },
        { translateX: interpolate(p.value, [0, 0.5, 1], [0, drift, -drift / 2]) },
        { scale: interpolate(p.value, [0, 1], [1, 0.5]) * (0.8 + intensity * 0.4) },
      ],
    };
  });
  return <Animated.Text style={[styles.flame, { left: `${left}%`, fontSize: size }, style]}>{emoji}</Animated.Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "space-between" },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  glow: { position: "absolute", width: 300, height: 300, borderRadius: 150 },
  emoji: { fontSize: 64, marginBottom: 4 },
  numberRow: { flexDirection: "row", alignItems: "flex-end" },
  number: { fontSize: 112, letterSpacing: -5, lineHeight: 120 },
  label: { fontSize: 22, fontWeight: "900", letterSpacing: -0.3, marginTop: 2 },
  flame: { position: "absolute", bottom: 0 },
  controls: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 4 },
  trackTouch: { flex: 1, paddingVertical: 8 },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.sunken,
    overflow: "hidden",
    justifyContent: "center",
  },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0, overflow: "hidden", borderRadius: TRACK_HEIGHT / 2 },
  thumb: {
    position: "absolute",
    left: 6,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: "#fff",
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbEmoji: { fontSize: 24 },
  scale: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 10, marginTop: 8 },
  scaleText: { fontSize: 12, fontWeight: "700", color: colors.inkFaint },
  nudge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  nudgeText: { fontSize: 24, fontWeight: "700", color: colors.ink, marginTop: -2 },
  hint: { textAlign: "center", color: colors.inkFaint, fontSize: 13, marginTop: 8 },
});
