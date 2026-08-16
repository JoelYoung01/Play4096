import { getTileFontSize, TileAnimator } from "@/game/tileAnimator";

describe("getTileFontSize", () => {
  it("shrinks as the tile value gains digits", () => {
    const cell = 80;
    expect(getTileFontSize(2, cell)).toBeGreaterThan(getTileFontSize(128, cell));
    expect(getTileFontSize(128, cell)).toBeGreaterThan(getTileFontSize(1024, cell));
    expect(getTileFontSize(1024, cell)).toBeGreaterThan(getTileFontSize(16384, cell));
  });
});

describe("TileAnimator", () => {
  it("syncs occupied cells from a board", () => {
    const animator = new TileAnimator();
    animator.syncFromBoard([
      [2, 0, 0, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    expect(animator.tiles.map((tile) => ({ value: tile.value, x: tile.currentPos.x, y: tile.currentPos.y }))).toEqual([
      { value: 2, x: 0, y: 0 },
      { value: 4, x: 3, y: 0 }
    ]);
    animator.destroy();
  });

  it("slides a tile toward its target and pulses a merge", () => {
    const frames: number[] = [];
    const animator = new TileAnimator({ onFrame: () => frames.push(animator.tiles.length) });
    animator.syncFromBoard([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    animator.processEvents([
      { start: { x: 1, y: 0 }, end: { x: 0, y: 0 }, value: 2, merged: true },
      { end: { x: 3, y: 3 }, newTileValue: 2 }
    ]);
    expect(animator.isAnimating).toBe(true);
    const moving = animator.tiles.find((tile) => tile.merging || tile.targetPos.x !== tile.currentPos.x);
    expect(moving).toBeTruthy();
    animator.snapToTargets();
    const merged = animator.tiles.find((tile) => tile.currentPos.x === 0 && tile.currentPos.y === 0);
    expect(merged?.value === 4 || merged?.pendingMergeValue === 4 || merged).toBeTruthy();
    animator.destroy();
  });
});
