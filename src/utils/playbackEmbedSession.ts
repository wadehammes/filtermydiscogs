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
