import { directionFromSwipe } from "@/lib/swipe";
import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";

export function createBoardSwipe(onMove: (direction: number) => void, enabled = true) {
  // Pan callbacks are UI-thread worklets by default; this swipe only maps a
  // translation, so stay on JS. Calling directionFromSwipe from a worklet
  // aborts Hermes in release (TestFlight SIGABRT on swipe).
  return Gesture.Pan()
    .runOnJS(true)
    .enabled(enabled)
    .activeOffsetX([-16, 16])
    .activeOffsetY([-16, 16])
    .onEnd((event) => {
      const direction = directionFromSwipe(event.translationX, event.translationY);
      if (direction != null) onMove(direction);
    });
}

export function useBoardSwipe(onMove: (direction: number) => void, enabled = true) {
  return useMemo(() => createBoardSwipe(onMove, enabled), [enabled, onMove]);
}
