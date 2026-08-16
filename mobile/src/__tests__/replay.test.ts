import { DIRECTIONS } from "@/game/constants";
import { Game } from "@/game/Game";

describe("replay from seed", () => {
  it("replays recorded slides onto the same board and score", () => {
    const live = new Game({ seed: 12345 });
    const moves: number[] = [];
    for (const direction of [DIRECTIONS.LEFT, DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.UP, DIRECTIONS.RIGHT]) {
      const events = live.moveTiles(direction);
      if (events.length) moves.push(direction);
    }

    expect(moves.length).toBeGreaterThan(0);

    const replay = new Game({ seed: 12345 });
    for (const action of moves) {
      const events = replay.applyRecordedAction(action);
      expect(events.length).toBeGreaterThan(0);
    }

    expect(replay.board).toEqual(live.board);
    expect(replay.score).toBe(live.score);
    expect(replay.moveCount).toBe(live.moveCount);
  });
});
