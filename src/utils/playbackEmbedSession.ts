import { definedProps } from "src/utils/definedProps";
import {
  YOUTUBE_PLAYER_STATE_PLAYING,
  type YoutubeInfoDelivery,
} from "src/utils/youtubeIframeEvents";

export const EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS = 400;

export const EMBED_WATCHDOG_SYNC_PROBE_RECHECK_MS =
  EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS + 100;

export const PLAYBACK_EMBED_AUDIBLE_SYNC_POLL_MS = 2500;

export const PLAYBACK_EMBED_INITIAL_PRESENTATION_WATCHDOG_GRACE_MS = 3000;

export const resolvePlaybackEmbedWatchdogDelayMsWithInitialGrace = ({
  baseDelayMs,
  initialPresentationGracePending,
}: {
  baseDelayMs: number;
  initialPresentationGracePending: boolean;
}): number =>
  initialPresentationGracePending
    ? baseDelayMs + PLAYBACK_EMBED_INITIAL_PRESENTATION_WATCHDOG_GRACE_MS
    : baseDelayMs;

export const resolveEmbedPlaybackConfirmGateStartedAtMs = ({
  imperativeEmbedLoadStartedAtMs,
  videoUiLoadingCycleStartedAtMs,
}: {
  imperativeEmbedLoadStartedAtMs: number | null;
  videoUiLoadingCycleStartedAtMs: number | null;
}): number | null =>
  imperativeEmbedLoadStartedAtMs ?? videoUiLoadingCycleStartedAtMs;

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

const evaluateAudibleEmbedPlaybackConfirm = ({
  gateStartedAtMs,
  nowMs,
  transportSessionActive,
  transportPaused,
  playerState,
  infoDeliveryCurrentTime,
  previousInfoDeliveryCurrentTime,
  lastInfoDeliveryCurrentTime,
}: {
  gateStartedAtMs: number | null;
  nowMs: number;
  transportSessionActive: boolean;
  transportPaused: boolean;
  playerState?: number;
  infoDeliveryCurrentTime?: number;
  previousInfoDeliveryCurrentTime?: number;
  lastInfoDeliveryCurrentTime?: number;
}): boolean => {
  if (!transportSessionActive || transportPaused) {
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
}): boolean =>
  evaluateAudibleEmbedPlaybackConfirm({
    gateStartedAtMs,
    nowMs,
    transportSessionActive: isPlaying,
    transportPaused: isPaused,
    ...definedProps({
      playerState,
      infoDeliveryCurrentTime,
      previousInfoDeliveryCurrentTime,
      lastInfoDeliveryCurrentTime,
    }),
  });

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

export type PlaybackEmbedConfirmSignal =
  | {
      kind: "audible";
      playerState?: number;
      infoDeliveryCurrentTime?: number;
      previousInfoDeliveryCurrentTime?: number;
    }
  | {
      kind: "info-delivery";
      info: YoutubeInfoDelivery;
      previousCurrentTime?: number;
    }
  | { kind: "watchdog-progress" };

export type TryConfirmPlaybackEmbedFromSignalInput = {
  signal: PlaybackEmbedConfirmSignal;
  imperativeEmbedLoadStartedAtMs: number | null;
  videoUiLoadingCycleStartedAtMs?: number | null;
  nowMs: number;
  transportSessionActive: boolean;
  transportPaused: boolean;
  embedPlaybackConfirmed?: boolean;
  lastInfoDeliveryCurrentTime?: number;
};

export const tryConfirmPlaybackEmbedFromSignal = (
  input: TryConfirmPlaybackEmbedFromSignalInput,
): boolean => {
  if (input.signal.kind === "watchdog-progress") {
    return shouldConfirmEmbedPlaybackFromWatchdogProgress({
      embedPlaybackConfirmed: input.embedPlaybackConfirmed ?? false,
      lastInfoDeliveryCurrentTime: input.lastInfoDeliveryCurrentTime,
      isPlaying: input.transportSessionActive,
      isPaused: input.transportPaused,
    });
  }

  const gateStartedAtMs = resolveEmbedPlaybackConfirmGateStartedAtMs({
    imperativeEmbedLoadStartedAtMs: input.imperativeEmbedLoadStartedAtMs,
    videoUiLoadingCycleStartedAtMs:
      input.videoUiLoadingCycleStartedAtMs ?? null,
  });

  if (input.signal.kind === "info-delivery") {
    return evaluateAudibleEmbedPlaybackConfirm({
      gateStartedAtMs,
      nowMs: input.nowMs,
      transportSessionActive: input.transportSessionActive,
      transportPaused: input.transportPaused,
      ...definedProps({
        playerState: input.signal.info.playerState,
        infoDeliveryCurrentTime: input.signal.info.currentTime,
        previousInfoDeliveryCurrentTime: input.signal.previousCurrentTime,
        lastInfoDeliveryCurrentTime: input.lastInfoDeliveryCurrentTime,
      }),
    });
  }

  return evaluateAudibleEmbedPlaybackConfirm({
    gateStartedAtMs,
    nowMs: input.nowMs,
    transportSessionActive: input.transportSessionActive,
    transportPaused: input.transportPaused,
    ...definedProps({
      playerState: input.signal.playerState,
      infoDeliveryCurrentTime: input.signal.infoDeliveryCurrentTime,
      previousInfoDeliveryCurrentTime:
        input.signal.previousInfoDeliveryCurrentTime,
      lastInfoDeliveryCurrentTime: input.lastInfoDeliveryCurrentTime,
    }),
  });
};

export type PlaybackEmbedHiddenPollContext = {
  transportSessionActive: boolean;
  documentHidden: boolean;
  transportPaused: boolean;
  withinTrackSwitchGrace: boolean;
};

export const selectShouldRunHiddenTabPlayerStatePoll = (
  context: PlaybackEmbedHiddenPollContext,
): boolean => context.transportSessionActive;

export const selectShouldAttemptPlayFromGestureDuringHiddenPoll = (
  context: PlaybackEmbedHiddenPollContext,
): boolean =>
  context.documentHidden &&
  context.withinTrackSwitchGrace &&
  !context.transportPaused;

export type PlaybackEmbedAudibleSyncPollContext = {
  transportSessionActive: boolean;
  transportPaused: boolean;
  videoUiLoading: boolean;
  embedConfirmed: boolean;
  documentHidden: boolean;
};

export const selectShouldRunVisibleTabAudibleSyncPoll = (
  context: PlaybackEmbedAudibleSyncPollContext,
): boolean =>
  context.transportSessionActive &&
  !context.transportPaused &&
  context.videoUiLoading &&
  !context.embedConfirmed &&
  !context.documentHidden;

export type PlaybackEmbedSessionState = {
  loadVideoId: string | null;
  loadGeneration: number;
  loadStartedAtMs: number | null;
  embedConfirmed: boolean;
  videoUiLoading: boolean;
  trackSwitchGraceUntilMs: number | null;
};

export const initialPlaybackEmbedSessionState: PlaybackEmbedSessionState = {
  loadVideoId: null,
  loadGeneration: 0,
  loadStartedAtMs: null,
  embedConfirmed: false,
  videoUiLoading: false,
  trackSwitchGraceUntilMs: null,
};

export type PlaybackEmbedSessionEvent =
  | { type: "embed/session/reset" }
  | { type: "embed/load/started"; videoId: string; nowMs: number }
  | { type: "embed/load/confirmed"; videoId: string }
  | { type: "embed/ui-loading/began" }
  | { type: "embed/ui-loading/cleared" }
  | { type: "embed/track-switch-grace/marked"; untilMs: number };

export const reducePlaybackEmbedSession = (
  state: PlaybackEmbedSessionState,
  event: PlaybackEmbedSessionEvent,
): PlaybackEmbedSessionState => {
  switch (event.type) {
    case "embed/session/reset":
      return initialPlaybackEmbedSessionState;

    case "embed/load/started": {
      const sameVideo =
        state.loadVideoId === event.videoId && state.loadGeneration > 0;

      if (sameVideo) {
        return {
          ...state,
          loadStartedAtMs: event.nowMs,
          embedConfirmed: false,
        };
      }

      return {
        ...state,
        loadVideoId: event.videoId,
        loadGeneration: state.loadGeneration + 1,
        loadStartedAtMs: event.nowMs,
        embedConfirmed: false,
      };
    }

    case "embed/load/confirmed": {
      if (state.loadVideoId !== event.videoId || !state.loadVideoId) {
        return state;
      }

      return {
        ...state,
        embedConfirmed: true,
      };
    }

    case "embed/ui-loading/began":
      return {
        ...state,
        videoUiLoading: true,
      };

    case "embed/ui-loading/cleared":
      return {
        ...state,
        videoUiLoading: false,
      };

    case "embed/track-switch-grace/marked":
      return {
        ...state,
        trackSwitchGraceUntilMs: event.untilMs,
      };

    default:
      return state;
  }
};
