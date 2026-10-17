import type { PlaybackEmbedSessionState } from "src/utils/playbackEmbedSession";

export type PlaybackEmbedSessionRefTarget = {
  embedPlaybackConfirmed: { current: boolean };
  isPlaybackVideoUiLoading: { current: boolean };
  playbackVideoUiLoadingEmbedLoadStartedAtMs: { current: number | null };
  playbackVideoUiLoadingCycleStartedAtMs: { current: number | null };
  playbackVideoUiLoadingTargetVideoId: { current: string | null };
};

export const syncPlaybackEmbedSessionRefs = (
  session: PlaybackEmbedSessionState,
  targets: PlaybackEmbedSessionRefTarget,
): void => {
  targets.embedPlaybackConfirmed.current = session.embedConfirmed;
  targets.isPlaybackVideoUiLoading.current = session.videoUiLoading;
  targets.playbackVideoUiLoadingEmbedLoadStartedAtMs.current =
    session.imperativeLoadStartedAtMs;
  targets.playbackVideoUiLoadingCycleStartedAtMs.current =
    session.videoUiLoadingCycleStartedAtMs;
  targets.playbackVideoUiLoadingTargetVideoId.current =
    session.loadingTargetVideoId;
};
