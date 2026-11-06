import {
  YOUTUBE_EMBED_ERROR_EMBED_DISABLED,
  YOUTUBE_EMBED_ERROR_EMBED_DISABLED_ALT,
} from "src/utils/playbackSkippedTrackLog";

export const YOUTUBE_EMBED_DISABLED_ERROR_CODES = [
  YOUTUBE_EMBED_ERROR_EMBED_DISABLED,
  YOUTUBE_EMBED_ERROR_EMBED_DISABLED_ALT,
] as const;

export const isYoutubeEmbedDisabledErrorCode = (errorCode: number): boolean =>
  errorCode === YOUTUBE_EMBED_ERROR_EMBED_DISABLED ||
  errorCode === YOUTUBE_EMBED_ERROR_EMBED_DISABLED_ALT;

export const shouldRemountYoutubeEmbedAfterEmbedDisabledError = ({
  errorCode,
  videoId,
  attemptedVideoIds,
}: {
  errorCode: number;
  videoId: string | null;
  attemptedVideoIds: ReadonlySet<string>;
}): boolean => {
  const trimmedVideoId = videoId?.trim();

  if (!(trimmedVideoId && isYoutubeEmbedDisabledErrorCode(errorCode))) {
    return false;
  }

  return !attemptedVideoIds.has(trimmedVideoId);
};
