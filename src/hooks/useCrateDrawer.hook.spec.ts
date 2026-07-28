import { beforeEach, describe, expect, it } from "@jest/globals";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
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
});
