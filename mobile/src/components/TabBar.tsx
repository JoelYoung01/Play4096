import { useThemeStore } from "@/stores/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

const labels: Record<string, string> = { home: "Home", game: "Game", challenges: "Challenges", leaderboard: "Leaders", account: "Account" };

export function TabBar({ state, descriptors, navigation }: any) {
  const theme = useThemeStore((s) => s.theme);
  return (
    <View style={[styles.wrap, { backgroundColor: theme.background, borderTopColor: theme.border ?? theme.emptyTile }]}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return (
          <Pressable key={route.key} accessibilityRole="button" accessibilityState={focused ? { selected: true } : {}} onPress={onPress} style={styles.item}>
            <Text style={{ color: focused ? theme.primary : theme.textLight, fontWeight: focused ? "800" : "600", fontSize: 12 }}>{labels[route.name] ?? descriptors[route.key]?.options?.title ?? route.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({ wrap: { flexDirection: "row", borderTopWidth: 1, paddingTop: 10, paddingBottom: 24, paddingHorizontal: 8 }, item: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 38 } });
