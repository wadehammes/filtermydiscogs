import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { usePaintDeferredMount } from "src/hooks/usePaintDeferredMount.hook";
import { act, renderHook } from "test-utils";

describe("usePaintDeferredMount", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns false while not ready", () => {
    const { result } = renderHook(() => usePaintDeferredMount(false));

    expect(result.current).toBe(false);
  });

  it("defers mount until after the next paint when ready", () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    jest
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        rafCallbacks.push(callback);
        return rafCallbacks.length;
      });

    const { result, rerender } = renderHook(
      ({ ready }: { ready: boolean }) => usePaintDeferredMount(ready),
      { initialProps: { ready: false } },
    );

    expect(result.current).toBe(false);

    rerender({ ready: true });

    expect(result.current).toBe(false);

    act(() => {
      rafCallbacks.shift()?.(0);
      rafCallbacks.shift()?.(0);
    });
    expect(result.current).toBe(true);
  });

  it("mounts immediately when immediate option is set", () => {
    const { result } = renderHook(() =>
      usePaintDeferredMount(true, { immediate: true }),
    );

    expect(result.current).toBe(true);
  });

  it("keeps mounted after ready blips false when retainMountedWhenNotReady is set", () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    jest
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        rafCallbacks.push(callback);
        return rafCallbacks.length;
      });

    const { result, rerender } = renderHook(
      ({ ready }: { ready: boolean }) =>
        usePaintDeferredMount(ready, { retainMountedWhenNotReady: true }),
      { initialProps: { ready: true } },
    );

    act(() => {
      rafCallbacks.shift()?.(0);
      rafCallbacks.shift()?.(0);
    });
    expect(result.current).toBe(true);

    rerender({ ready: false });
    expect(result.current).toBe(true);
  });

  it("clears mounted after ready blips false by default", () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    jest
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        rafCallbacks.push(callback);
        return rafCallbacks.length;
      });

    const { result, rerender } = renderHook(
      ({ ready }: { ready: boolean }) => usePaintDeferredMount(ready),
      { initialProps: { ready: true } },
    );

    act(() => {
      rafCallbacks.shift()?.(0);
      rafCallbacks.shift()?.(0);
    });
    expect(result.current).toBe(true);

    rerender({ ready: false });
    expect(result.current).toBe(false);
  });
});
