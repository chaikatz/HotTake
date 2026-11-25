import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { getPendingInvite } from "@/api/auth";
import { useSession } from "@/providers/SessionProvider";
import { colors } from "@/theme";

/** Sends you where you belong: sign-up, finishing sign-up, or the feed. */
export default function Index() {
  const { session, profile, profileLoaded } = useSession();
  const [pending, setPending] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    getPendingInvite().then(setPending).catch(() => setPending(null));
  }, [session]);

  if (session === undefined || (session && !profileLoaded) || pending === undefined) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.hot} />
      </View>
    );
  }
  if (!session) return <Redirect href="/welcome" />;
  if (!profile) return <Redirect href={pending ? "/name" : "/invite?needed=1"} />;
  return <Redirect href="/feed" />;
}
