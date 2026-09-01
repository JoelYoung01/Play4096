import { coldStartHref } from "@/lib/auth-navigation";
import { useSessionStore } from "@/stores/session";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const status = useSessionStore((s) => s.status);
  const href = coldStartHref(status);
  if (!href) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Redirect href={href} />;
}
