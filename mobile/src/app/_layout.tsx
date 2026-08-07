import { AppLockGate } from "@/components/AppLockGate";
import { queryClient } from "@/lib/query-client";
import { useAppLockStore } from "@/stores/app-lock";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

function Bootstrap() {
  const status = useSessionStore((s) => s.status); const user = useSessionStore((s) => s.user); const theme = useThemeStore((s) => s.theme);
  useEffect(() => { void useSessionStore.getState().bootstrap(); void useAppLockStore.getState().bootstrap(); }, []);
  useEffect(() => { if (status !== "loading") void useThemeStore.getState().bootstrap(Boolean(user?.isPro)); }, [status, user?.isPro]);
  return <><StatusBar style={theme.id === "dark" || theme.id === "high-contrast" ? "light" : "dark"} /><Stack screenOptions={{ headerShown: false }} /><AppLockGate /></>;
}
export default function RootLayout() { return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><QueryClientProvider client={queryClient}><Bootstrap /></QueryClientProvider></SafeAreaProvider></GestureHandlerRootView>; }
