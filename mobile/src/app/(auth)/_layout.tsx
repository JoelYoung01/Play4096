import { authedHomeHref } from "@/lib/auth-navigation";
import { useSessionStore } from "@/stores/session";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const status = useSessionStore((s) => s.status);
  const href = authedHomeHref(status);
  if (href) return <Redirect href={href} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
