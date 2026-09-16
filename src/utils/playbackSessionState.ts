import type { DiscogsRelease, DiscogsVideo } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";

type PlaybackSessionSharedFields = {
  queue: PlaybackQueueItem[];
  playbackHistory: PlaybackQueueItem[];
  activeTrackIndex: number;
  pendingTrackPosition: string | null;
  pendingPreviewVideoUri: string | null;
};

export type IdlePlaybackSession = PlaybackSessionSharedFields & {
  kind: "idle";
  previewVideo: null;
};

export type InactivePlaybackSession = PlaybackSessionSharedFields & {
  kind: "inactive";
  release: DiscogsRelease;
  previewVideo: DiscogsVideo | null;
};

export type ActivePlaybackSession = PlaybackSessionSharedFields & {
  kind: "active";
  release: DiscogsRelease;
  transport: "playing" | "paused";
  previewVideo: DiscogsVideo | null;
};

export type PlaybackSessionState =
  | IdlePlaybackSession
  | InactivePlaybackSession
  | ActivePlaybackSession;

export type PlaybackSessionPhase = PlaybackSessionState["kind"];

export const initialPlaybackSessionState: IdlePlaybackSession = {
  kind: "idle",
  queue: [],
  playbackHistory: [],
  activeTrackIndex: 0,
  previewVideo: null,
  pendingTrackPosition: null,
  pendingPreviewVideoUri: null,
};

export const getSessionRelease = (
  state: PlaybackSessionState,
): DiscogsRelease | null => (state.kind === "idle" ? null : state.release);

export const getPlaybackSessionPhase = (
  state: PlaybackSessionState,
): PlaybackSessionPhase => state.kind;

export const selectIsPlaying = (state: PlaybackSessionState): boolean =>
  state.kind === "active";

export const selectIsPaused = (state: PlaybackSessionState): boolean =>
  state.kind === "active" && state.transport === "paused";

export const selectIsMiniPlayerVisible = (
  state: PlaybackSessionState,
): boolean => state.kind !== "idle";

export type PlaybackSessionValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

const isPlaybackSessionRecord = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const validatePlaybackSessionState = (
  state: unknown,
): PlaybackSessionValidationResult => {
  if (!isPlaybackSessionRecord(state)) {
    return { ok: false, reason: "session must be an object" };
  }

  const kind = state.kind;

  if (kind !== "idle" && kind !== "inactive" && kind !== "active") {
    return { ok: false, reason: "unknown session kind" };
  }

  if (kind === "idle") {
    if (
      "release" in state &&
      state.release !== undefined &&
      state.release !== null
    ) {
      return { ok: false, reason: "idle session must not carry a release" };
    }

    return { ok: true };
  }

  if (state.release === null || state.release === undefined) {
    return { ok: false, reason: "active session requires a release" };
  }

  return { ok: true };
};

const assertValidPlaybackSessionState = (state: PlaybackSessionState): void => {
  const result = validatePlaybackSessionState(state);

  if (!result.ok) {
    throw new Error(result.reason);
  }
};

const sharedFromState = (
  state: PlaybackSessionState,
): PlaybackSessionSharedFields => ({
  queue: state.queue,
  playbackHistory: state.playbackHistory,
  activeTrackIndex: state.activeTrackIndex,
  pendingTrackPosition: state.pendingTrackPosition,
  pendingPreviewVideoUri: state.pendingPreviewVideoUri,
});

export interface PlayQueueItemSessionParams {
  release: DiscogsRelease;
  startPaused: boolean;
  isSameRelease: boolean;
  pendingTrackPosition: string | null;
  pendingPreviewVideoUri: string | null;
}

export const reducePlayQueueItemSession = (
  state: PlaybackSessionState,
  params: PlayQueueItemSessionParams,
): ActivePlaybackSession => {
  const transport = params.startPaused ? "paused" : "playing";
  const shared = {
    ...sharedFromState(state),
    activeTrackIndex: params.isSameRelease ? state.activeTrackIndex : 0,
  };

  if (params.pendingPreviewVideoUri) {
    return {
      kind: "active",
      release: params.release,
      transport,
      previewVideo: null,
      ...shared,
      pendingPreviewVideoUri: params.pendingPreviewVideoUri,
      pendingTrackPosition: null,
    };
  }

  return {
    kind: "active",
    release: params.release,
    transport,
    previewVideo: null,
    ...shared,
    pendingPreviewVideoUri: null,
    pendingTrackPosition: params.pendingTrackPosition,
  };
};

export interface StartReleasePreviewSessionParams {
  release: DiscogsRelease;
  video: DiscogsVideo;
}

export const reduceStartReleasePreviewSession = (
  _state: PlaybackSessionState,
  params: StartReleasePreviewSessionParams,
): ActivePlaybackSession => ({
  kind: "active",
  release: params.release,
  transport: "playing",
  previewVideo: params.video,
  queue: [],
  playbackHistory: [],
  activeTrackIndex: 0,
  pendingTrackPosition: null,
  pendingPreviewVideoUri: null,
});

export const resetPlaybackSession = (
  _state: PlaybackSessionState,
): IdlePlaybackSession => ({
  ...initialPlaybackSessionState,
});

export type PlaybackSessionAction =
  | { type: "STOP" }
  | { type: "SET_QUEUE"; queue: PlaybackQueueItem[] }
  | {
      type: "UPDATE_QUEUE";
      updater: (previousQueue: PlaybackQueueItem[]) => PlaybackQueueItem[];
    }
  | { type: "CLEAR_QUEUE" }
  | { type: "SET_HISTORY"; history: PlaybackQueueItem[] }
  | { type: "PUSH_HISTORY"; item: PlaybackQueueItem }
  | { type: "PLAY_QUEUE_ITEM"; params: PlayQueueItemSessionParams }
  | { type: "START_RELEASE_PREVIEW"; params: StartReleasePreviewSessionParams }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "SET_TRANSPORT_OFF" }
  | { type: "SET_ACTIVE_TRACK_INDEX"; index: number }
  | { type: "SET_PENDING_TRACK_POSITION"; position: string | null }
  | { type: "RESOLVE_PREVIEW_VIDEO"; video: DiscogsVideo }
  | { type: "CLEAR_PREVIEW_PENDING" }
  | {
      type: "RESOLVE_PENDING_TRACK";
      index: number;
      resumeTransport: boolean;
    };

const toInactive = (
  state: Exclude<PlaybackSessionState, IdlePlaybackSession>,
): InactivePlaybackSession => ({
  kind: "inactive",
  release: state.release,
  previewVideo: state.previewVideo,
  ...sharedFromState(state),
});

const reducePauseSession = (
  state: PlaybackSessionState,
): PlaybackSessionState => {
  if (state.kind !== "active") {
    return state;
  }

  return { ...state, transport: "paused" };
};

const reduceResumeSession = (
  state: PlaybackSessionState,
): PlaybackSessionState => {
  if (state.kind !== "active" || state.transport !== "paused") {
    return state;
  }

  return { ...state, transport: "playing" };
};

const reduceSetTransportOffSession = (
  state: PlaybackSessionState,
): PlaybackSessionState => {
  if (state.kind === "idle") {
    return state;
  }

  return toInactive(state);
};

const reduceResolvePreviewVideoSession = (
  state: PlaybackSessionState,
  video: DiscogsVideo,
): PlaybackSessionState => {
  if (state.kind === "idle") {
    return state;
  }

  return {
    ...state,
    previewVideo: video,
    pendingPreviewVideoUri: null,
  };
};

const reduceClearPreviewPendingSession = (
  state: PlaybackSessionState,
): PlaybackSessionState => {
  if (state.kind === "idle") {
    return state;
  }

  return {
    ...state,
    previewVideo: null,
    pendingPreviewVideoUri: null,
  };
};

const reduceResolvePendingTrackSession = (
  state: PlaybackSessionState,
  index: number,
  resumeTransport: boolean,
): PlaybackSessionState => {
  if (state.kind === "idle") {
    return state;
  }

  return {
    ...state,
    activeTrackIndex: index,
    pendingTrackPosition: null,
    previewVideo: null,
    ...(state.kind === "active" && resumeTransport
      ? { transport: "playing" as const }
      : {}),
  };
};

type PlaybackSessionActionHandler<T extends PlaybackSessionAction["type"]> = (
  state: PlaybackSessionState,
  action: Extract<PlaybackSessionAction, { type: T }>,
) => PlaybackSessionState;

const playbackSessionActionHandlers: {
  [K in PlaybackSessionAction["type"]]: PlaybackSessionActionHandler<K>;
} = {
  STOP: (state) => resetPlaybackSession(state),
  SET_QUEUE: (state, action) => ({ ...state, queue: action.queue }),
  UPDATE_QUEUE: (state, action) => ({
    ...state,
    queue: action.updater(state.queue),
  }),
  CLEAR_QUEUE: (state) => ({ ...state, queue: [] }),
  SET_HISTORY: (state, action) => ({
    ...state,
    playbackHistory: action.history,
  }),
  PUSH_HISTORY: (state, action) => ({
    ...state,
    playbackHistory: [...state.playbackHistory, action.item],
  }),
  PLAY_QUEUE_ITEM: (state, action) =>
    reducePlayQueueItemSession(state, action.params),
  START_RELEASE_PREVIEW: (state, action) =>
    reduceStartReleasePreviewSession(state, action.params),
  PAUSE: (state) => reducePauseSession(state),
  RESUME: (state) => reduceResumeSession(state),
  SET_TRANSPORT_OFF: (state) => reduceSetTransportOffSession(state),
  SET_ACTIVE_TRACK_INDEX: (state, action) => ({
    ...state,
    activeTrackIndex: action.index,
  }),
  SET_PENDING_TRACK_POSITION: (state, action) => ({
    ...state,
    pendingTrackPosition: action.position,
  }),
  RESOLVE_PREVIEW_VIDEO: (state, action) =>
    reduceResolvePreviewVideoSession(state, action.video),
  CLEAR_PREVIEW_PENDING: (state) => reduceClearPreviewPendingSession(state),
  RESOLVE_PENDING_TRACK: (state, action) =>
    reduceResolvePendingTrackSession(
      state,
      action.index,
      action.resumeTransport,
    ),
};

export const playbackSessionReducer = (
  state: PlaybackSessionState,
  action: PlaybackSessionAction,
): PlaybackSessionState => {
  const handler = playbackSessionActionHandlers[action.type] as (
    current: PlaybackSessionState,
    currentAction: PlaybackSessionAction,
  ) => PlaybackSessionState;
  const next = handler(state, action);

  if (next === state) {
    return state;
  }

  assertValidPlaybackSessionState(next);
  return next;
};
