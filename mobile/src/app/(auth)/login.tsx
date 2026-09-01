import { loginWithPassword } from "@/api/auth";
import { getErrorMessage } from "@/api/errors";
import { AppleLoginButton } from "@/components/AppleLoginButton";
import { Button } from "@/components/Button";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { Screen } from "@/components/Screen";
import { alertOnce } from "@/lib/alert";
import { AUTHED_HOME_HREF, GUEST_HOME_HREF } from "@/lib/auth-navigation";
import {
  canUseBiometricLogin,
  loadBiometricLoginCredentials,
  promptEnableBiometricLogin
} from "@/lib/biometric-login";
import { getBiometricSupport } from "@/lib/biometrics";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const theme = useThemeStore((s) => s.theme);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [bioLabel, setBioLabel] = useState("Face ID");
  const [bioAvailable, setBioAvailable] = useState(false);

  const onAppleError = useCallback((message: string) => {
    alertOnce("Apple sign-in", message);
  }, []);
  const onGoogleError = useCallback((message: string) => {
    alertOnce("Google sign-in", message);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const support = await getBiometricSupport();
      const enabled = await canUseBiometricLogin();
      if (!cancelled) {
        setBioLabel(support.label);
        setBioAvailable(support.available && enabled);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const goHome = () => {
    router.replace(AUTHED_HOME_HREF);
  };

  const finishPasswordLogin = async (user: string, pass: string, offerBiometrics: boolean) => {
    const payload = await loginWithPassword({ username: user, password: pass });
    await useSessionStore.getState().setSession(payload);
    if (!offerBiometrics) {
      goHome();
      return;
    }
    const support = await getBiometricSupport();
    if (!support.available || (await canUseBiometricLogin())) {
      goHome();
      return;
    }
    promptEnableBiometricLogin({
      label: support.label,
      username: user,
      password: pass,
      onDone: goHome
    });
  };

  const submit = async () => {
    if (!username || !password) {
      Alert.alert("Missing details", "Enter your username and password.");
      return;
    }
    setPending(true);
    try {
      await finishPasswordLogin(username, password, true);
    } catch (err) {
      Alert.alert("Login failed", getErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  const submitBiometric = async () => {
    if (pending) return;
    setPending(true);
    try {
      const creds = await loadBiometricLoginCredentials(`Sign in with ${bioLabel}`);
      if (!creds) {
        Alert.alert(
          `${bioLabel} unavailable`,
          "Sign in with your password once to set up biometric sign-in again."
        );
        setBioAvailable(false);
        return;
      }
      setUsername(creds.username);
      await finishPasswordLogin(creds.username, creds.password, false);
    } catch (err) {
      Alert.alert("Login failed", getErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Screen
      title="Play4096"
      subtitle="Optional — sync scores and compete. Or just play as a guest."
    >
      <View style={styles.card}>
        {bioAvailable ? (
          <Button disabled={pending} onPress={() => void submitBiometric()}>
            {pending ? "Signing in..." : `Sign in with ${bioLabel}`}
          </Button>
        ) : null}
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
        <Button variant="ghost" onPress={() => router.replace(GUEST_HOME_HREF)}>
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
