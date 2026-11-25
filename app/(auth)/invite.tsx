import React, { useState } from "react";
import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { checkInvite, normalizeInvite, savePendingInvite } from "@/api/auth";
import { AuthScreen } from "@/components/AuthScreen";
import { BigInput } from "@/components/BigInput";
import { Button } from "@/components/Button";
import { useSession } from "@/providers/SessionProvider";
import { colors } from "@/theme";
import { errorMessage } from "@/utils/errors";
import { haptic } from "@/utils/haptics";

export default function Invite() {
  const { needed } = useLocalSearchParams<{ needed?: string }>();
  const { session } = useSession();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      const ok = await checkInvite(code);
      if (!ok) {
        haptic.warning();
        setError("That code isn't valid or was already used.");
        return;
      }
      await savePendingInvite(code);
      haptic.success();
      // Already verified (signed in without an account yet)? Skip the phone step.
      if (session) router.replace("/name");
      else router.push("/phone");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen
      step="1 of 5"
      title="Got an invite? 🎟️"
      subtitle={
        needed
          ? "Your number is verified, but Hot Take is invite only. Enter the code a member sent you to finish joining."
          : "Hot Take is invite only. Enter the code a member sent you."
      }
      footer={<Button title="Continue" onPress={go} loading={busy} disabled={normalizeInvite(code).length < 4} />}
    >
      <BigInput
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase())}
        placeholder="ABC123"
        autoCapitalize="characters"
        autoCorrect={false}
        autoFocus
        maxLength={12}
        returnKeyType="go"
        onSubmitEditing={go}
        style={{ letterSpacing: 4 }}
      />
      {error ? <Text style={{ color: colors.hot, marginTop: 12, fontWeight: "700" }}>{error}</Text> : null}
    </AuthScreen>
  );
}
