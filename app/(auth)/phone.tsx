import React, { useState } from "react";
import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { sendCode } from "@/api/auth";
import { AuthScreen } from "@/components/AuthScreen";
import { BigInput } from "@/components/BigInput";
import { Button } from "@/components/Button";
import { allowTestLogin } from "@/lib/env";
import { colors } from "@/theme";
import { errorMessage } from "@/utils/errors";
import { formatPhoneInput, toE164 } from "@/utils/phone";

export default function Phone() {
  const { returning } = useLocalSearchParams<{ returning?: string }>();
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phone = toE164(raw);

  const go = async () => {
    if (!phone) return;
    setBusy(true);
    setError(null);
    try {
      const res = await sendCode(phone);
      if (res.mode === "tester" && !allowTestLogin()) {
        setError("Texting codes isn't switched on yet. Try again soon.");
        return;
      }
      router.push({ pathname: "/verify", params: { phone, mode: res.mode } });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen
      step={returning ? "Sign in" : "2 of 5"}
      title="What's your number? 📱"
      subtitle="We'll text you a code. One account per number — that's how Hot Take stays verified humans only. Your number is never shown to anyone."
      footer={<Button title="Text me a code" onPress={go} loading={busy} disabled={!phone} />}
    >
      <BigInput
        value={raw}
        onChangeText={(v) => setRaw(formatPhoneInput(v))}
        placeholder="(212) 555-0199"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        autoFocus
        returnKeyType="go"
        onSubmitEditing={go}
      />
      <Text style={{ color: colors.inkFaint, marginTop: 10 }}>US numbers by default. Start with + for other countries.</Text>
      {error ? <Text style={{ color: colors.hot, marginTop: 12, fontWeight: "700" }}>{error}</Text> : null}
    </AuthScreen>
  );
}
