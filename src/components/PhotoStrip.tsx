import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { photoUrl } from "@/lib/supabase";
import { radii } from "@/theme";

/** A take's photos: one big, or a swipeable row. Tap to view full screen. */
export function PhotoStrip({ paths, height = 220 }: { paths: string[]; height?: number }) {
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState<number | null>(null);
  if (!paths.length) return null;
  const single = paths.length === 1;
  const itemWidth = single ? undefined : Math.min(width * 0.62, 260);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!single}
        contentContainerStyle={styles.row}
        style={styles.scroll}
      >
        {paths.map((p, i) => (
          <Pressable key={p} onPress={() => setOpen(i)} style={single ? styles.singleWrap : undefined}>
            <Image
              source={{ uri: photoUrl(p) }}
              style={[styles.photo, { height, width: itemWidth ?? "100%" }]}
              contentFit="cover"
              transition={200}
            />
          </Pressable>
        ))}
      </ScrollView>
      <PhotoViewer paths={paths} index={open} onClose={() => setOpen(null)} />
    </>
  );
}

function PhotoViewer({ paths, index, onClose }: { paths: string[]; index: number | null; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={index != null} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.viewer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: (index ?? 0) * width, y: 0 }}
        >
          {paths.map((p) => (
            <Image key={p} source={{ uri: photoUrl(p) }} style={{ width, height }} contentFit="contain" />
          ))}
        </ScrollView>
        <Pressable onPress={onClose} style={[styles.close, { top: insets.top + 8 }]} hitSlop={12}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { marginHorizontal: -16 },
  row: { paddingHorizontal: 16, gap: 8, flexGrow: 1 },
  singleWrap: { flex: 1 },
  photo: { borderRadius: radii.md, backgroundColor: "#EEE" },
  viewer: { flex: 1, backgroundColor: "#000" },
  close: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
