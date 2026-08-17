import { Game } from "@/game/Game";
import { TileAnimator } from "@/game/tileAnimator";
import type { GameEvent, VisualTile } from "@/types";
import { useEffect, useState } from "react";

export function useAnimatedBoard(game: Game | null) {
  const [tiles, setTiles] = useState<VisualTile[]>([]);
  const [idle, setIdle] = useState(true);
  const [trackedGame, setTrackedGame] = useState(game);
  const [animator] = useState(() => {
    const created: TileAnimator = new TileAnimator({
      onAnimatingChange: (animating) => setIdle(!animating),
      onFrame: () => setTiles([...created.tiles])
    });
    return created;
  });

  if (game && game !== trackedGame) {
    animator.syncFromBoard(game.board);
    setTrackedGame(game);
    setTiles([...animator.tiles]);
  }

  useEffect(() => () => animator.destroy(), [animator]);

  const playEvents = (events: GameEvent[]) => {
    animator.processEvents(events);
    setTiles([...animator.tiles]);
  };

  const syncBoard = () => {
    if (!game) return;
    animator.syncFromBoard(game.board);
    setTiles([...animator.tiles]);
  };

  return { tiles, idle, playEvents, syncBoard };
}
