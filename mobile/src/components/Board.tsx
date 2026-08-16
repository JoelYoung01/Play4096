import { getTileBackground, getTileColor } from "@/game/Game";
import { BOARD_BORDER_RADIUS, BOARD_GAP, BOARD_PADDING, DEFAULT_BOARD_SIZE, TILE_BORDER_RADIUS } from "@/game/constants";
import { getTileFontSize } from "@/game/tileAnimator";
import { useThemeStore } from "@/stores/theme";
import type { VisualTile } from "@/types";
import { memo } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

type BoardProps = {
  board: number[][];
  tiles?: VisualTile[];
  compact?: boolean;
};

export const Board = memo(function Board({ board, tiles, compact = false }: BoardProps) {
  const theme = useThemeStore((s) => s.theme);
  const { width } = useWindowDimensions();
  const boardSize = board.length || DEFAULT_BOARD_SIZE;
  const maxWidth = compact ? Math.min(width - 80, 220) : Math.min(width - 40, 420);
  const size = maxWidth;
  const cell = (size - BOARD_PADDING * 2 - BOARD_GAP * (boardSize - 1)) / boardSize;
  const offset = cell + BOARD_GAP;
  const visualTiles = tiles ?? tilesFromBoard(board);

  return (
    <View
      style={[
        styles.board,
        {
          width: size,
          height: size,
          padding: BOARD_PADDING,
          backgroundColor: theme.boardBackground,
          borderRadius: BOARD_BORDER_RADIUS
        }
      ]}
    >
      {Array.from({ length: boardSize * boardSize }, (_, index) => (
        <View
          key={index}
          style={[
            styles.empty,
            {
              width: cell,
              height: cell,
              left: BOARD_PADDING + (index % boardSize) * offset,
              top: BOARD_PADDING + Math.floor(index / boardSize) * offset,
              backgroundColor: theme.emptyTile,
              borderRadius: TILE_BORDER_RADIUS
            }
          ]}
        />
      ))}
      {visualTiles.map((tile) => (
        <View
          key={tile.id}
          style={[
            styles.tile,
            {
              width: cell,
              height: cell,
              left: BOARD_PADDING + tile.currentPos.x * offset,
              top: BOARD_PADDING + tile.currentPos.y * offset,
              backgroundColor: getTileBackground(tile.value, theme),
              borderRadius: TILE_BORDER_RADIUS,
              opacity: tile.alpha,
              transform: [{ scale: tile.scale }]
            }
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.tileText,
              {
                color: getTileColor(tile.value, theme),
                fontSize: getTileFontSize(tile.value, cell)
              }
            ]}
          >
            {tile.value}
          </Text>
        </View>
      ))}
    </View>
  );
});

function tilesFromBoard(board: number[][]): VisualTile[] {
  const tiles: VisualTile[] = [];
  for (let y = 0; y < board.length; y += 1) {
    for (let x = 0; x < board[y].length; x += 1) {
      const value = board[y][x];
      if (!value) continue;
      tiles.push({
        id: `${y}-${x}-${value}`,
        value,
        logicalPos: { x, y },
        currentPos: { x, y },
        targetPos: { x, y },
        alpha: 1,
        scale: 1,
        spawning: false,
        merging: false,
        mergePop: false,
        mergePopProgress: 0,
        mergeSurvivorId: null,
        pendingMergeValue: null,
        hidden: false
      });
    }
  }
  return tiles;
}

const styles = StyleSheet.create({
  board: { alignSelf: "center", position: "relative" },
  empty: { position: "absolute" },
  tile: { position: "absolute", alignItems: "center", justifyContent: "center" },
  tileText: { fontWeight: "800", textAlign: "center" }
});
