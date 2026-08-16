import { TAB_BAR_RESERVE } from "@/game/constants";
import { useThemeStore } from "@/stores/theme";
import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  scroll?: boolean;
  style?: ViewStyle;
  paddedForTabBar?: boolean;
}>;

export function Screen({ title, subtitle, scroll = true, style, paddedForTabBar = true, children }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useThemeStore((s) => s.theme);
  const content = (
    <View
      style={[
        styles.content,
        {
          paddingTop: insets.top + 16,
          paddingBottom: (paddedForTabBar ? TAB_BAR_RESERVE : 24) + insets.bottom
        },
        style
      ]}
    >
      {title ? <Text style={[styles.title, { color: theme.text ?? theme.textLight }]}>{title}</Text> : null}
      {subtitle ? <Text style={[styles.subtitle, { color: theme.textLight }]}>{subtitle}</Text> : null}
      {children}
    </View>
  );
  if (!scroll) return <View style={[styles.container, { backgroundColor: theme.background }]}>{content}</View>;
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, gap: 16 },
  title: { fontSize: 34, lineHeight: 38, fontWeight: "900", letterSpacing: -1 },
  subtitle: { fontSize: 15, lineHeight: 21 }
});
