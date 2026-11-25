import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { completeSignup, getPendingInvite } from "@/api/auth";
import { AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { TERMS } from "@/legal/terms";
import { useSession } from "@/providers/SessionProvider";
import { colors } from "@/theme";
import { errorMessage } from "@/utils/errors";
import { haptic } from "@/utils/haptics";
import { resetTo } from "@/utils/nav";
import { signupDraft } from "@/utils/signupDraft";

export default function Agree() {
  const { setProfile } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      const code = await getPendingInvite();
      if (!code) {
        router.replace("/invite?needed=1");
        return;
      }
      if (!signupDraft.realName) {
        router.replace("/name");
        return;
      }
      const profile = await completeSignup({
        code,
        realName: signupDraft.realName,
        displayMode: signupDraft.displayMode,
      });
      haptic.success();
      setProfile(profile);
      resetTo("/welcome-in");
    } catch (e) {
      haptic.warning();
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen
      step="Last thing"
      title="The house rules 🤝"
      subtitle="Short version: real takes from real experiences. Nothing paid. Zero tolerance for abuse."
      footer={
        <View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="I agree — let me in 🔥" variant="hot" onPress={join} loading={busy} />
        </View>
      }
    >
      <View style={{ gap: 16 }}>
        {TERMS.map((s) => (
          <View key={s.heading}>
            <Text style={styles.h}>{s.heading}</Text>
            <Text style={styles.p}>{s.body}</Text>
          </View>
        ))}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  h: { fontSize: 16, fontWeight: "800", color: colors.ink, marginBottom: 4 },
  p: { fontSize: 15, lineHeight: 21, color: colors.inkSoft },
  error: { color: colors.hot, fontWeight: "700", marginBottom: 10, textAlign: "center" },
});
