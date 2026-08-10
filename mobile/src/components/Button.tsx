import { useThemeStore } from "@/stores/theme";
import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, type PressableProps, type ViewStyle } from "react-native";

type ButtonProps = PropsWithChildren<PressableProps & { variant?: "primary" | "secondary" | "ghost" | "outline" | "danger"; style?: ViewStyle; textStyle?: ViewStyle }>;

export function Button({ children, variant = "primary", style, textStyle, disabled, ...props }: ButtonProps) {
  const theme = useThemeStore((s) => s.theme);
  const bg = variant === "primary" ? theme.primary : variant === "secondary" ? theme.secondary : variant === "danger" ? (theme.destructive ?? "#c93d20") : "transparent";
  const borderColor = variant === "outline" ? theme.primary : "transparent";
  const color = variant === "ghost" || variant === "outline" ? theme.primary : variant === "secondary" ? (theme.secondaryForeground ?? theme.textLight) : theme.textDark;
  return (
    <Pressable {...props} disabled={disabled} style={({ pressed }) => [styles.button, { backgroundColor: bg, borderColor, opacity: disabled ? 0.5 : pressed ? 0.82 : 1 }, style]}>
      {typeof children === "string" ? <Text style={[styles.text, { color }, textStyle]}>{children}</Text> : children}
    </Pressable>
  );
}
const styles = StyleSheet.create({ button: { minHeight: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }, text: { fontSize: 16, fontWeight: "700" } });
