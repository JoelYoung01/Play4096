import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

export type BiometricSupport = { available: boolean; label: string };

export async function getBiometricSupport(): Promise<BiometricSupport> {
  if (Platform.OS === "web") return { available: false, label: "Biometrics" };
  const hardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const label = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    ? "Face ID"
    : types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
      ? "Touch ID"
      : "Biometrics";
  return { available: hardware && enrolled, label };
}

export async function authenticateBiometric(promptMessage: string): Promise<boolean> {
  const support = await getBiometricSupport();
  if (!support.available) return false;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: "Cancel",
    disableDeviceFallback: false
  });
  return result.success;
}
