"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trackPlaybackVideoOpened } from "src/analytics/productAnalyticsEvents";
import {
  hasSeenPlaybackVideoIntro,
  markPlaybackVideoIntroSeen,
} from "src/utils/playbackVideoIntroStorage";

interface UseReleaseMiniPlayerVideoPanelStateParams {
  isMiniPlayerVisible: boolean;
  isPlaybackReady: boolean;
  shouldAutoplayEmbed: boolean;
  isPlaying: boolean;
  filtersDrawerOpen: boolean;
  crateDrawerOpen: boolean;
  resumePlaybackFromGesture: () => void;
}

export const useReleaseMiniPlayerVideoPanelState = ({
  isMiniPlayerVisible,
  isPlaybackReady,
  shouldAutoplayEmbed,
  isPlaying,
  filtersDrawerOpen,
  crateDrawerOpen,
  resumePlaybackFromGesture,
}: UseReleaseMiniPlayerVideoPanelStateParams) => {
  const [videoPanelOverride, setVideoPanelOverride] = useState<
    null | "open" | "closed"
  >(null);
  const [latchedIntroExpand, setLatchedIntroExpand] = useState(false);
  const [autoplayExpandActive, setAutoplayExpandActive] = useState(false);
  const previousShouldExpandForAutoplayRef = useRef(false);
  const previousDrawerForcedCollapsedRef = useRef(false);
  const previousVideoPanelExpandedRef = useRef(false);

  useEffect(() => {
    if (isMiniPlayerVisible) {
      return;
    }

    setVideoPanelOverride(null);
    setLatchedIntroExpand(false);
    setAutoplayExpandActive(false);
    previousShouldExpandForAutoplayRef.current = false;
    previousDrawerForcedCollapsedRef.current = false;
    previousVideoPanelExpandedRef.current = false;
  }, [isMiniPlayerVisible]);

  const drawerForcedCollapsed = filtersDrawerOpen || crateDrawerOpen;
  const shouldExpandForAutoplay = isPlaybackReady && shouldAutoplayEmbed;

  useEffect(() => {
    const autoplayExpandStarted =
      shouldExpandForAutoplay && !previousShouldExpandForAutoplayRef.current;
    const drawerForcedCollapseStarted =
      drawerForcedCollapsed && !previousDrawerForcedCollapsedRef.current;

    previousShouldExpandForAutoplayRef.current = shouldExpandForAutoplay;
    previousDrawerForcedCollapsedRef.current = drawerForcedCollapsed;

    if (!shouldExpandForAutoplay) {
      setAutoplayExpandActive(false);
      return;
    }

    if (autoplayExpandStarted) {
      setAutoplayExpandActive(true);
      return;
    }

    if (drawerForcedCollapseStarted && autoplayExpandActive) {
      setAutoplayExpandActive(false);
    }
  }, [autoplayExpandActive, drawerForcedCollapsed, shouldExpandForAutoplay]);

  useEffect(() => {
    if (!(isPlaybackReady && !hasSeenPlaybackVideoIntro())) {
      return;
    }

    setLatchedIntroExpand(true);
    markPlaybackVideoIntroSeen();
  }, [isPlaybackReady]);

  const isVideoPanelExpanded =
    videoPanelOverride === "closed"
      ? false
      : videoPanelOverride === "open"
        ? true
        : autoplayExpandActive
          ? true
          : !drawerForcedCollapsed && latchedIntroExpand;

  useEffect(() => {
    const wasExpanded = previousVideoPanelExpandedRef.current;
    previousVideoPanelExpandedRef.current = isVideoPanelExpanded;

    if (
      !wasExpanded &&
      isVideoPanelExpanded &&
      shouldAutoplayEmbed &&
      isPlaying
    ) {
      resumePlaybackFromGesture();
    }
  }, [
    isPlaying,
    isVideoPanelExpanded,
    resumePlaybackFromGesture,
    shouldAutoplayEmbed,
  ]);

  const handleVideoToggle = useCallback(() => {
    markPlaybackVideoIntroSeen();
    if (!isVideoPanelExpanded) {
      trackPlaybackVideoOpened();
    }
    setVideoPanelOverride(isVideoPanelExpanded ? "closed" : "open");
  }, [isVideoPanelExpanded]);

  return {
    isVideoPanelExpanded,
    handleVideoToggle,
  };
};
