import { TabBar } from "@/components/TabBar";
import { Tabs } from "expo-router";
export default function TabsLayout() { return <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}><Tabs.Screen name="home" /><Tabs.Screen name="game" /><Tabs.Screen name="challenges" /><Tabs.Screen name="leaderboard" /><Tabs.Screen name="account" /></Tabs>; }
