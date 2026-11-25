import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { getPendingInvite, sendCode, testerSignIn, verifyCode } from "@/api/auth";
import { AuthScreen } from "@/components/AuthScreen";
import { BigInput } from "@/components/BigInput";
import { Button } from "@/components/Button";
import { useSession } from "@/providers/SessionProvider";
import { colors } from "@/theme";
import { errorMessage } from "@/utils/errors";
import { haptic } from "@/utils/haptics";
import { resetTo } from "@/utils/nav";
import { prettyPhone } from "@/utils/phone";

export default function Verify() {
  const { phone, mode } = useLocalSearchParams<{ phone: string; mode: "sms" | "tester" }>();
  const { refreshProfile } = useSession();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const submitting = useRef(false);
  const tester = mode === "tester";

  const submit = async (value: string) => {
    if (submitting.current || value.length < 6) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      if (tester) await testerSignIn(phone, value);
      else await verifyCode(phone, value);
      haptic.success();
      const profile = await refreshProfile();
      if (profile) {
        resetTo("/");
      } else {
        const pending = await getPendingInvite();
        if (pending) router.replace("/name");
        else router.replace("/invite?needed=1");
      }
    } catch (e) {
      haptic.warning();
      setError(errorMessage(e));
      setCode("");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <AuthScreen
      step="3 of 5"
      title="Enter the code 🔐"
      subtitle={
        tester
          ? `Texting codes isn't switched on yet, so this is tester sign-in for ${prettyPhone(phone)}. Enter the 6-digit tester code you were given.`
          : `We texted a 6-digit code to ${prettyPhone(phone)}.`
      }
      footer={<Button title="Verify" onPress={() => submit(code)} loading={busy} disabled={code.length < 6} />}
    >
      {tester ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>🧪 Tester mode</Text>
        </View>
      ) : null}
      <BigInput
        value={code}
        onChangeText={(v) => {
          const digits = v.replace(/\D/g, "").slice(0, 6);
          setCode(digits);
          if (digits.length === 6) void submit(digits);
        }}
        placeholder="••••••"
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus
        maxLength={6}
        style={{ letterSpacing: 14, textAlign: "center" }}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!tester ? (
        <Pressable
          onPress={async () => {
            try {
              await sendCode(phone);
              setResent(true);
            } catch (e) {
              setError(errorMessage(e));
            }
          }}
          style={{ marginTop: 20 }}
        >
          <Text style={styles.link}>{resent ? "Sent again ✓" : "Didn't get it? Send again"}</Text>
        </Pressable>
      ) : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  banner: { alignSelf: "flex-start", backgroundColor: "#FFF1D6", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 12 },
  bannerText: { color: "#9A5B00", fontWeight: "800", fontSize: 13 },
  error: { color: colors.hot, marginTop: 12, fontWeight: "700" },
  link: { color: colors.ink, fontWeight: "700", textDecorationLine: "underline" },
});
