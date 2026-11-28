import { beforeEach, describe, expect, it } from "@jest/globals";
import { usePlaybackMobileVideoPanelViewportInset } from "src/hooks/usePlaybackMobileVideoPanelViewportInset.hook";
import { act, renderHook } from "test-utils";

type ViewportListener = () => void;

const createVisualViewportMock = (initial: {
  height: number;
  offsetTop: number;
}) => {
  const listeners = new Map<string, Set<ViewportListener>>();
  let height = initial.height;
  let offsetTop = initial.offsetTop;

  return {
    get height() {
      return height;
    },
    get offsetTop() {
      return offsetTop;
    },
    setMetrics: (next: { height: number; offsetTop: number }) => {
      height = next.height;
      offsetTop = next.offsetTop;
    },
    addEventListener: (event: string, listener: ViewportListener) => {
      const set = listeners.get(event) ?? new Set();
      set.add(listener);
      listeners.set(event, set);
    },
    removeEventListener: (event: string, listener: ViewportListener) => {
      listeners.get(event)?.delete(listener);
    },
    emit: (event: string) => {
      listeners.get(event)?.forEach((listener) => {
        listener();
      });
    },
  };
};

describe("usePlaybackMobileVideoPanelViewportInset", () => {
  let visualViewportMock: ReturnType<typeof createVisualViewportMock>;

  beforeEach(() => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    visualViewportMock = createVisualViewportMock({
      height: 800,
      offsetTop: 0,
    });
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: visualViewportMock,
    });
  });

  it("when disabled, returns 0 and does not react to viewport events", () => {
    const { result } = renderHook(() =>
      usePlaybackMobileVideoPanelViewportInset(false),
    );

    visualViewportMock.setMetrics({ height: 500, offsetTop: 100 });
    act(() => {
      visualViewportMock.emit("resize");
    });

    expect(result.current).toBe(0);
  });

  it("when enabled, updates after visualViewport resize", () => {
    const { result } = renderHook(() =>
      usePlaybackMobileVideoPanelViewportInset(true),
    );

    expect(result.current).toBe(0);

    visualViewportMock.setMetrics({ height: 500, offsetTop: 100 });
    act(() => {
      visualViewportMock.emit("resize");
    });

    expect(result.current).toBe(200);
  });
});
