import { beforeEach, describe, expect, it } from "@jest/globals";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import type { ReactNode } from "react";
import { PLAYBACK_DOCK_BAR_COLLAPSED_STORAGE_KEY } from "src/constants/storageKeys";
import { usePlaybackDockMobileBarCollapsed } from "src/hooks/usePlaybackDockMobileBarCollapsed.hook";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { act, renderHookWithTestProviders } from "test-utils";

let pathnameContextValue = "/collection";

const PathnameTestWrapper = ({ children }: { children: ReactNode }) => (
  <PathnameContext.Provider value={pathnameContextValue}>
    {children}
  </PathnameContext.Provider>
);

describe("usePlaybackDockMobileBarCollapsed", () => {
  beforeEach(() => {
    localStorage.removeItem(PLAYBACK_DOCK_BAR_COLLAPSED_STORAGE_KEY);
  });

  it("when the dock bar is collapsed on mobile, reports collapsed", () => {
    pathnameContextValue = "/collection";
    setupMockMatchMedia({ viewportWidthPx: 390 });

    const { result } = renderHookWithTestProviders(
      () => usePlaybackDockMobileBarCollapsed({ isMiniPlayerVisible: true }),
      { wrapper: PathnameTestWrapper },
    );

    act(() => {
      result.current.collapseDockBar();
    });

    expect(result.current.isDockBarCollapsed).toBe(true);
  });

  it("when the viewport is at desktop width, ignores the collapsed atom", () => {
    pathnameContextValue = "/collection";
    setupMockMatchMedia({ desktop: true });

    const { result } = renderHookWithTestProviders(
      () => usePlaybackDockMobileBarCollapsed({ isMiniPlayerVisible: true }),
      { wrapper: PathnameTestWrapper },
    );

    act(() => {
      result.current.collapseDockBar();
    });

    expect(result.current.isDockBarCollapsed).toBe(false);
  });

  it("when the viewport crosses to desktop width, clears a mobile collapse", () => {
    pathnameContextValue = "/collection";
    setupMockMatchMedia({ viewportWidthPx: 390 });

    const { result, rerender } = renderHookWithTestProviders(
      (props: { isMiniPlayerVisible: boolean }) =>
        usePlaybackDockMobileBarCollapsed({
          isMiniPlayerVisible: props.isMiniPlayerVisible,
        }),
      {
        initialProps: { isMiniPlayerVisible: true },
        wrapper: PathnameTestWrapper,
      },
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
    pathnameContextValue = "/collection";
    setupMockMatchMedia({ viewportWidthPx: 390 });

    const { result, rerender } = renderHookWithTestProviders(
      (props: { isMiniPlayerVisible: boolean }) =>
        usePlaybackDockMobileBarCollapsed({
          isMiniPlayerVisible: props.isMiniPlayerVisible,
        }),
      {
        initialProps: { isMiniPlayerVisible: true },
        wrapper: PathnameTestWrapper,
      },
    );

    act(() => {
      result.current.collapseDockBar();
    });

    expect(result.current.isDockBarCollapsed).toBe(true);

    rerender({ isMiniPlayerVisible: false });

    expect(result.current.isDockBarCollapsed).toBe(false);
  });

  it("when playback is active on admin at desktop width, collapses the dock bar", () => {
    pathnameContextValue = "/admin";
    setupMockMatchMedia({ desktop: true });

    const { result } = renderHookWithTestProviders(
      () => usePlaybackDockMobileBarCollapsed({ isMiniPlayerVisible: true }),
      { wrapper: PathnameTestWrapper },
    );

    expect(result.current.isDockBarCollapsed).toBe(true);
  });

  it("when the dock bar is collapsed on mobile, persists in localStorage", () => {
    pathnameContextValue = "/collection";
    setupMockMatchMedia({ viewportWidthPx: 390 });

    const { result } = renderHookWithTestProviders(
      () => usePlaybackDockMobileBarCollapsed({ isMiniPlayerVisible: true }),
      { wrapper: PathnameTestWrapper },
    );

    act(() => {
      result.current.collapseDockBar();
    });

    expect(localStorage.getItem(PLAYBACK_DOCK_BAR_COLLAPSED_STORAGE_KEY)).toBe(
      "true",
    );
  });

  it("when leaving admin keeps the bar collapsed until expandDockBar", () => {
    pathnameContextValue = "/admin";
    setupMockMatchMedia({ viewportWidthPx: 390 });

    const { result, rerender } = renderHookWithTestProviders(
      (props: { isMiniPlayerVisible: boolean }) =>
        usePlaybackDockMobileBarCollapsed({
          isMiniPlayerVisible: props.isMiniPlayerVisible,
        }),
      {
        initialProps: { isMiniPlayerVisible: true },
        wrapper: PathnameTestWrapper,
      },
    );

    expect(result.current.isDockBarCollapsed).toBe(true);

    pathnameContextValue = "/collection";
    rerender({ isMiniPlayerVisible: true });

    expect(result.current.isDockBarCollapsed).toBe(true);

    act(() => {
      result.current.expandDockBar();
    });

    expect(result.current.isDockBarCollapsed).toBe(false);
  });

  it("when expandDockBar runs on admin, shows the dock bar again", () => {
    pathnameContextValue = "/admin";
    setupMockMatchMedia({ desktop: true });

    const { result } = renderHookWithTestProviders(
      () => usePlaybackDockMobileBarCollapsed({ isMiniPlayerVisible: true }),
      { wrapper: PathnameTestWrapper },
    );

    act(() => {
      result.current.expandDockBar();
    });

    expect(result.current.isDockBarCollapsed).toBe(false);
  });

  it("when expandDockBar runs on mobile, shows the dock bar again", () => {
    pathnameContextValue = "/collection";
    setupMockMatchMedia({ viewportWidthPx: 390 });

    const { result } = renderHookWithTestProviders(
      () => usePlaybackDockMobileBarCollapsed({ isMiniPlayerVisible: true }),
      { wrapper: PathnameTestWrapper },
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
