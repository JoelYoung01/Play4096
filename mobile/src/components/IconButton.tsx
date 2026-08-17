import { useThemeStore } from "@/stores/theme";
import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View, type PressableProps } from "react-native";
import { Icon, type IconName } from "./Icon";

type IconButtonProps = PropsWithChildren<
  PressableProps & {
    name: IconName;
    label: string;
    badge?: string | number | null;
    badgeTone?: "cooldown" | "tile" | "pro";
    busy?: boolean;
  }
>;

export function IconButton({ name, label, badge, badgeTone = "cooldown", busy, disabled, children, ...props }: IconButtonProps) {
  const theme = useThemeStore((s) => s.theme);
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: theme.primary, opacity: disabled ? 0.4 : pressed ? 0.82 : 1 }
      ]}
    >
      <Icon name={name} size={18} color={theme.textDark} />
      {badge != null && badge !== "" ? (
        <View
          style={[
            styles.badge,
            badgeTone === "tile" ? styles.tileBadge : badgeTone === "pro" ? styles.proBadge : styles.cooldownBadge
          ]}
        >
          {badgeTone === "pro" ? <Icon name="crown" size={9} color="#422006" /> : <Text style={styles.badgeText}>{badge}</Text>}
        </View>
      ) : null}
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center"
  },
  cooldownBadge: { backgroundColor: "rgba(0,0,0,0.7)" },
  tileBadge: { backgroundColor: "#fbbf24" },
  proBadge: { backgroundColor: "#fbbf24", minWidth: 16, paddingHorizontal: 0 },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" }
});
