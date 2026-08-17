import { deleteAccount } from "@/api/account";
import { getErrorMessage } from "@/api/errors";
import { AppLockToggle } from "@/components/AppLockToggle";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Screen } from "@/components/Screen";
import { queryClient } from "@/lib/query-client";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function AccountScreen() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const status = useSessionStore((s) => s.status);
  const theme = useThemeStore((s) => s.theme);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const signOut = async () => {
    await useSessionStore.getState().logout();
    queryClient.clear();
    router.replace("/(auth)/login");
  };

  const remove = async () => {
    try {
      await deleteAccount();
      await useSessionStore.getState().clear();
      queryClient.clear();
      router.replace("/(auth)/login");
    } catch (err) {
      Alert.alert("Could not delete account", getErrorMessage(err));
    }
  };

  if (status !== "authed") {
    return (
      <Screen title="Account" subtitle="Create an account to sync progress and unlock Pro.">
        <Link href="/(auth)/login" asChild>
          <Button>Sign in</Button>
        </Link>
      </Screen>
    );
  }

  return (
    <Screen title="Account">
      <Text style={{ color: theme.textLight }}>Hello, {user?.displayName || user?.username}!</Text>
      <View style={[styles.card, { borderColor: theme.emptyTile }]}>
        <Text style={[styles.name, { color: theme.text ?? theme.textLight }]}>{user?.displayName || user?.username}</Text>
        <Text style={{ color: theme.textLight }}>
          {user?.email || "No email on file"}
          {user?.email ? (user.emailVerified ? " (Verified)" : " (Unverified)") : ""}
        </Text>
        <Text style={{ color: theme.primary, fontWeight: "900" }}>{user?.isPro ? "Pro" : "Free"}</Text>
      </View>
      {user?.isPro && !user.email ? (
        <Text style={{ color: theme.destructive ?? theme.primary }}>
          Add and verify an email so you can recover this Pro account if you forget your password.
        </Text>
      ) : null}
      <AppLockToggle />
      <Link href="/(app)/account/edit" asChild>
        <Button>Edit Profile</Button>
      </Link>
      <Link href="/(app)/themes" asChild>
        <Button variant="secondary">Themes</Button>
      </Link>
      <Link href="/(app)/stats" asChild>
        <Button variant="secondary">Play Stats</Button>
      </Link>
      <Link href="/(app)/history" asChild>
        <Button variant="secondary">Game History</Button>
      </Link>
      <Link href="/(app)/pro" asChild>
        <Button variant="outline">{user?.isPro ? "Manage Pro" : "Upgrade to Pro"}</Button>
      </Link>
      <Link href="/(app)/account/password" asChild>
        <Button variant="outline">Change Password</Button>
      </Link>
      <Button variant="outline" onPress={() => void signOut()}>
        Sign out
      </Button>
      <Button variant="danger" onPress={() => setConfirmDelete(true)}>
        Delete Account
      </Button>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete account?"
        description="Are you sure you want to delete your account? This action cannot be undone."
        confirmLabel="Delete Account"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          void remove();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 18, gap: 6 },
  name: { fontSize: 24, fontWeight: "900" }
});
