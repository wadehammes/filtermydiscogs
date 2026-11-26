import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  BOTTOM_DRAWER_DISMISS_EVENT,
  dismissOpenBottomDrawers,
} from "src/constants/bottomDrawerDismiss";
import { useListenBottomDrawerDismiss } from "src/hooks/useListenBottomDrawerDismiss.hook";
import { act, renderHookWithTestProviders as renderHook } from "test-utils";

describe("useListenBottomDrawerDismiss", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls onDismiss when dismissOpenBottomDrawers runs", () => {
    const onDismiss = jest.fn();

    renderHook(() => useListenBottomDrawerDismiss(onDismiss));

    act(() => {
      dismissOpenBottomDrawers();
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("stops listening after unmount", () => {
    const onDismiss = jest.fn();

    const { unmount } = renderHook(() =>
      useListenBottomDrawerDismiss(onDismiss),
    );

    unmount();

    act(() => {
      window.dispatchEvent(new CustomEvent(BOTTOM_DRAWER_DISMISS_EVENT));
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
