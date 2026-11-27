import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { useMosaicGridIdleMount } from "src/hooks/useMosaicGridIdleMount.hook";
import { act, renderHook } from "test-utils";

describe("useMosaicGridIdleMount", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns false while the mosaic page is not ready", () => {
    const { result } = renderHook(() => useMosaicGridIdleMount(false));

    expect(result.current).toBe(false);
  });

  it("defers the first grid mount until after the next paint when ready", () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    jest
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        rafCallbacks.push(callback);
        return rafCallbacks.length;
      });

    const { result, rerender } = renderHook(
      ({ ready }: { ready: boolean }) => useMosaicGridIdleMount(ready),
      { initialProps: { ready: false } },
    );

    expect(result.current).toBe(false);

    rerender({ ready: true });

    expect(result.current).toBe(false);
    expect(rafCallbacks).toHaveLength(1);

    act(() => {
      rafCallbacks.shift()?.(0);
    });
    expect(result.current).toBe(false);
    expect(rafCallbacks).toHaveLength(1);

    act(() => {
      rafCallbacks.shift()?.(0);
    });
    expect(result.current).toBe(true);
  });

  it("mounts the grid immediately on later ready passes after the first defer", () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    jest
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        rafCallbacks.push(callback);
        return rafCallbacks.length;
      });

    const { result, rerender } = renderHook(
      ({ ready }: { ready: boolean }) => useMosaicGridIdleMount(ready),
      { initialProps: { ready: true } },
    );

    act(() => {
      rafCallbacks.shift()?.(0);
      rafCallbacks.shift()?.(0);
    });
    expect(result.current).toBe(true);

    rerender({ ready: false });
    expect(result.current).toBe(false);

    rerender({ ready: true });
    expect(result.current).toBe(true);
  });
});
