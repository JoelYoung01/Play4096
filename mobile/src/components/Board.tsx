import { getTileBackground, getTileColor } from "@/game/Game";
import { useThemeStore } from "@/stores/theme";
import { memo } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

type BoardProps = { board: number[][] };

export const Board = memo(function Board({ board }: BoardProps) {
  const theme = useThemeStore((s) => s.theme);
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 40, 360);
  const gap = 8;
  const cell = (boardSize - gap * 5) / 4;
  return (
    <View style={[styles.board, { width: boardSize, height: boardSize, padding: gap, gap, backgroundColor: theme.boardBackground }]}>
      {board.map((row, r) => (
        <View key={r} style={[styles.row, { gap }]}>
          {row.map((value, c) => {
            const filled = value > 0;
            return (
              <View key={`${r}-${c}`} style={[styles.tile, { width: cell, height: cell, backgroundColor: filled ? getTileBackground(value, theme) : theme.emptyTile }]}>
                {filled ? <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.tileText, { color: getTileColor(value, theme), fontSize: value >= 10000 ? 18 : value >= 1000 ? 22 : 28 }]}>{value}</Text> : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
});
const styles = StyleSheet.create({ board: { alignSelf: "center", borderRadius: 18 }, row: { flexDirection: "row", flex: 1 }, tile: { borderRadius: 12, alignItems: "center", justifyContent: "center" }, tileText: { fontWeight: "900" } });
