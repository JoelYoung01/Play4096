import { useThemeStore } from "@/stores/theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export type IconName =
  | "home"
  | "game"
  | "challenges"
  | "leaderboard"
  | "account"
  | "plus"
  | "undo"
  | "rotateCw"
  | "rotateCcw"
  | "mirrorH"
  | "mirrorV"
  | "checkpoint"
  | "crown"
  | "check"
  | "close"
  | "chevronLeft"
  | "chevronRight"
  | "arrowLeft"
  | "trophy"
  | "stats"
  | "history"
  | "play"
  | "pause"
  | "skip"
  | "pencil"
  | "lock"
  | "help";

const glyph: Record<IconName, keyof typeof MaterialCommunityIcons.glyphMap> = {
  home: "home-outline",
  game: "view-grid-outline",
  challenges: "target",
  leaderboard: "trophy-outline",
  account: "account-outline",
  plus: "plus",
  undo: "undo",
  rotateCw: "rotate-right",
  rotateCcw: "rotate-left",
  mirrorH: "arrow-left-right",
  mirrorV: "arrow-up-down",
  checkpoint: "bookmark-outline",
  crown: "crown",
  check: "check-bold",
  close: "close-thick",
  chevronLeft: "chevron-left",
  chevronRight: "chevron-right",
  arrowLeft: "arrow-left",
  trophy: "trophy-outline",
  stats: "chart-bar",
  history: "history",
  play: "play",
  pause: "pause",
  skip: "skip-next",
  pencil: "pencil-outline",
  lock: "lock-outline",
  help: "help-circle-outline"
};

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const theme = useThemeStore((s) => s.theme);
  return <MaterialCommunityIcons name={glyph[name]} size={size} color={color ?? theme.text ?? theme.textLight} />;
}
