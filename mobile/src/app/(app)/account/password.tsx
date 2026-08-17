import { changePassword } from "@/api/account";
import { getErrorMessage } from "@/api/errors";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pending, setPending] = useState(false);

  const save = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Missing details", "Enter your current and new password.");
      return;
    }
    setPending(true);
    try {
      await changePassword({ currentPassword, newPassword });
      Alert.alert("Password updated", "Your password has been changed.");
      router.back();
    } catch (err) {
      Alert.alert("Could not update password", getErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Screen title="Change Password">
      <TextField label="Current Password" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
      <TextField label="New Password" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
      <Button disabled={pending} onPress={() => void save()}>
        {pending ? "Updating…" : "Update Password"}
      </Button>
      <Button variant="outline" onPress={() => router.back()}>
        Cancel
      </Button>
    </Screen>
  );
}
