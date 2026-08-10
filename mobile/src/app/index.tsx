import { useSessionStore } from "@/stores/session";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const status = useSessionStore((s) => s.status);
  if (status === "loading") return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator /></View>;
  return <Redirect href={status === "authed" ? "/(app)/(tabs)/home" : "/(auth)/login"} />;
}
