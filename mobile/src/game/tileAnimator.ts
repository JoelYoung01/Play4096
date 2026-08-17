import type { GameEvent, VisualTile } from "@/types";
import { SPAWN_START_SCALE, TILE_MERGE_DURATION, TILE_MOVE_DURATION_MS, TILE_SPAWN_DURATION } from "./constants";

let nextTileId = 0;
const createTileId = () => {
  nextTileId += 1;
  return `tile-${nextTileId}`;
};
const posKey = (x: number, y: number) => `${x},${y}`;

type AnimatorOptions = {
  onAnimatingChange?: (animating: boolean) => void;
  onFrame?: () => void;
  speed?: number;
};

export class TileAnimator {
  tiles: VisualTile[] = [];
  isAnimating = false;
  #onAnimatingChange?: (animating: boolean) => void;
  #onFrame?: () => void;
  #logicalMap = new Map<string, string>();
  #animationFrame: number | null = null;
  #lastTimestamp = 0;
  #speed = 1;

  constructor(options: AnimatorOptions = {}) {
    this.#onAnimatingChange = options.onAnimatingChange;
    this.#onFrame = options.onFrame;
    if (options.speed != null) this.#speed = Math.max(0.25, options.speed);
  }

  setSpeed(speed: number) {
    this.#speed = Math.max(0.25, speed);
  }

  #setAnimating(value: boolean) {
    this.isAnimating = value;
    this.#onAnimatingChange?.(value);
  }

  syncFromBoard(board: number[][]) {
    this.#stopAnimation();
    this.tiles = [];
    this.#logicalMap.clear();
    for (let y = 0; y < board.length; y += 1) {
      for (let x = 0; x < board[y].length; x += 1) {
        const value = board[y][x];
        if (value !== 0) this.#createTile(x, y, value);
      }
    }
    this.#onFrame?.();
  }

  snapToTargets() {
    for (const tile of this.tiles) {
      tile.currentPos.x = tile.targetPos.x;
      tile.currentPos.y = tile.targetPos.y;
      tile.alpha = 1;
      tile.scale = 1;
      tile.spawning = false;
      tile.mergePop = false;
      tile.mergePopProgress = 0;
    }
  }

  processEvent(event: GameEvent) {
    if (event.resync && event.snapshot) {
      this.syncFromBoard(event.snapshot);
    } else if (event.start && event.end && typeof event.start === "object" && typeof event.end === "object") {
      this.#processMove(event);
      this.#ensureAnimationRunning();
    } else if (event.end && typeof event.end === "object" && event.newTileValue !== undefined) {
      this.#processSpawn(event);
      this.#ensureAnimationRunning();
    }
  }

  processEvents(events: GameEvent[]) {
    for (const event of events) this.processEvent(event);
    this.#ensureAnimationRunning();
  }

  #createTile(x: number, y: number, value: number) {
    const id = createTileId();
    const position = { x, y };
    const tile: VisualTile = {
      id,
      value,
      logicalPos: { ...position },
      currentPos: { ...position },
      targetPos: { ...position },
      alpha: 1,
      scale: 1,
      spawning: false,
      merging: false,
      mergePop: false,
      mergePopProgress: 0,
      mergeSurvivorId: null,
      pendingMergeValue: null,
      hidden: false
    };
    this.tiles.push(tile);
    this.#logicalMap.set(posKey(x, y), id);
    return tile;
  }

  #getTileAt(x: number, y: number) {
    const id = this.#logicalMap.get(posKey(x, y));
    if (id) return this.tiles.find((tile) => tile.id === id && !tile.hidden && !tile.merging);
    return this.tiles.find((tile) => !tile.hidden && !tile.merging && tile.logicalPos.x === x && tile.logicalPos.y === y);
  }

  #applyMove(tile: VisualTile, end: { x: number; y: number }, value: number) {
    this.#logicalMap.delete(posKey(tile.logicalPos.x, tile.logicalPos.y));
    tile.logicalPos = { x: end.x, y: end.y };
    tile.targetPos = { x: end.x, y: end.y };
    tile.value = value;
    this.#logicalMap.set(posKey(end.x, end.y), tile.id);
  }

  #processMove(event: GameEvent) {
    const start = event.start;
    const end = event.end;
    if (!start || !end || typeof start !== "object" || typeof end !== "object") return;
    const movingTile = this.#getTileAt(start.x, start.y);
    if (!movingTile) return;

    if (event.merged) {
      const survivor = this.#getTileAt(end.x, end.y);
      if (survivor && survivor.id !== movingTile.id) {
        this.#logicalMap.delete(posKey(start.x, start.y));
        movingTile.merging = true;
        movingTile.mergeSurvivorId = survivor.id;
        movingTile.targetPos = { x: end.x, y: end.y };
        survivor.targetPos = { x: end.x, y: end.y };
        survivor.pendingMergeValue = Number(event.value ?? 0) * 2;
        survivor.logicalPos = { x: end.x, y: end.y };
        this.#logicalMap.set(posKey(end.x, end.y), survivor.id);
        return;
      }
      this.#applyMove(movingTile, end, Number(event.value ?? 0) * 2);
      return;
    }

    this.#applyMove(movingTile, end, Number(event.value ?? movingTile.value));
  }

  #processSpawn(event: GameEvent) {
    const end = event.end;
    if (!end || typeof end !== "object" || event.newTileValue === undefined) return;
    const tile = this.#createTile(end.x, end.y, event.newTileValue);
    tile.spawning = true;
    tile.alpha = 0;
    tile.scale = SPAWN_START_SCALE;
  }

  #ensureAnimationRunning() {
    this.#setAnimating(true);
    if (this.#animationFrame !== null) return;
    this.#lastTimestamp = globalThis.performance?.now?.() ?? Date.now();
    this.#animationFrame = requestAnimationFrame(this.#animate);
  }

  #stopAnimation() {
    if (this.#animationFrame !== null) {
      cancelAnimationFrame(this.#animationFrame);
      this.#animationFrame = null;
    }
    this.#setAnimating(false);
  }

  #animate = (timestamp: number) => {
    const rawDt = Math.min(timestamp - this.#lastTimestamp, 32);
    this.#lastTimestamp = timestamp;
    const dt = rawDt * this.#speed;
    let allComplete = true;

    for (const tile of this.tiles) {
      if (tile.hidden) continue;

      if (tile.spawning) {
        const nextAlpha = Math.min(1, tile.alpha + dt / TILE_SPAWN_DURATION);
        tile.alpha = nextAlpha;
        tile.scale = SPAWN_START_SCALE + (1 - SPAWN_START_SCALE) * nextAlpha;
        if (nextAlpha < 1) allComplete = false;
        else {
          tile.spawning = false;
          tile.scale = 1;
        }
      }

      if (tile.mergePop) {
        tile.mergePopProgress += dt / TILE_MERGE_DURATION;
        if (tile.mergePopProgress >= 1) {
          tile.mergePop = false;
          tile.mergePopProgress = 0;
          tile.scale = 1;
        } else {
          allComplete = false;
          const progress = tile.mergePopProgress;
          const bump = progress < 0.5 ? progress * 2 : 2 - progress * 2;
          tile.scale = 1 + bump * 0.12;
        }
      }

      const dx = tile.targetPos.x - tile.currentPos.x;
      const dy = tile.targetPos.y - tile.currentPos.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0.001) {
        allComplete = false;
        const step = dt / TILE_MOVE_DURATION_MS;
        if (step >= distance) {
          tile.currentPos.x = tile.targetPos.x;
          tile.currentPos.y = tile.targetPos.y;
        } else {
          tile.currentPos.x += (dx / distance) * step;
          tile.currentPos.y += (dy / distance) * step;
        }
      } else {
        tile.currentPos.x = tile.targetPos.x;
        tile.currentPos.y = tile.targetPos.y;
      }

      if (tile.merging && distance <= 0.001) {
        tile.hidden = true;
        if (tile.mergeSurvivorId) {
          const survivor = this.tiles.find((entry) => entry.id === tile.mergeSurvivorId);
          if (survivor && survivor.pendingMergeValue !== null) {
            survivor.value = survivor.pendingMergeValue;
            survivor.pendingMergeValue = null;
            survivor.mergePop = true;
            survivor.mergePopProgress = 0;
          }
        }
      }
    }

    this.tiles = this.tiles.filter((tile) => !tile.hidden);
    this.#onFrame?.();

    if (!allComplete) {
      this.#animationFrame = requestAnimationFrame(this.#animate);
      return;
    }

    this.snapToTargets();
    this.#animationFrame = null;
    this.#setAnimating(false);
    this.#onFrame?.();
  };

  destroy() {
    this.#stopAnimation();
  }
}

export function getTileFontSize(value: number, cellSize: number) {
  const digits = String(value).length;
  const baseSize = cellSize * 0.42;
  return Math.max(baseSize - (digits - 1) * (cellSize * 0.07), cellSize * 0.2);
}
