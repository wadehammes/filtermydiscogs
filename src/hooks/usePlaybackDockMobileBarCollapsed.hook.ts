"use client";

import { useAtom } from "jotai";
import { useEffect, useLayoutEffect, useRef } from "react";
import { playbackDockBarCollapsedAtom } from "src/atoms/playbackDockUi.atoms";
import { BELOW_DESKTOP_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import { isAdminAppRoute } from "src/constants/protectedRoutes";
import { useAuthenticatedGatePathname } from "src/hooks/useAuthenticatedGatePathname.hook";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";

interface UsePlaybackDockMobileBarCollapsedParams {
  isMiniPlayerVisible: boolean;
}

export const usePlaybackDockMobileBarCollapsed = ({
  isMiniPlayerVisible,
}: UsePlaybackDockMobileBarCollapsedParams) => {
  const pathname = useAuthenticatedGatePathname();
  const isBelowDesktopLayout = useMediaQuery(BELOW_DESKTOP_LAYOUT_MEDIA_QUERY);
  const [dockBarCollapsed, setDockBarCollapsed] = useAtom(
    playbackDockBarCollapsedAtom,
  );
  const onAdminRoute = isMiniPlayerVisible && isAdminAppRoute(pathname);
  const wasOnAdminRouteRef = useRef(false);

  useLayoutEffect(() => {
    const enteringAdmin = onAdminRoute && !wasOnAdminRouteRef.current;
    wasOnAdminRouteRef.current = onAdminRoute;

    if (enteringAdmin) {
      setDockBarCollapsed(true);
    }
  }, [onAdminRoute, setDockBarCollapsed]);

  useEffect(() => {
    if (isMiniPlayerVisible && isBelowDesktopLayout) {
      return;
    }

    if (!isAdminAppRoute(pathname)) {
      setDockBarCollapsed(false);
    }
  }, [
    isBelowDesktopLayout,
    isMiniPlayerVisible,
    pathname,
    setDockBarCollapsed,
  ]);

  const isMobilePlaybackDockUiActive =
    isBelowDesktopLayout && isMiniPlayerVisible;

  const isDockBarCollapsed = onAdminRoute
    ? dockBarCollapsed
    : isMobilePlaybackDockUiActive && dockBarCollapsed;

  const collapseDockBar = () => {
    setDockBarCollapsed(true);
  };

  const expandDockBar = () => {
    setDockBarCollapsed(false);
  };

  return {
    collapseDockBar,
    expandDockBar,
    isDockBarCollapsed,
    isMobilePlaybackDockUiActive,
  };
};
