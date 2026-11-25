import React, { useState } from "react";
import { router } from "expo-router";
import { AuthScreen } from "@/components/AuthScreen";
import { BigInput } from "@/components/BigInput";
import { Button } from "@/components/Button";
import { signupDraft } from "@/utils/signupDraft";

export default function Name() {
  const [name, setName] = useState(signupDraft.realName);
  const ok = name.trim().length >= 2;
  const go = () => {
    if (!ok) return;
    signupDraft.realName = name.trim().replace(/\s+/g, " ");
    router.push("/display");
  };
  return (
    <AuthScreen
      step="4 of 5"
      title="What's your name? ✍️"
      subtitle="Your real name — first and last. Next you'll choose whether your takes show it or say Anonymous."
      footer={<Button title="Continue" onPress={go} disabled={!ok} />}
    >
      <BigInput
        value={name}
        onChangeText={setName}
        placeholder="Chai Katz"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        autoFocus
        maxLength={60}
        returnKeyType="next"
        onSubmitEditing={go}
      />
    </AuthScreen>
  );
}
