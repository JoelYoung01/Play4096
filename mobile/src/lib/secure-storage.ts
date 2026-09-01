import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type SecureStorageOptions = {
  requireAuthentication?: boolean;
  authenticationPrompt?: string;
};

function toSecureStoreOptions(options?: SecureStorageOptions): SecureStore.SecureStoreOptions | undefined {
  if (!options?.requireAuthentication) return undefined;
  return {
    requireAuthentication: true,
    authenticationPrompt: options.authenticationPrompt || "Authenticate to continue",
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  };
}

export const secureStorage = {
  async get(key: string, options?: SecureStorageOptions): Promise<string | null> {
    if (Platform.OS === "web") {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key, toSecureStoreOptions(options));
  },
  async set(key: string, value: string, options?: SecureStorageOptions): Promise<void> {
    if (Platform.OS === "web") {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        // Private browsing can reject storage writes.
      }
      return;
    }
    await SecureStore.setItemAsync(key, value, toSecureStoreOptions(options));
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        // Private browsing can reject storage writes.
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  }
};
