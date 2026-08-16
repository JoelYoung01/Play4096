import { TabBar } from "@/components/TabBar";
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function AppLayout() {
  return (
    <View style={styles.root}>
      <Stack
        screenOptions={({ route }) => {
          const playScreen = String(route.name).includes("play");
          return {
            headerShown: false,
            animation: "fade",
            gestureEnabled: !playScreen,
            fullScreenGestureEnabled: false
          };
        }}
      />
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }
});
