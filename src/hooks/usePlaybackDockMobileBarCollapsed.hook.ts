"use client";

import { useAtom } from "jotai";
import { useEffect } from "react";
import { playbackDockMobileBarCollapsedAtom } from "src/atoms/playbackDockUi.atoms";
import { BELOW_DESKTOP_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";

interface UsePlaybackDockMobileBarCollapsedParams {
  isMiniPlayerVisible: boolean;
}

export const usePlaybackDockMobileBarCollapsed = ({
  isMiniPlayerVisible,
}: UsePlaybackDockMobileBarCollapsedParams) => {
  const isBelowDesktopLayout = useMediaQuery(BELOW_DESKTOP_LAYOUT_MEDIA_QUERY);
  const [mobileBarCollapsed, setMobileBarCollapsed] = useAtom(
    playbackDockMobileBarCollapsedAtom,
  );

  useEffect(() => {
    if (!(isMiniPlayerVisible && isBelowDesktopLayout)) {
      setMobileBarCollapsed(false);
    }
  }, [isBelowDesktopLayout, isMiniPlayerVisible, setMobileBarCollapsed]);

  const isMobilePlaybackDockUiActive =
    isBelowDesktopLayout && isMiniPlayerVisible;

  const isDockBarCollapsed = isMobilePlaybackDockUiActive && mobileBarCollapsed;

  const collapseDockBar = () => {
    setMobileBarCollapsed(true);
  };

  const expandDockBar = () => {
    setMobileBarCollapsed(false);
  };

  return {
    collapseDockBar,
    expandDockBar,
    isDockBarCollapsed,
    isMobilePlaybackDockUiActive,
  };
};
