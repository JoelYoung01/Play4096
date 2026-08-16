import { DIRECTIONS } from "@/game/constants";

export function directionFromSwipe(dx: number, dy: number, threshold = 24) {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (Math.max(ax, ay) < threshold) return null;
  if (ax > ay) return dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
  return dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
}
