import { useThemeStore } from "@/stores/theme";
import type { PropsWithChildren } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";

type Stat = { label: string; value: string; newBest?: boolean };

export function GameOverlay({
  open,
  title,
  subtitle,
  stats,
  children
}: PropsWithChildren<{ open: boolean; title: string; subtitle?: string; stats?: Stat[] }>) {
  const theme = useThemeStore((s) => s.theme);
  return (
    <Modal visible={open} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <Text style={[styles.title, { color: theme.text ?? theme.textLight }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: theme.textLight }]}>{subtitle}</Text> : null}
          {stats?.length ? (
            <View style={styles.stats}>
              {stats.map((stat) => (
                <View key={stat.label} style={[styles.stat, { backgroundColor: theme.boardBackground }]}>
                  <Text style={[styles.statLabel, { color: theme.textDark }]}>{stat.label}</Text>
                  <Text style={[styles.statValue, { color: theme.textDark }]}>{stat.value}</Text>
                  {stat.newBest ? <Text style={[styles.best, { color: theme.primary }]}>New best</Text> : null}
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.actions}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", padding: 20 },
  card: { borderRadius: 16, padding: 28, gap: 12 },
  title: { fontSize: 28, fontWeight: "900", textAlign: "center" },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 21 },
  stats: { flexDirection: "row", gap: 8, marginVertical: 8 },
  stat: { flex: 1, borderRadius: 10, padding: 10, alignItems: "center" },
  statLabel: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  statValue: { fontSize: 16, fontWeight: "800", marginTop: 4 },
  best: { fontSize: 10, fontWeight: "800", marginTop: 4, textTransform: "uppercase" },
  actions: { gap: 8, marginTop: 8 }
});
