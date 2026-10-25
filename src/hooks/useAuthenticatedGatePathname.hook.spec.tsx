import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import type { ReactNode } from "react";
import {
  useAuthenticatedGatePathname,
  useRouterPathname,
} from "src/hooks/useAuthenticatedGatePathname.hook";
import { renderHook } from "test-utils";

const PathnameWrapper = ({
  pathname,
  children,
}: {
  pathname: string | null;
  children: ReactNode;
}) => (
  <PathnameContext.Provider value={pathname}>
    {children}
  </PathnameContext.Provider>
);

describe("useAuthenticatedGatePathname", () => {
  let pathnameGetter: jest.SpiedFunction<() => string> | undefined;

  beforeEach(() => {
    pathnameGetter = undefined;
  });

  afterEach(() => {
    pathnameGetter?.mockRestore();
    pathnameGetter = undefined;
  });

  it("when useRouterPathname reads PathnameContext, returns that pathname", () => {
    const pathname = "/playlist/11111111-2222-3333-4444-555555555555";

    const { result } = renderHook(() => useRouterPathname(), {
      wrapper: ({ children }) => (
        <PathnameWrapper pathname={pathname}>{children}</PathnameWrapper>
      ),
    });

    expect(result.current).toBe(pathname);
  });

  it("when PathnameContext is null, useRouterPathname returns slash", () => {
    const { result } = renderHook(() => useRouterPathname(), {
      wrapper: ({ children }) => (
        <PathnameWrapper pathname={null}>{children}</PathnameWrapper>
      ),
    });

    expect(result.current).toBe("/");
  });

  it("returns the router pathname when it matches the live URL", () => {
    const playlistPath = "/playlist/11111111-2222-3333-4444-555555555555";
    pathnameGetter = jest
      .spyOn(window.location, "pathname", "get")
      .mockReturnValue(playlistPath);

    const { result } = renderHook(() => useAuthenticatedGatePathname(), {
      wrapper: ({ children }) => (
        <PathnameWrapper pathname={playlistPath}>{children}</PathnameWrapper>
      ),
    });

    expect(result.current).toBe(playlistPath);
  });

  it("prefers the live public playlist URL when the router pathname lags on a protected route", () => {
    const playlistPath = "/playlist/11111111-2222-3333-4444-555555555555";
    pathnameGetter = jest
      .spyOn(window.location, "pathname", "get")
      .mockReturnValue(playlistPath);

    const { result } = renderHook(() => useAuthenticatedGatePathname(), {
      wrapper: ({ children }) => (
        <PathnameWrapper pathname="/releases">{children}</PathnameWrapper>
      ),
    });

    expect(result.current).toBe(playlistPath);
  });

  it("prefers the live public crate URL when the router pathname lags on a protected route", () => {
    const cratePath = "/crate/ab65c378-fab9-42c0-96bb-c308d413cbbb";
    pathnameGetter = jest
      .spyOn(window.location, "pathname", "get")
      .mockReturnValue(cratePath);

    const { result } = renderHook(() => useAuthenticatedGatePathname(), {
      wrapper: ({ children }) => (
        <PathnameWrapper pathname="/releases">{children}</PathnameWrapper>
      ),
    });

    expect(result.current).toBe(cratePath);
  });

  it("returns the router pathname on public routes without reading the live URL", () => {
    const playlistPath = "/playlist/11111111-2222-3333-4444-555555555555";
    pathnameGetter = jest
      .spyOn(window.location, "pathname", "get")
      .mockReturnValue("/releases");

    const { result } = renderHook(() => useAuthenticatedGatePathname(), {
      wrapper: ({ children }) => (
        <PathnameWrapper pathname={playlistPath}>{children}</PathnameWrapper>
      ),
    });

    expect(result.current).toBe(playlistPath);
    expect(pathnameGetter).not.toHaveBeenCalled();
  });
});
