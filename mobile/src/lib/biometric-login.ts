import { authenticateBiometric, getBiometricSupport } from "@/lib/biometrics";
import { secureStorage } from "@/lib/secure-storage";
import { Platform } from "react-native";

const CREDS_KEY = "play4096.biometric_login_creds";
const ENABLED_KEY = "play4096.biometric_login_enabled";

export type BiometricLoginCredentials = {
  username: string;
  password: string;
};

export async function isBiometricLoginEnabled(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  return (await secureStorage.get(ENABLED_KEY)) === "1";
}

export async function canUseBiometricLogin(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const support = await getBiometricSupport();
  if (!support.available) return false;
  return isBiometricLoginEnabled();
}

export async function enableBiometricLogin(username: string, password: string): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const support = await getBiometricSupport();
  if (!support.available) return false;
  const trimmedUser = username.trim();
  if (!trimmedUser || !password) return false;

  const verified = await authenticateBiometric(`Enable ${support.label} sign-in`);
  if (!verified) return false;

  const payload = JSON.stringify({ username: trimmedUser, password } satisfies BiometricLoginCredentials);
  await secureStorage.set(CREDS_KEY, payload, {
    requireAuthentication: true,
    authenticationPrompt: `Save credentials for ${support.label} sign-in`
  });
  await secureStorage.set(ENABLED_KEY, "1");
  return true;
}

export async function disableBiometricLogin(): Promise<void> {
  await secureStorage.remove(CREDS_KEY);
  await secureStorage.remove(ENABLED_KEY);
}

export async function loadBiometricLoginCredentials(promptMessage: string): Promise<BiometricLoginCredentials | null> {
  if (!(await canUseBiometricLogin())) return null;
  try {
    const raw = await secureStorage.get(CREDS_KEY, {
      requireAuthentication: true,
      authenticationPrompt: promptMessage
    });
    if (!raw) {
      await disableBiometricLogin();
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<BiometricLoginCredentials>;
    if (typeof parsed.username !== "string" || typeof parsed.password !== "string") {
      await disableBiometricLogin();
      return null;
    }
    return { username: parsed.username, password: parsed.password };
  } catch {
    return null;
  }
}

/** Offer Face ID / Touch ID after a successful password sign-in. */
export function promptEnableBiometricLogin(args: {
  label: string;
  username: string;
  password: string;
  onDone: () => void;
}): void {
  // Lazy import Alert to keep this module easy to unit-test.
  const { Alert } = require("react-native") as typeof import("react-native");
  Alert.alert(
    `Use ${args.label} next time?`,
    `Sign in with ${args.label} instead of typing your password. Sessions last for months, so you will rarely need this.`,
    [
      {
        text: "Not now",
        style: "cancel",
        onPress: () => args.onDone()
      },
      {
        text: `Enable ${args.label}`,
        onPress: () => {
          void (async () => {
            try {
              const ok = await enableBiometricLogin(args.username, args.password);
              if (!ok) {
                Alert.alert("Could not enable", `Try again from Account if you want ${args.label} sign-in.`);
              }
            } finally {
              args.onDone();
            }
          })();
        }
      }
    ]
  );
}
