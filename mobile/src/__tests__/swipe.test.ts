import { DIRECTIONS } from "@/game/constants";
import { directionFromSwipe } from "@/lib/swipe";

describe("directionFromSwipe", () => {
  it("maps a left swipe to a left tile move", () => {
    expect(directionFromSwipe(-80, 8)).toBe(DIRECTIONS.LEFT);
  });

  it("maps a right swipe to a right tile move", () => {
    expect(directionFromSwipe(80, -6)).toBe(DIRECTIONS.RIGHT);
  });

  it("maps vertical swipes", () => {
    expect(directionFromSwipe(4, -90)).toBe(DIRECTIONS.UP);
    expect(directionFromSwipe(-3, 90)).toBe(DIRECTIONS.DOWN);
  });

  it("ignores tiny movements", () => {
    expect(directionFromSwipe(-10, 4)).toBeNull();
  });
});
