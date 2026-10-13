import { shouldAcceptEmbedPlayingConfirmation } from "src/utils/releasePlaybackEmbedConfirm";
import {
  YOUTUBE_PLAYER_STATE_PLAYING,
  type YoutubeInfoDelivery,
} from "src/utils/youtubeIframeEvents";

export const shouldConfirmEmbedPlaybackFromInfoDelivery = ({
  info,
  previousCurrentTime,
  embedLoadStartedAtMs,
  nowMs,
  isPlaying,
  isPaused,
}: {
  info: YoutubeInfoDelivery;
  previousCurrentTime?: number;
  embedLoadStartedAtMs: number | null;
  nowMs: number;
  isPlaying: boolean;
  isPaused: boolean;
}): boolean => {
  if (!isPlaying || isPaused) {
    return false;
  }

  if (embedLoadStartedAtMs === null) {
    return false;
  }

  if (
    !shouldAcceptEmbedPlayingConfirmation({
      embedLoadStartedAtMs,
      nowMs,
    })
  ) {
    return false;
  }

  if (info.playerState === YOUTUBE_PLAYER_STATE_PLAYING) {
    return true;
  }

  if (
    info.currentTime !== undefined &&
    (info.currentTime > 0 ||
      (previousCurrentTime !== undefined &&
        info.currentTime > previousCurrentTime))
  ) {
    return true;
  }

  return false;
};
