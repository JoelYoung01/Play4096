import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";
import { IconButton } from "./IconButton";

type GameControlsProps = {
  canUndo: boolean;
  undoCooldown?: number;
  isPro: boolean;
  isLoggedIn: boolean;
  hasCheckpoint: boolean;
  checkpointTile?: number | null;
  restoreBusy?: boolean;
  onNewGame: () => void;
  onUndo: () => void;
  onRotateCw: () => void;
  onRotateCcw: () => void;
  onMirrorH: () => void;
  onMirrorV: () => void;
  onRestoreCheckpoint: () => void;
};

export function GameControls({
  canUndo,
  undoCooldown = 0,
  isPro,
  isLoggedIn,
  hasCheckpoint,
  checkpointTile,
  restoreBusy,
  onNewGame,
  onUndo,
  onRotateCw,
  onRotateCcw,
  onMirrorH,
  onMirrorV,
  onRestoreCheckpoint
}: GameControlsProps) {
  return (
    <View style={styles.row}>
      <IconButton name="plus" label="New game" onPress={onNewGame} />
      <View style={styles.spacer} />
      {isPro ? (
        <IconButton
          name="checkpoint"
          label={hasCheckpoint ? "Go back to your biggest tile" : "No checkpoint available"}
          disabled={!hasCheckpoint || restoreBusy}
          badge={checkpointTile && !restoreBusy ? String(checkpointTile) : null}
          badgeTone="tile"
          onPress={onRestoreCheckpoint}
        />
      ) : (
        <Link href={isLoggedIn ? "/(app)/pro" : "/(auth)/login"} asChild>
          <IconButton name="checkpoint" label="Biggest-tile checkpoints (Pro)" badge="pro" badgeTone="pro" />
        </Link>
      )}
      <IconButton
        name="undo"
        label={canUndo ? "Undo last move" : undoCooldown > 0 ? `Undo available in ${undoCooldown} moves` : "Nothing to undo"}
        disabled={!canUndo}
        badge={undoCooldown > 0 ? undoCooldown : null}
        onPress={onUndo}
      />
      <IconButton name="rotateCw" label="Rotate clockwise" onPress={onRotateCw} />
      <IconButton name="rotateCcw" label="Rotate counter-clockwise" onPress={onRotateCcw} />
      <IconButton name="mirrorH" label="Mirror horizontally" onPress={onMirrorH} />
      <IconButton name="mirrorV" label="Mirror vertically" onPress={onMirrorV} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  spacer: { flex: 1 }
});
