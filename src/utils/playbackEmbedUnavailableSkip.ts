import {
  type PlaybackSkipSentryContext,
  reportPlaybackSkipToSentry,
} from "src/lib/sentry/reportPlaybackSkip";
import type { PlaybackSkipLogEntry } from "src/utils/playbackSkippedTrackLog";
import {
  playbackSkipLogDedupeKey,
  resolveYoutubeEmbedErrorReason,
} from "src/utils/playbackSkippedTrackLog";

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
  resolveSkipDisplay,
  resolveSkipContext,
  isSkipAllowed,
  onBeforeSkip,
  reportSkip = reportPlaybackSkipToSentry,
}: {
  appendSkip: (entry: PlaybackSkipLogEntry, onSkip: () => void) => void;
  resolveSkipDisplay: () => Pick<PlaybackSkipLogEntry, "trackLabel">;
  resolveSkipContext?: () => PlaybackSkipSentryContext;
  isSkipAllowed: () => boolean;
  onBeforeSkip?: () => void;
  reportSkip?: (payload: {
    errorCode: number;
    trackLabel: string;
    reason: string;
    context?: PlaybackSkipSentryContext;
  }) => void;
}) => {
  let lastDedupeKey: string | null = null;

  return {
    handleFailure: (errorCode: number, playNext: () => void) => {
      if (!isSkipAllowed()) {
        return;
      }

      const display = resolveSkipDisplay();
      const reason = resolvePlaybackEmbedUnavailableReason(errorCode);
      const dedupeKey = playbackSkipLogDedupeKey(display);

      if (lastDedupeKey === dedupeKey) {
        return;
      }

      lastDedupeKey = dedupeKey;
      onBeforeSkip?.();

      const skipContext = resolveSkipContext?.();

      reportSkip({
        errorCode,
        trackLabel: display.trackLabel,
        reason,
        ...(skipContext ? { context: skipContext } : {}),
      });

      appendSkip({ ...display, reason }, () => {
        lastDedupeKey = null;
        playNext();
      });
    },
    resetDedupe: () => {
      lastDedupeKey = null;
    },
  };
};
