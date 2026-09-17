"use client";

import { useCallback, useEffect, useState } from "react";
import { trackPlaybackVideoOpened } from "src/analytics/productAnalyticsEvents";
import {
  hasSeenPlaybackVideoIntro,
  markPlaybackVideoIntroSeen,
} from "src/utils/playbackVideoIntroStorage";

interface UseReleaseMiniPlayerVideoPanelStateParams {
  isMiniPlayerVisible: boolean;
  isPlaybackReady: boolean;
  shouldAutoplayEmbed: boolean;
  filtersDrawerOpen: boolean;
  crateDrawerOpen: boolean;
}

export const useReleaseMiniPlayerVideoPanelState = ({
  isMiniPlayerVisible,
  isPlaybackReady,
  shouldAutoplayEmbed,
  filtersDrawerOpen,
  crateDrawerOpen,
}: UseReleaseMiniPlayerVideoPanelStateParams) => {
  const [videoPanelOverride, setVideoPanelOverride] = useState<
    null | "open" | "closed"
  >(null);
  const [latchedIntroExpand, setLatchedIntroExpand] = useState(false);

  useEffect(() => {
    if (isMiniPlayerVisible) {
      return;
    }

    setVideoPanelOverride(null);
    setLatchedIntroExpand(false);
  }, [isMiniPlayerVisible]);

  useEffect(() => {
    if (filtersDrawerOpen || crateDrawerOpen) {
      setVideoPanelOverride("closed");
    }
  }, [crateDrawerOpen, filtersDrawerOpen]);

  const shouldExpandForAutoplay = isPlaybackReady && shouldAutoplayEmbed;

  useEffect(() => {
    if (!(isPlaybackReady && !hasSeenPlaybackVideoIntro())) {
      return;
    }

    setLatchedIntroExpand(true);
    markPlaybackVideoIntroSeen();
  }, [isPlaybackReady]);

  const isVideoPanelExpanded =
    videoPanelOverride === "open" ||
    (videoPanelOverride !== "closed" &&
      (shouldExpandForAutoplay || latchedIntroExpand));

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
