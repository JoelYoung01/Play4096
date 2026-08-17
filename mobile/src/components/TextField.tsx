import { useThemeStore } from "@/stores/theme";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

export function TextField({ label, ...props }: TextInputProps & { label: string }) {
  const theme = useThemeStore((s) => s.theme);
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.textLight }]}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.textLight}
        {...props}
        style={[styles.input, { borderColor: theme.emptyTile, color: theme.text ?? theme.textLight }, props.style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: "800" },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, minHeight: 48, fontSize: 16 }
});
