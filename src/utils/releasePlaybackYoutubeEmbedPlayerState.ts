import type { PlaybackSessionAction } from "src/utils/playbackSessionState";
import { postYoutubePlayerCommand } from "src/utils/postYoutubePlayerCommand";
import { shouldIgnoreYoutubeEmbedPausedWhileDocumentHidden } from "src/utils/releasePlaybackHiddenTabTransport";
import {
  YOUTUBE_PLAYER_STATE_CUED,
  YOUTUBE_PLAYER_STATE_ENDED,
  YOUTUBE_PLAYER_STATE_PAUSED,
  YOUTUBE_PLAYER_STATE_PLAYING,
} from "src/utils/youtubeIframeEvents";

export const applyYoutubeEmbedPlayerStateChange = ({
  playerState,
  clearPlayFromGestureRetries,
  completeEmbedPlaybackHandshake,
  dispatchSession,
  isPausedRef,
  isPlaybackVideoUiLoadingRef,
  isPlayingRef,
  isWithinTrackSwitchGrace,
  notifyEmbedPlaybackEnded,
  onEmbedTransportPaused,
  pendingPlayFromGestureRef,
  playbackIframeRef,
  playbackVideoTransitionTargetIdRef,
  tryConfirmAudibleEmbedPlayback,
}: {
  playerState: number;
  clearPlayFromGestureRetries: () => void;
  completeEmbedPlaybackHandshake: () => void;
  dispatchSession: (action: PlaybackSessionAction) => void;
  isPausedRef: { current: boolean };
  isPlaybackVideoUiLoadingRef: { current: boolean };
  isPlayingRef: { current: boolean };
  isWithinTrackSwitchGrace: () => boolean;
  notifyEmbedPlaybackEnded: () => void;
  onEmbedTransportPaused?: (() => void) | undefined;
  pendingPlayFromGestureRef: { current: boolean };
  playbackIframeRef: { current: HTMLIFrameElement | null };
  playbackVideoTransitionTargetIdRef: { current: string | null };
  tryConfirmAudibleEmbedPlayback: (input: { playerState?: number }) => boolean;
}): void => {
  if (playerState === YOUTUBE_PLAYER_STATE_ENDED) {
    notifyEmbedPlaybackEnded();
    return;
  }

  if (
    playerState === YOUTUBE_PLAYER_STATE_PAUSED &&
    isPlayingRef.current &&
    !isPausedRef.current
  ) {
    if (isWithinTrackSwitchGrace()) {
      postYoutubePlayerCommand({
        iframe: playbackIframeRef.current,
        command: "playVideo",
      });
      return;
    }

    if (
      shouldIgnoreYoutubeEmbedPausedWhileDocumentHidden({
        visibilityState: document.visibilityState,
        isWithinTrackSwitchGrace: isWithinTrackSwitchGrace(),
        isPlaybackVideoUiLoading: isPlaybackVideoUiLoadingRef.current,
        hasPlaybackVideoTransitionTarget:
          playbackVideoTransitionTargetIdRef.current !== null,
      })
    ) {
      return;
    }

    pendingPlayFromGestureRef.current = false;
    clearPlayFromGestureRetries();
    onEmbedTransportPaused?.();
    dispatchSession({ type: "PAUSE" });
    return;
  }

  if (
    playerState === YOUTUBE_PLAYER_STATE_PLAYING &&
    isPlayingRef.current &&
    isPausedRef.current
  ) {
    dispatchSession({ type: "RESUME" });
  }

  if (
    playerState === YOUTUBE_PLAYER_STATE_PLAYING &&
    isPlayingRef.current &&
    !isPausedRef.current
  ) {
    if (!isPlaybackVideoUiLoadingRef.current) {
      completeEmbedPlaybackHandshake();
    } else {
      tryConfirmAudibleEmbedPlayback({
        playerState: YOUTUBE_PLAYER_STATE_PLAYING,
      });
    }

    return;
  }

  if (
    playerState === YOUTUBE_PLAYER_STATE_CUED &&
    isPlayingRef.current &&
    !isPausedRef.current &&
    pendingPlayFromGestureRef.current
  ) {
    postYoutubePlayerCommand({
      iframe: playbackIframeRef.current,
      command: "playVideo",
    });
  }
};
