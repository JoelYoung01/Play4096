import type { Theme } from "@/types";

export type { Theme };

export function relativeLuminance(hex: string) {
  let raw = hex.replace(/^#/, "");
  if (raw.length === 3) raw = raw.split("").map((x) => x + x).join("");
  const num = parseInt(raw, 16);
  const channels = [(num >> 16) & 255, (num >> 8) & 255, num & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
export const contrastRatio = (a: string, b: string) => {
  const l1 = relativeLuminance(a), l2 = relativeLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};
export const getInkColor = (bg: string, theme: Theme) => theme.id === "classic" ? (relativeLuminance(bg) < theme.luminanceThreshold ? theme.textDark : theme.textLight) : (contrastRatio(bg, theme.textLight) >= contrastRatio(bg, theme.textDark) ? theme.textLight : theme.textDark);

const classicTiles = { 2: "#eee4d9", 4: "#ece0c8", 8: "#f2b179", 16: "#eb8e53", 32: "#f67c5f", 64: "#e95937", 128: "#f3d96c", 256: "#f1d14c", 512: "#efd179", 1024: "#eece69", 2048: "#edc32e", 4096: "#5eda92", 8192: "#2E8B57", 16384: "#3E5641", 32768: "#AD9BAA", 65536: "#5BC0EB", 131072: "#540D6E", 262144: "#7B2D26", 524288: "#065A82", 1048576: "#F4F7BE", 2097152: "#63A375" };
const base = { textScale: 3, movementSpeed: 50 };
export const classicTheme: Theme = { ...base, id: "classic", name: "Classic", pro: false, primary: "#b8541a", secondary: "#C2D4B0", secondaryForeground: "#3e5641", background: "#fbf8ef", boardBackground: "#bbada0", emptyTile: "#cdc1b4", textLight: "#776e65", textDark: "#f9f6f2", text: "#776e65", unknownTile: "#5f5f5f", destructive: "#c93d20", shadows: true, luminanceThreshold: 0.7, challengeWon: "#059669", challengeLost: "#9f1239", challengeToday: "#7eb3d4", tiles: { ...classicTiles } };
export const darkTheme: Theme = { ...base, id: "dark", name: "Dark", pro: false, primary: "#e88f4f", secondary: "#3d5a45", background: "#1c1a18", boardBackground: "#2d2a26", emptyTile: "#3e3a34", textLight: "#1c1a18", textDark: "#e8e4df", text: "#e8e4df", unknownTile: "#6b6b78", destructive: "#f2643f", shadows: false, luminanceThreshold: 0.45, challengeWon: "#34d399", challengeLost: "#e11d48", challengeToday: "#4a7fa8", tiles: { 2: "#4a4a55", 4: "#5c5348", 8: "#c47a3a", 16: "#d48a3a", 32: "#e06a4a", 64: "#d44528", 128: "#d4b84a", 256: "#c9a82e", 512: "#bf9e3a", 1024: "#b8942a", 2048: "#a88818", 4096: "#2e9a5c", 8192: "#6a8a28", 16384: "#2a3a2e", 32768: "#6a5a6a", 65536: "#2a7a9a", 131072: "#4a0a5a", 262144: "#5a1a18", 524288: "#044a6a", 1048576: "#8a8a5a", 2097152: "#3a6a4a" } };
export const lightTheme: Theme = { ...base, id: "light", name: "Light", pro: false, primary: "#2f74c0", secondary: "#a8c5a0", secondaryForeground: "#2b4226", background: "#f7fafc", boardBackground: "#dce3ea", emptyTile: "#eef2f6", border: "#c9d3dc", textLight: "#4a5560", textDark: "#f9fcfe", text: "#2d3740", unknownTile: "#8899aa", destructive: "#c22f2f", shadows: true, luminanceThreshold: 0.65, challengeWon: "#059669", challengeLost: "#9f1239", challengeToday: "#9bc4e2", tiles: { 2: "#f7f9fc", 4: "#e8eef5", 8: "#7eb3e8", 16: "#5a9ad9", 32: "#4a85c8", 64: "#3a70b7", 128: "#6ec4a8", 256: "#4aaf8e", 512: "#3a9a7a", 1024: "#2a8568", 2048: "#1a7056", 4096: "#e8a05a", 8192: "#d4883a", 16384: "#3E5641", 32768: "#AD9BAA", 65536: "#5BC0EB", 131072: "#540D6E", 262144: "#7B2D26", 524288: "#065A82", 1048576: "#F4F7BE", 2097152: "#63A375" } };
export const highContrastTheme: Theme = { ...base, id: "high-contrast", name: "High Contrast", pro: true, primary: "#ffcc00", secondary: "#00e5ff", background: "#0c0b09", boardBackground: "#171412", emptyTile: "#262220", border: "#4a443c", textLight: "#0c0b09", textDark: "#f8f6f1", text: "#f8f6f1", unknownTile: "#888888", destructive: "#ff4d42", shadows: false, luminanceThreshold: 0.5, challengeWon: "#00ff88", challengeLost: "#ff0066", challengeToday: "#66b3ff", tiles: { 2: "#ffffff", 4: "#eeeeee", 8: "#ffcc00", 16: "#ff9900", 32: "#ff6600", 64: "#ff3300", 128: "#00e5ff", 256: "#00b8ff", 512: "#0088ff", 1024: "#0055ff", 2048: "#00ff88", 4096: "#88ff00", 8192: "#ccff00", 16384: "#ff00aa", 32768: "#aa00ff", 65536: "#ff00ff", 131072: "#ffff00", 262144: "#00ffff", 524288: "#ff0088", 1048576: "#88ffff", 2097152: "#ffff88" } };
export const softTheme: Theme = { ...base, id: "soft", name: "Soft", pro: true, primary: "#7e5a4c", secondary: "#9aab9a", secondaryForeground: "#2a3428", background: "#e8e4df", boardBackground: "#c4b8ae", emptyTile: "#d4cbc3", textLight: "#52493f", textDark: "#f5f2ee", text: "#52493f", unknownTile: "#8a8078", destructive: "#a83a1e", shadows: true, luminanceThreshold: 0.65, challengeWon: "#059669", challengeLost: "#9f1239", challengeToday: "#8aadc4", tiles: { 2: "#f0ebe6", 4: "#e4dbd2", 8: "#d4a890", 16: "#c49078", 32: "#b47860", 64: "#a06050", 128: "#b8c4a0", 256: "#a0b088", 512: "#889c70", 1024: "#708858", 2048: "#587440", 4096: "#90a8b8", 8192: "#7890a0", 16384: "#607888", 32768: "#b8a0b0", 65536: "#8898a8", 131072: "#706080", 262144: "#886060", 524288: "#507088", 1048576: "#c8c8a8", 2097152: "#708870" } };
export const coralTheme: Theme = { ...base, id: "coral", name: "Coral", pro: true, primary: "#c73333", secondary: "#4ecdc4", background: "#fbf3ef", boardBackground: "#e8a090", emptyTile: "#f0c8bc", textLight: "#5a4038", textDark: "#fff8f5", text: "#5a4038", unknownTile: "#8a6860", destructive: "#c93d20", shadows: true, luminanceThreshold: 0.6, challengeWon: "#059669", challengeLost: "#7e22ce", challengeToday: "#7eb3d4", tiles: { 2: "#fff0eb", 4: "#ffe0d6", 8: "#ff8a7a", 16: "#ff6b6b", 32: "#ee5a5a", 64: "#dd4848", 128: "#5ed4cc", 256: "#4ecdc4", 512: "#3eb8b0", 1024: "#2ea39c", 2048: "#1e8e88", 4096: "#ffb347", 8192: "#ffa02e", 16384: "#3E5641", 32768: "#AD9BAA", 65536: "#5BC0EB", 131072: "#540D6E", 262144: "#7B2D26", 524288: "#065A82", 1048576: "#F4F7BE", 2097152: "#63A375" } };
export const themes: Record<string, Theme> = { classic: classicTheme, dark: darkTheme, light: lightTheme, "high-contrast": highContrastTheme, soft: softTheme, coral: coralTheme };
export const DEFAULT_THEME_ID = "classic";
export const defaultTheme = classicTheme;
export const getTheme = (id?: string | null) => (id && themes[id] ? themes[id] : classicTheme);
export const listThemes = () => Object.values(themes);
export const resolveTheme = (id?: string | null, isPro = false) => { const theme = getTheme(id); return theme.pro && !isPro ? classicTheme : theme; };
