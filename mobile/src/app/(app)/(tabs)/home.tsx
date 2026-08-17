import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentGame } from "@/api/game";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { LOCAL_STORAGE_CURRENT_GAME } from "@/game/constants";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const user = useSessionStore((s) => s.user);
  const token = useSessionStore((s) => s.token);
  const theme = useThemeStore((s) => s.theme);
  const [hasGame, setHasGame] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const local = await AsyncStorage.getItem(LOCAL_STORAGE_CURRENT_GAME);
        if (local && !cancelled) setHasGame(true);
        if (token) {
          const current = await getCurrentGame().catch(() => null);
          if (!cancelled && current?.game) setHasGame(true);
        }
      } catch {
        /* keep default */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={[styles.logo, { color: theme.primary }]}>4096</Text>
        <Text style={[styles.tagline, { color: theme.text ?? theme.textLight }]}>
          {user ? `Welcome back, ${user.displayName || user.username}!` : "The Ultimate Tile-Matching Puzzle Game"}
        </Text>
      </View>

      <View style={styles.actions}>
        <Link href="/(app)/(tabs)/game" asChild>
          <Button>{hasGame ? "Continue Game" : "Start New Game"}</Button>
        </Link>
        {user ? (
          <Link href="/(app)/(tabs)/account" asChild>
            <Button>Your Account</Button>
          </Link>
        ) : (
          <Link href="/(auth)/login" asChild>
            <Button>Login / Create Account</Button>
          </Link>
        )}
        {!user?.isPro ? (
          <Link href="/(app)/pro" asChild>
            <Button>Upgrade to Pro</Button>
          </Link>
        ) : null}
        <Link href="/(app)/(tabs)/challenges" asChild>
          <Button>Challenges</Button>
        </Link>
        <Link href="/(app)/(tabs)/leaderboard" asChild>
          <Button>View Leaderboard</Button>
        </Link>
      </View>

      <Text style={[styles.credit, { color: theme.textLight }]}>
        Inspired by the original{" "}
        <Text style={[styles.link, { color: theme.primary }]} onPress={() => void Linking.openURL("https://play2048.co/")}>
          2048 game
        </Text>
        , by{" "}
        <Text style={[styles.link, { color: theme.primary }]} onPress={() => void Linking.openURL("https://github.com/gabrielecirulli")}>
          Gabriele Cirulli
        </Text>
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", marginTop: 24, marginBottom: 12 },
  logo: { fontSize: 72, fontWeight: "900", letterSpacing: -2 },
  tagline: { fontSize: 18, fontWeight: "400", textAlign: "center" },
  actions: { gap: 12, marginTop: 8 },
  credit: { textAlign: "center", marginTop: 28, lineHeight: 22 },
  link: { fontWeight: "700" }
});
