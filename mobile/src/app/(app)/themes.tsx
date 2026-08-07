import { getThemes, setTheme } from "@/api/themes";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { listThemes } from "@/theme/themes";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function ThemesScreen() {
  const user = useSessionStore((s) => s.user); const active = useThemeStore((s) => s.themeId); const localTheme = useThemeStore((s) => s.theme); const { data } = useQuery({ queryKey: ["themes"], queryFn: getThemes, enabled: Boolean(user) });
  const themes = data?.themes ?? listThemes(); const isPro = Boolean(data?.isPro ?? user?.isPro);
  const choose = async (id: string, locked?: boolean) => { if (locked) { Alert.alert("Pro theme", "Upgrade to Pro to use this theme."); return; } await useThemeStore.getState().setThemeId(id, isPro); if (user) await setTheme(id).catch(() => undefined); };
  return <Screen title="Themes" subtitle="Theme colors apply to the board and app chrome.">{themes.map((t) => <View key={t.id} style={[styles.row, { borderColor: active === t.id ? localTheme.primary : localTheme.emptyTile }]}><View style={[styles.swatch, { backgroundColor: t.boardBackground }]}><View style={[styles.mini, { backgroundColor: t.tiles[2] }]} /><View style={[styles.mini, { backgroundColor: t.tiles[8] }]} /></View><View style={{ flex: 1 }}><Text style={[styles.name, { color: localTheme.text ?? localTheme.textLight }]}>{t.name}</Text><Text style={{ color: localTheme.textLight }}>{t.pro ? "Pro" : "Free"}{t.locked ? " • locked" : ""}</Text></View><Button variant={active === t.id ? "secondary" : "outline"} onPress={() => void choose(t.id, t.locked)}>Use</Button></View>)}{!isPro ? <Link href="/(app)/pro" asChild><Button>Unlock Pro themes</Button></Link> : null}</Screen>;
}
const styles = StyleSheet.create({ row: { borderWidth: 2, borderRadius: 18, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }, swatch: { width: 62, height: 62, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 }, mini: { width: 22, height: 22, borderRadius: 6 }, name: { fontSize: 17, fontWeight: "900" } });
