import type { Theme } from "@/types";
import { get, post } from "./client";

export type ThemesResponse = { themes: Theme[]; activeThemeId: string; isPro: boolean };
export const getThemes = () => get<ThemesResponse>("/themes");
export const setTheme = (themeId: string) => post<{ success: boolean; themeId: string }>("/themes", { themeId });
