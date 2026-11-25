import React, { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { queryClient } from "@/lib/queryClient";
import { SessionProvider, useSession } from "@/providers/SessionProvider";
import { colors } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

function HideSplashWhenReady() {
  const { session, profileLoaded } = useSession();
  const ready = session === null || (session !== undefined && profileLoaded);
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <HideSplashWhenReady />
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
              <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
              <Stack.Screen name="post" options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }} />
              <Stack.Screen name="subject/[id]" />
              <Stack.Screen name="invites" options={{ presentation: "modal" }} />
              <Stack.Screen name="settings" />
              <Stack.Screen name="terms" options={{ presentation: "modal" }} />
              <Stack.Screen name="welcome-in" options={{ animation: "fade", gestureEnabled: false }} />
            </Stack>
          </SessionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
