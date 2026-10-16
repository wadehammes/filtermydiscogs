import { definedProps } from "src/utils/definedProps";
import {
  resolveEmbedPlaybackConfirmGateStartedAtMs,
  shouldConfirmEmbedPlaybackFromAudibleEmbed,
} from "src/utils/releasePlaybackEmbedConfirm";
import type { YoutubeInfoDelivery } from "src/utils/youtubeIframeEvents";

export const shouldConfirmEmbedPlaybackFromInfoDelivery = ({
  info,
  previousCurrentTime,
  embedLoadStartedAtMs,
  videoUiLoadingCycleStartedAtMs = null,
  nowMs,
  isPlaying,
  isPaused,
}: {
  info: YoutubeInfoDelivery;
  previousCurrentTime?: number;
  embedLoadStartedAtMs: number | null;
  videoUiLoadingCycleStartedAtMs?: number | null;
  nowMs: number;
  isPlaying: boolean;
  isPaused: boolean;
}): boolean => {
  const gateStartedAtMs = resolveEmbedPlaybackConfirmGateStartedAtMs({
    imperativeEmbedLoadStartedAtMs: embedLoadStartedAtMs,
    videoUiLoadingCycleStartedAtMs,
  });

  return shouldConfirmEmbedPlaybackFromAudibleEmbed({
    gateStartedAtMs,
    nowMs,
    isPlaying,
    isPaused,
    ...definedProps({
      playerState: info.playerState,
      infoDeliveryCurrentTime: info.currentTime,
      previousInfoDeliveryCurrentTime: previousCurrentTime,
    }),
  });
};
