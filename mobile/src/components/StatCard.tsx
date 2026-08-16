import { useThemeStore } from "@/stores/theme";
import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

export function StatCard({
  label,
  value,
  hint,
  wide,
  children
}: PropsWithChildren<{ label: string; value?: string; hint?: string; wide?: boolean }>) {
  const theme = useThemeStore((s) => s.theme);
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.secondary, borderColor: theme.border ?? theme.emptyTile },
        wide ? styles.wide : null
      ]}
    >
      <Text style={[styles.label, { color: theme.textLight }]}>{label}</Text>
      {children ?? <Text style={[styles.value, { color: theme.text ?? theme.textLight }]}>{value}</Text>}
      {hint ? <Text style={[styles.hint, { color: theme.textLight }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: "48%", borderRadius: 14, padding: 14, borderWidth: 1, gap: 4 },
  wide: { width: "100%" },
  label: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  value: { fontSize: 24, fontWeight: "900" },
  hint: { fontSize: 11 }
});
