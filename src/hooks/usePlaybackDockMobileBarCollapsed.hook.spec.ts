import { describe, expect, it } from "@jest/globals";
import { usePlaybackDockMobileBarCollapsed } from "src/hooks/usePlaybackDockMobileBarCollapsed.hook";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { act, renderHookWithTestProviders } from "test-utils";

describe("usePlaybackDockMobileBarCollapsed", () => {
  it("when the dock bar is collapsed on mobile, reports collapsed", () => {
    setupMockMatchMedia({ viewportWidthPx: 390 });

    const { result } = renderHookWithTestProviders(() =>
      usePlaybackDockMobileBarCollapsed({ isMiniPlayerVisible: true }),
    );

    act(() => {
      result.current.collapseDockBar();
    });

    expect(result.current.isDockBarCollapsed).toBe(true);
  });

  it("when the viewport is at desktop width, ignores the collapsed atom", () => {
    setupMockMatchMedia({ desktop: true });

    const { result } = renderHookWithTestProviders(() =>
      usePlaybackDockMobileBarCollapsed({ isMiniPlayerVisible: true }),
    );

    act(() => {
      result.current.collapseDockBar();
    });

    expect(result.current.isDockBarCollapsed).toBe(false);
  });

  it("when the viewport crosses to desktop width, clears a mobile collapse", () => {
    setupMockMatchMedia({ viewportWidthPx: 390 });

    const { result, rerender } = renderHookWithTestProviders(
      (props: { isMiniPlayerVisible: boolean }) =>
        usePlaybackDockMobileBarCollapsed({
          isMiniPlayerVisible: props.isMiniPlayerVisible,
        }),
      { initialProps: { isMiniPlayerVisible: true } },
    );

    act(() => {
      result.current.collapseDockBar();
    });

    expect(result.current.isDockBarCollapsed).toBe(true);

    setupMockMatchMedia({ desktop: true });
    rerender({ isMiniPlayerVisible: true });

    expect(result.current.isDockBarCollapsed).toBe(false);
  });

  it("when the mini player hides, clears the collapsed atom", () => {
    setupMockMatchMedia({ viewportWidthPx: 390 });

    const { result, rerender } = renderHookWithTestProviders(
      (props: { isMiniPlayerVisible: boolean }) =>
        usePlaybackDockMobileBarCollapsed({
          isMiniPlayerVisible: props.isMiniPlayerVisible,
        }),
      { initialProps: { isMiniPlayerVisible: true } },
    );

    act(() => {
      result.current.collapseDockBar();
    });

    expect(result.current.isDockBarCollapsed).toBe(true);

    rerender({ isMiniPlayerVisible: false });

    expect(result.current.isDockBarCollapsed).toBe(false);
  });

  it("when expandDockBar runs on mobile, shows the dock bar again", () => {
    setupMockMatchMedia({ viewportWidthPx: 390 });

    const { result } = renderHookWithTestProviders(() =>
      usePlaybackDockMobileBarCollapsed({ isMiniPlayerVisible: true }),
    );

    act(() => {
      result.current.collapseDockBar();
    });

    expect(result.current.isDockBarCollapsed).toBe(true);

    act(() => {
      result.current.expandDockBar();
    });

    expect(result.current.isDockBarCollapsed).toBe(false);
  });
});
