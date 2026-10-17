import { definedProps } from "src/utils/definedProps";
import { tryConfirmPlaybackEmbedFromSignal } from "src/utils/playbackEmbedSession";
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
}): boolean =>
  tryConfirmPlaybackEmbedFromSignal({
    signal: {
      kind: "info-delivery",
      info,
      ...definedProps({ previousCurrentTime }),
    },
    imperativeEmbedLoadStartedAtMs: embedLoadStartedAtMs,
    videoUiLoadingCycleStartedAtMs,
    nowMs,
    transportSessionActive: isPlaying,
    transportPaused: isPaused,
  });
