import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { useCloseMobileDrawerOnDesktop } from "src/hooks/useCloseMobileDrawerOnDesktop.hook";
import { setupResponsiveDesktopMatchMedia } from "src/tests/mocks/setupResponsiveDesktopMatchMedia.mock";
import { act, renderHook } from "test-utils";

describe("useCloseMobileDrawerOnDesktop", () => {
  beforeEach(() => {
    setupResponsiveDesktopMatchMedia(true);
  });

  it("calls onClose when the viewport crosses to desktop", () => {
    const media = setupResponsiveDesktopMatchMedia(false);
    const onClose = jest.fn();

    renderHook(() => useCloseMobileDrawerOnDesktop(onClose));

    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      media.setDesktop(true);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on mount when already desktop", () => {
    setupResponsiveDesktopMatchMedia(true);
    const onClose = jest.fn();

    renderHook(() => useCloseMobileDrawerOnDesktop(onClose));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when staying on mobile", () => {
    setupResponsiveDesktopMatchMedia(false);
    const onClose = jest.fn();

    renderHook(() => useCloseMobileDrawerOnDesktop(onClose));

    expect(onClose).not.toHaveBeenCalled();
  });
});
