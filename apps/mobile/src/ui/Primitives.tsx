import React from "react";
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { useTheme } from "../app/theme";

export function Screen({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <View style={[styles.screen, { backgroundColor: colors.bg }]}>{children}</View>;
}

export function Panel({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  return <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }, style]}>{children}</View>;
}

export function H1({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const { colors } = useTheme();
  return <Text style={[styles.h1, { color: colors.text }, style]}>{children}</Text>;
}

export function P({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const { colors } = useTheme();
  return <Text style={[styles.p, { color: colors.subtext }, style]}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  variant = "primary"
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
}) {
  const { colors } = useTheme();
  const bg = variant === "primary" ? colors.accent : colors.panel;
  const border = variant === "primary" ? colors.accent : colors.border;
  const textColor = variant === "primary" ? "#071018" : colors.text;

  return (
    <Pressable onPress={onPress} style={[styles.btn, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.btnText, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  panel: { borderWidth: 1, borderRadius: 16, padding: 14 },
  h1: { fontSize: 20, fontWeight: "700", letterSpacing: 0.2 },
  p: { marginTop: 6, fontSize: 13, lineHeight: 18 },
  btn: { marginTop: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1 },
  btnText: { fontWeight: "700", textAlign: "center" }
});

