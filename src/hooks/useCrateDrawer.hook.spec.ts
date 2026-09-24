import { beforeEach, describe, expect, it } from "@jest/globals";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { setupResponsiveDesktopMatchMedia } from "src/tests/mocks/setupResponsiveDesktopMatchMedia.mock";
import { act, renderHook } from "test-utils";
import { useCrateDrawer } from "./useCrateDrawer.hook";

describe("useCrateDrawer", () => {
  beforeEach(() => {
    setupMockMatchMedia();
  });

  it("defaults open on desktop", () => {
    setupMockMatchMedia({ desktop: true });

    const { result } = renderHook(() => useCrateDrawer());

    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isDrawerOpen).toBe(true);
  });

  it("defaults closed on mobile", () => {
    setupMockMatchMedia({ desktop: false });

    const { result } = renderHook(() => useCrateDrawer());

    expect(result.current.isDesktop).toBe(false);
    expect(result.current.isDrawerOpen).toBe(false);
  });

  it("resetDrawer restores viewport default after user toggle", () => {
    setupMockMatchMedia({ desktop: true });

    const { result } = renderHook(() => useCrateDrawer());

    act(() => {
      result.current.closeDrawer();
    });
    expect(result.current.isDrawerOpen).toBe(false);

    act(() => {
      result.current.resetDrawer();
    });
    expect(result.current.isDrawerOpen).toBe(true);
  });

  it("restores desktop default open after resize from mobile with drawer closed", () => {
    const media = setupResponsiveDesktopMatchMedia(false);
    const { result } = renderHook(() => useCrateDrawer());

    act(() => {
      result.current.closeDrawer();
    });
    expect(result.current.isDrawerOpen).toBe(false);

    act(() => {
      media.setDesktop(true);
    });

    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isDrawerOpen).toBe(true);
  });

  it("closes mobile drawer state after resize to desktop when drawer was open", () => {
    const media = setupResponsiveDesktopMatchMedia(false);
    const { result } = renderHook(() => useCrateDrawer());

    act(() => {
      result.current.openDrawer();
    });
    expect(result.current.isDrawerOpen).toBe(true);

    act(() => {
      media.setDesktop(true);
    });

    expect(result.current.isDrawerOpen).toBe(true);
  });
});
