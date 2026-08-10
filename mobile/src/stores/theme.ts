import { secureStorage } from "@/lib/secure-storage";
import { getTheme, resolveTheme, type Theme } from "@/theme/themes";
import { create } from "zustand";

const THEME_KEY = "play4096.theme";

type ThemeState = {
  ready: boolean;
  themeId: string;
  theme: Theme;
  bootstrap: (isPro?: boolean) => Promise<void>;
  setThemeId: (id: string, isPro?: boolean) => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set) => ({
  ready: false,
  themeId: "classic",
  theme: getTheme("classic"),
  async bootstrap(isPro = false) {
    const stored = await secureStorage.get(THEME_KEY);
    const theme = resolveTheme(stored, isPro);
    set({ ready: true, themeId: theme.id, theme });
  },
  async setThemeId(id, isPro = false) {
    const theme = resolveTheme(id, isPro);
    await secureStorage.set(THEME_KEY, theme.id);
    set({ themeId: theme.id, theme });
  }
}));
