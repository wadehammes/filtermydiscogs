import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { useMosaicVisibleTileIndices } from "src/hooks/useMosaicVisibleTileIndices.hook";
import { renderHook } from "test-utils";

describe("useMosaicVisibleTileIndices", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("derives visible tile indices from the scroll container", () => {
    const container = document.createElement("div");
    Object.defineProperty(container, "clientHeight", {
      configurable: true,
      value: 120,
    });
    Object.defineProperty(container, "scrollTop", {
      configurable: true,
      writable: true,
      value: 0,
    });

    globalThis.ResizeObserver = jest.fn(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
    })) as unknown as typeof ResizeObserver;

    const { result } = renderHook(() =>
      useMosaicVisibleTileIndices(container, {
        cols: 3,
        cellSize: 40,
        itemCount: 18,
        enabled: true,
      }),
    );

    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current.every((index) => index >= 0 && index < 18)).toBe(
      true,
    );
  });

  it("returns an empty list when disabled", () => {
    const { result } = renderHook(() =>
      useMosaicVisibleTileIndices(null, {
        cols: 3,
        cellSize: 40,
        itemCount: 18,
        enabled: false,
      }),
    );

    expect(result.current).toEqual([]);
  });
});
