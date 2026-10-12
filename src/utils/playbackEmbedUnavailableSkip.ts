import type { PlaybackSkipCapturePayload } from "src/lib/sentry/buildPlaybackSkipCaptureOptions";
import type { PlaybackSkipSentryDetails } from "src/lib/sentry/buildPlaybackSkipSentryEvent";
import { reportPlaybackSkipToSentry } from "src/lib/sentry/reportPlaybackSkip";
import { definedProps } from "src/utils/definedProps";
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
  resolveSkipContext?: () => PlaybackSkipSentryDetails;
  isSkipAllowed: () => boolean;
  onBeforeSkip?: () => void;
  reportSkip?: (payload: PlaybackSkipCapturePayload) => void;
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

      reportSkip(
        definedProps({
          errorCode,
          trackLabel: display.trackLabel,
          reason,
          context: skipContext,
        }),
      );

      appendSkip(
        definedProps({
          ...display,
          reason,
          errorCode,
          context: skipContext,
        }),
        () => {
          lastDedupeKey = null;
          playNext();
        },
      );
    },
    resetDedupe: () => {
      lastDedupeKey = null;
    },
  };
};
