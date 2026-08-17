import { useThemeStore } from "@/stores/theme";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const theme = useThemeStore((s) => s.theme);
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={[styles.card, { backgroundColor: theme.background, borderColor: theme.border ?? theme.emptyTile }]} onPress={() => undefined}>
          <Text style={[styles.title, { color: theme.text ?? theme.textLight }]}>{title}</Text>
          <Text style={[styles.body, { color: theme.textLight }]}>{description}</Text>
          <View style={styles.actions}>
            <Button variant="outline" style={styles.action} onPress={onCancel}>
              {cancelLabel}
            </Button>
            <Button style={styles.action} onPress={onConfirm}>
              {confirmLabel}
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: 24 },
  card: { borderRadius: 16, padding: 22, gap: 12, borderWidth: 1 },
  title: { fontSize: 20, fontWeight: "800" },
  body: { fontSize: 15, lineHeight: 21 },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  action: { flex: 1 }
});
