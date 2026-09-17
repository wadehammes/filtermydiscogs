import type { PlaybackSkipLogEntry } from "src/utils/playbackSkippedTrackLog";
import { resolveYoutubeEmbedErrorReason } from "src/utils/playbackSkippedTrackLog";

export const PLAYBACK_EMBED_UNAVAILABLE_FALLBACK = -1;

export const resolvePlaybackEmbedUnavailableReason = (
  errorCode: number,
): string => {
  if (errorCode === PLAYBACK_EMBED_UNAVAILABLE_FALLBACK) {
    return "Private, removed, blocked, or still loading";
  }

  return resolveYoutubeEmbedErrorReason(errorCode);
};

export const createPlaybackEmbedUnavailableSkipHandler = ({
  appendSkip,
  resolveTrackLabel,
  isSkipAllowed,
  onBeforeSkip,
}: {
  appendSkip: (entry: PlaybackSkipLogEntry, onSkip: () => void) => void;
  resolveTrackLabel: () => string;
  isSkipAllowed: () => boolean;
  onBeforeSkip?: () => void;
}) => {
  let lastDedupeKey: string | null = null;

  return {
    handleFailure: (errorCode: number, playNext: () => void) => {
      if (!isSkipAllowed()) {
        return;
      }

      const trackLabel = resolveTrackLabel();
      const reason = resolvePlaybackEmbedUnavailableReason(errorCode);

      if (lastDedupeKey === trackLabel) {
        return;
      }

      lastDedupeKey = trackLabel;
      onBeforeSkip?.();

      appendSkip({ trackLabel, reason }, () => {
        lastDedupeKey = null;
        playNext();
      });
    },
    resetDedupe: () => {
      lastDedupeKey = null;
    },
  };
};
