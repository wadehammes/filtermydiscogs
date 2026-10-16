import { YOUTUBE_PLAYER_STATE_PLAYING } from "src/utils/youtubeIframeEvents";

export const EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS = 400;

export const EMBED_WATCHDOG_SYNC_PROBE_RECHECK_MS =
  EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS + 100;

export const PLAYBACK_EMBED_AUDIBLE_SYNC_POLL_MS = 2500;

export const resolveEmbedPlaybackConfirmGateStartedAtMs = ({
  imperativeEmbedLoadStartedAtMs,
  videoUiLoadingCycleStartedAtMs,
}: {
  imperativeEmbedLoadStartedAtMs: number | null;
  videoUiLoadingCycleStartedAtMs: number | null;
}): number | null =>
  imperativeEmbedLoadStartedAtMs ?? videoUiLoadingCycleStartedAtMs;

export const shouldConfirmEmbedPlaybackFromAudibleEmbed = ({
  gateStartedAtMs,
  nowMs,
  isPlaying,
  isPaused,
  playerState,
  infoDeliveryCurrentTime,
  previousInfoDeliveryCurrentTime,
  lastInfoDeliveryCurrentTime,
}: {
  gateStartedAtMs: number | null;
  nowMs: number;
  isPlaying: boolean;
  isPaused: boolean;
  playerState?: number;
  infoDeliveryCurrentTime?: number;
  previousInfoDeliveryCurrentTime?: number;
  lastInfoDeliveryCurrentTime?: number;
}): boolean => {
  if (!isPlaying || isPaused) {
    return false;
  }

  if (
    gateStartedAtMs === null &&
    typeof lastInfoDeliveryCurrentTime === "number" &&
    lastInfoDeliveryCurrentTime > 0
  ) {
    return true;
  }

  if (gateStartedAtMs === null) {
    return false;
  }

  if (
    !shouldAcceptEmbedPlayingConfirmation({
      embedLoadStartedAtMs: gateStartedAtMs,
      nowMs,
    })
  ) {
    return false;
  }

  if (playerState === YOUTUBE_PLAYER_STATE_PLAYING) {
    return true;
  }

  if (infoDeliveryCurrentTime !== undefined) {
    if (infoDeliveryCurrentTime > 0) {
      return true;
    }

    if (
      previousInfoDeliveryCurrentTime !== undefined &&
      infoDeliveryCurrentTime > previousInfoDeliveryCurrentTime
    ) {
      return true;
    }
  }

  if (
    typeof lastInfoDeliveryCurrentTime === "number" &&
    lastInfoDeliveryCurrentTime > 0
  ) {
    return true;
  }

  return false;
};

export const shouldAcceptEmbedPlayingConfirmation = ({
  embedLoadStartedAtMs,
  nowMs,
  minDelayMs = EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
}: {
  embedLoadStartedAtMs: number | null;
  nowMs: number;
  minDelayMs?: number;
}): boolean => {
  if (embedLoadStartedAtMs === null) {
    return false;
  }

  return nowMs - embedLoadStartedAtMs >= minDelayMs;
};

export const shouldConfirmEmbedPlaybackFromWatchdogProgress = ({
  embedPlaybackConfirmed,
  lastInfoDeliveryCurrentTime,
  isPlaying,
  isPaused,
}: {
  embedPlaybackConfirmed: boolean;
  lastInfoDeliveryCurrentTime: number | undefined;
  isPlaying: boolean;
  isPaused: boolean;
}): boolean =>
  !embedPlaybackConfirmed &&
  isPlaying &&
  !isPaused &&
  typeof lastInfoDeliveryCurrentTime === "number" &&
  lastInfoDeliveryCurrentTime > 0;
