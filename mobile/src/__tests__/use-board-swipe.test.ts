import { DIRECTIONS } from "@/game/constants";
import { createBoardSwipe } from "@/hooks/useBoardSwipe";

type EndHandler = (event: { translationX: number; translationY: number }) => void;

jest.mock("react-native-gesture-handler", () => {
  const runOnJS = jest.fn().mockReturnThis();
  const onEndHandlers: EndHandler[] = [];
  const chain = {
    runOnJS,
    enabled: jest.fn().mockReturnThis(),
    activeOffsetX: jest.fn().mockReturnThis(),
    activeOffsetY: jest.fn().mockReturnThis(),
    onEnd: jest.fn((handler: EndHandler) => {
      onEndHandlers.push(handler);
      return chain;
    })
  };
  return {
    Gesture: {
      Pan: () => chain
    },
    __swipeMocks: { runOnJS, onEndHandlers, activeOffsetX: chain.activeOffsetX, activeOffsetY: chain.activeOffsetY }
  };
});

const { __swipeMocks: swipeMocks } = jest.requireMock("react-native-gesture-handler") as {
  __swipeMocks: {
    runOnJS: jest.Mock;
    onEndHandlers: EndHandler[];
    activeOffsetX: jest.Mock;
    activeOffsetY: jest.Mock;
  };
};

describe("createBoardSwipe", () => {
  beforeEach(() => {
    swipeMocks.onEndHandlers.length = 0;
    swipeMocks.runOnJS.mockClear();
  });

  it("runs pan callbacks on the JS thread", () => {
    createBoardSwipe(jest.fn());
    expect(swipeMocks.runOnJS).toHaveBeenCalledWith(true);
  });

  it("maps a completed swipe to a board direction without a UI-thread worklet", () => {
    const onMove = jest.fn();
    createBoardSwipe(onMove);

    expect(swipeMocks.onEndHandlers).toHaveLength(1);
    swipeMocks.onEndHandlers[0]({ translationX: -80, translationY: 8 });
    expect(onMove).toHaveBeenCalledWith(DIRECTIONS.LEFT);
  });

  it("activates the pan at the web swipe threshold", () => {
    createBoardSwipe(jest.fn());
    expect(swipeMocks.activeOffsetX).toHaveBeenCalledWith([-5, 5]);
    expect(swipeMocks.activeOffsetY).toHaveBeenCalledWith([-5, 5]);
  });

  it("maps a short swipe that meets the web threshold", () => {
    const onMove = jest.fn();
    createBoardSwipe(onMove);
    swipeMocks.onEndHandlers[0]({ translationX: -6, translationY: 2 });
    expect(onMove).toHaveBeenCalledWith(DIRECTIONS.LEFT);
  });

  it("ignores tiny movements", () => {
    const onMove = jest.fn();
    createBoardSwipe(onMove);
    swipeMocks.onEndHandlers[0]({ translationX: -4, translationY: 3 });
    expect(onMove).not.toHaveBeenCalled();
  });
});
