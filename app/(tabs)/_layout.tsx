import React from "react";
import { Pressable, StyleSheet, View, type ColorValue } from "react-native";
import { Redirect, Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSession } from "@/providers/SessionProvider";
import { colors, hotGradient, shadow } from "@/theme";
import { haptic } from "@/utils/haptics";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function icon(active: IconName, inactive: IconName) {
  return ({ focused, color }: { focused: boolean; color: ColorValue }) => (
    <Ionicons name={focused ? active : inactive} size={25} color={color as string} />
  );
}

function PostButton() {
  return (
    <View style={styles.postWrap} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Post a hot take"
        onPress={() => {
          haptic.medium();
          router.push("/post");
        }}
        style={({ pressed }) => [styles.post, shadow.lift, pressed && { transform: [{ scale: 0.92 }] }]}
      >
        <LinearGradient
          colors={hotGradient as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
        />
        <Ionicons name="flame" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const { session, profile, profileLoaded } = useSession();
  if (session === null) return <Redirect href="/welcome" />;
  if (session && profileLoaded && !profile) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="feed" options={{ title: "Takes", tabBarIcon: icon("flame", "flame-outline") }} />
      <Tabs.Screen name="map" options={{ title: "Map", tabBarIcon: icon("map", "map-outline") }} />
      <Tabs.Screen
        name="new"
        options={{ title: "", tabBarButton: () => <PostButton /> }}
        listeners={{ tabPress: (e) => e.preventDefault() }}
      />
      <Tabs.Screen name="ask" options={{ title: "Ask AI", tabBarIcon: icon("sparkles", "sparkles-outline") }} />
      <Tabs.Screen name="me" options={{ title: "Me", tabBarIcon: icon("person-circle", "person-circle-outline") }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  postWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  post: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -14,
  },
});
