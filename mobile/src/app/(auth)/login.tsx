import { loginWithPassword } from "@/api/auth";
import { getErrorMessage } from "@/api/errors";
import { AppleLoginButton } from "@/components/AppleLoginButton";
import { Button } from "@/components/Button";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { Screen } from "@/components/Screen";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { Link, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const theme = useThemeStore((s) => s.theme);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const onAppleError = useCallback((message: string) => {
    Alert.alert("Apple sign-in", message);
  }, []);
  const onGoogleError = useCallback((message: string) => {
    Alert.alert("Google sign-in", message);
  }, []);

  const submit = async () => {
    if (!username || !password) {
      Alert.alert("Missing details", "Enter your username and password.");
      return;
    }
    setPending(true);
    try {
      const payload = await loginWithPassword({ username, password });
      await useSessionStore.getState().setSession(payload.access_token, payload.user);
      router.replace("/(app)/(tabs)/home");
    } catch (err) {
      Alert.alert("Login failed", getErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Screen
      title="Play4096"
      subtitle="Sign in to sync games, leaderboards, Pro themes, challenges, and history."
    >
      <View style={styles.card}>
        <TextInput
          autoCapitalize="none"
          placeholder="Username"
          placeholderTextColor={theme.textLight}
          value={username}
          onChangeText={setUsername}
          style={[styles.input, { borderColor: theme.emptyTile, color: theme.text ?? theme.textLight }]}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={theme.textLight}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[styles.input, { borderColor: theme.emptyTile, color: theme.text ?? theme.textLight }]}
        />
        <Button disabled={pending} onPress={() => void submit()}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>
        <AppleLoginButton onPendingChange={setPending} onError={onAppleError} />
        <GoogleLoginButton onPendingChange={setPending} onError={onGoogleError} />
        <Button variant="ghost" onPress={() => router.replace("/(app)/(tabs)/game")}>
          Continue as guest
        </Button>
        <Text style={{ color: theme.textLight, textAlign: "center" }}>
          New here?{" "}
          <Link href="/(auth)/register" style={{ color: theme.primary, fontWeight: "800" }}>
            Create an account
          </Link>
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, minHeight: 48, fontSize: 16 }
});
