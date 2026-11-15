import type { YoutubeInfoDelivery } from "src/utils/youtubeIframeEvents";

export const PLAYBACK_EMBED_PROGRESS_THROTTLE_MS = 250;
export const PLAYBACK_DOCK_SEEK_SKIP_SECONDS = 10;
export const PLAYBACK_EMBED_PROGRESS_STALE_AFTER_RESET_MS = 1500;
export const PLAYBACK_EMBED_PROGRESS_LOCAL_FLOOR_TOLERANCE_SEC = 0.25;
export const PLAYBACK_EMBED_PROGRESS_STALE_HIGH_TIME_SEC = 2;

export const PLAYBACK_EMBED_PROGRESS_TRACK_RESET: PlaybackEmbedProgress = {
  currentTime: 0,
  duration: null,
};

export interface PlaybackEmbedProgress {
  currentTime: number;
  duration: number | null;
}

export const clampPlaybackSeekSeconds = ({
  seconds,
  duration,
}: {
  seconds: number;
  duration: number | null;
}): number => {
  const lowerBound = Math.max(0, seconds);

  if (duration === null || !Number.isFinite(duration) || duration <= 0) {
    return lowerBound;
  }

  return Math.min(lowerBound, duration);
};

export const resolvePlaybackProgressSliderMax = ({
  duration,
  currentTime,
}: {
  duration: number | null;
  currentTime: number;
}): number => {
  if (duration !== null && Number.isFinite(duration) && duration > 0) {
    return duration;
  }

  return Math.max(currentTime + 30, 90);
};

export const mergeEmbedProgressFromInfoDelivery = ({
  previous,
  info,
}: {
  previous: PlaybackEmbedProgress | null;
  info: YoutubeInfoDelivery;
}): PlaybackEmbedProgress | null => {
  const currentTime = info.currentTime;
  const duration = info.duration;

  if (currentTime === undefined && duration === undefined) {
    return previous;
  }

  const nextCurrentTime = currentTime ?? previous?.currentTime ?? 0;
  const nextDuration =
    duration !== undefined ? duration : (previous?.duration ?? null);

  return {
    currentTime: nextCurrentTime,
    duration: nextDuration,
  };
};

export interface PlaybackEmbedProgressGuard {
  floorSeconds: number | null;
  rejectAboveSecondsUntilMs: number | null;
}

export const createPlaybackEmbedProgressGuardForTrackReset = (
  nowMs: number,
): PlaybackEmbedProgressGuard => ({
  floorSeconds: 0,
  rejectAboveSecondsUntilMs:
    nowMs + PLAYBACK_EMBED_PROGRESS_STALE_AFTER_RESET_MS,
});

export const createPlaybackEmbedProgressGuardForLocalSeek = (
  seconds: number,
): PlaybackEmbedProgressGuard => ({
  floorSeconds: seconds,
  rejectAboveSecondsUntilMs: null,
});

export const clearPlaybackEmbedProgressGuard =
  (): PlaybackEmbedProgressGuard => ({
    floorSeconds: null,
    rejectAboveSecondsUntilMs: null,
  });

export const applyPlaybackEmbedProgressGuard = ({
  progress,
  guard,
  nowMs,
}: {
  progress: PlaybackEmbedProgress;
  guard: PlaybackEmbedProgressGuard;
  nowMs: number;
}): PlaybackEmbedProgress | null => {
  if (
    guard.rejectAboveSecondsUntilMs !== null &&
    nowMs < guard.rejectAboveSecondsUntilMs &&
    progress.currentTime > PLAYBACK_EMBED_PROGRESS_STALE_HIGH_TIME_SEC
  ) {
    return null;
  }

  if (
    guard.floorSeconds !== null &&
    progress.currentTime <
      guard.floorSeconds - PLAYBACK_EMBED_PROGRESS_LOCAL_FLOOR_TOLERANCE_SEC
  ) {
    return {
      ...progress,
      currentTime: guard.floorSeconds,
    };
  }

  return progress;
};

export const shouldClearPlaybackEmbedProgressGuard = ({
  progress,
  guard,
  nowMs,
}: {
  progress: PlaybackEmbedProgress;
  guard: PlaybackEmbedProgressGuard;
  nowMs: number;
}): boolean => {
  if (
    guard.rejectAboveSecondsUntilMs !== null &&
    progress.currentTime <= PLAYBACK_EMBED_PROGRESS_STALE_HIGH_TIME_SEC
  ) {
    return true;
  }

  if (
    guard.rejectAboveSecondsUntilMs !== null &&
    nowMs >= guard.rejectAboveSecondsUntilMs
  ) {
    return true;
  }

  if (
    guard.floorSeconds !== null &&
    progress.currentTime >= guard.floorSeconds + 0.5
  ) {
    return true;
  }

  return false;
};

export const shouldPublishEmbedProgressUpdate = ({
  lastPublishedAtMs,
  nowMs,
  throttleMs,
}: {
  lastPublishedAtMs: number | null;
  nowMs: number;
  throttleMs: number;
}): boolean => {
  if (lastPublishedAtMs === null) {
    return true;
  }

  return nowMs - lastPublishedAtMs >= throttleMs;
};
