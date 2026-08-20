import { DIRECTIONS } from "@/game/constants";

/** Matches the web app `createSwipeHandlers` default in `src/lib/swipe.js`. */
export const SWIPE_THRESHOLD = 5;

export function directionFromSwipe(dx: number, dy: number, threshold = SWIPE_THRESHOLD) {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (Math.max(ax, ay) < threshold) return null;
  if (ax > ay) return dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
  return dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
}
