import React, { forwardRef } from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";
import { colors } from "@/theme";

/** The large, borderless input used on the sign-up screens. */
export const BigInput = forwardRef<React.ComponentRef<typeof TextInput>, TextInputProps>(function BigInput(props, ref) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.inkFaint}
      selectionColor={colors.hot}
      {...props}
      style={[styles.input, props.style]}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.line,
  },
});
