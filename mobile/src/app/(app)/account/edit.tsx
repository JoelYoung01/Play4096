import { updateAccount } from "@/api/account";
import { getErrorMessage } from "@/api/errors";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text } from "react-native";

export default function EditAccountScreen() {
  const user = useSessionStore((s) => s.user);
  const theme = useThemeStore((s) => s.theme);
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [pending, setPending] = useState(false);

  const save = async () => {
    setPending(true);
    try {
      const result = await updateAccount({ displayName, email });
      if (result.user) await useSessionStore.getState().setUser(result.user);
      router.back();
    } catch (err) {
      Alert.alert("Could not save", getErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Screen title="Edit Details">
      <TextField label="Display Name" value={displayName} onChangeText={setDisplayName} />
      <TextField
        label={user?.emailVerified ? "Email (verified)" : "Email"}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {!user?.emailVerified && email ? (
        <Text style={{ color: theme.destructive ?? theme.primary }}>Unverified — add and verify an email to recover this account.</Text>
      ) : null}
      <Button disabled={pending} onPress={() => void save()}>
        {pending ? "Saving…" : "Save"}
      </Button>
      <Button variant="outline" onPress={() => router.back()}>
        Cancel
      </Button>
    </Screen>
  );
}
