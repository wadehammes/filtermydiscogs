"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trackPlaybackVideoOpened } from "src/analytics/productAnalyticsEvents";
import { markPlaybackVideoIntroSeen } from "src/utils/playbackVideoIntroStorage";

interface UseReleaseMiniPlayerVideoPanelStateParams {
  isMiniPlayerVisible: boolean;
  isPlaying: boolean;
  resumePlaybackFromGesture: () => void;
}

export const useReleaseMiniPlayerVideoPanelState = ({
  isMiniPlayerVisible,
  isPlaying,
  resumePlaybackFromGesture,
}: UseReleaseMiniPlayerVideoPanelStateParams) => {
  const [videoPanelOverride, setVideoPanelOverride] = useState<
    null | "open" | "closed"
  >(null);
  const previousVideoPanelExpandedRef = useRef(false);

  useEffect(() => {
    if (isMiniPlayerVisible) {
      return;
    }

    setVideoPanelOverride(null);
    previousVideoPanelExpandedRef.current = false;
  }, [isMiniPlayerVisible]);

  const isVideoPanelExpanded = videoPanelOverride === "open";

  useEffect(() => {
    const wasExpanded = previousVideoPanelExpandedRef.current;
    previousVideoPanelExpandedRef.current = isVideoPanelExpanded;

    if (!wasExpanded && isVideoPanelExpanded && isPlaying) {
      resumePlaybackFromGesture();
    }
  }, [isPlaying, isVideoPanelExpanded, resumePlaybackFromGesture]);

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
