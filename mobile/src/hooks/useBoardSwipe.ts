import { directionFromSwipe } from "@/lib/swipe";
import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

export function useBoardSwipe(onMove: (direction: number) => void, enabled = true) {
  return useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .activeOffsetX([-16, 16])
        .activeOffsetY([-16, 16])
        .onEnd((event) => {
          const direction = directionFromSwipe(event.translationX, event.translationY);
          if (direction != null) runOnJS(onMove)(direction);
        }),
    [enabled, onMove]
  );
}
