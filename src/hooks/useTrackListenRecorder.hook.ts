"use client";

import { useEffect } from "react";
import { useAuth } from "src/context/auth.context";
import { useReleasePlaybackState } from "src/context/releasePlayback.context";
import { buildCurrentQueueItem } from "src/utils/playbackQueue";
import { PREVIEW_TRACK_POSITION_PREFIX } from "src/utils/releasePlayback";
import {
  resetUserTrackRecordingSession,
  setActiveListenQueueItem,
  tickTrackListenMs,
} from "src/utils/userTrackRecording";

export const useTrackListenRecorder = (): void => {
  const {
    state: { isAuthenticated },
  } = useAuth();
  const {
    release,
    activeTrack,
    activeTrackPosition,
    isPlaying,
    isPaused,
    isReleasePreview,
    videos,
  } = useReleasePlaybackState();

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveListenQueueItem(null);
      resetUserTrackRecordingSession();
      return;
    }

    if (!(release && isPlaying) || isPaused) {
      setActiveListenQueueItem(null);
      return;
    }

    const previewVideo =
      isReleasePreview &&
      activeTrackPosition?.startsWith(PREVIEW_TRACK_POSITION_PREFIX)
        ? (videos.find((video) => activeTrackPosition.endsWith(video.uri)) ??
          null)
        : null;

    const item = buildCurrentQueueItem({
      release,
      previewVideo,
      activeTrack,
    });

    setActiveListenQueueItem(item);

    if (!item) {
      return;
    }

    const intervalId = window.setInterval(() => {
      tickTrackListenMs(item, 1000);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    activeTrack,
    activeTrackPosition,
    isAuthenticated,
    isPaused,
    isPlaying,
    isReleasePreview,
    release,
    videos,
  ]);
};
