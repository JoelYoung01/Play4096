import { useThemeStore } from "@/stores/theme";
import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "./Icon";

const tabs: { name: IconName; href: string; match: (path: string) => boolean }[] = [
  { name: "home", href: "/(app)/(tabs)/home", match: (path) => path === "/" || path.endsWith("/home") },
  { name: "game", href: "/(app)/(tabs)/game", match: (path) => path.includes("/game") },
  { name: "challenges", href: "/(app)/(tabs)/challenges", match: (path) => path.includes("challenge") },
  { name: "leaderboard", href: "/(app)/(tabs)/leaderboard", match: (path) => path.includes("leaderboard") && !path.includes("challenge") },
  { name: "stats", href: "/(app)/stats", match: (path) => path.includes("stats") },
  { name: "history", href: "/(app)/history", match: (path) => path.includes("history") },
  { name: "account", href: "/(app)/(tabs)/account", match: (path) => path.includes("account") }
];

export function TabBar() {
  const theme = useThemeStore((s) => s.theme);
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const active = tabs.find((tab) => tab.match(pathname)) ?? null;

  return (
    <View pointerEvents="box-none" style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View
        style={[
          styles.pill,
          {
            backgroundColor: theme.secondary,
            shadowColor: theme.textLight,
            borderColor: theme.border ?? "transparent"
          }
        ]}
      >
        {tabs.map((tab) => {
          const focused = active === tab;
          return (
            <Pressable
              key={tab.name}
              accessibilityRole="button"
              accessibilityLabel={tab.name}
              accessibilityState={{ selected: focused }}
              onPress={() => router.navigate(tab.href as never)}
              style={[
                styles.item,
                { backgroundColor: focused ? theme.primary : theme.background }
              ]}
            >
              <Icon name={tab.name} size={20} color={focused ? theme.textDark : theme.text ?? theme.textLight} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    zIndex: 50
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  item: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center"
  }
});
