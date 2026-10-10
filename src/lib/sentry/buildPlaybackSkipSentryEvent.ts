import type { PlaybackSkipSource } from "src/lib/sentry/reportPlaybackSkip";

export type PlaybackSkipSentryDetails = {
  artist?: string;
  connectionQuality?: string;
  discogsMatchedYoutubeId?: string | null;
  instanceId?: string;
  isPreviewVideo?: boolean;
  previewVideoTitle?: string;
  releaseId?: number;
  releaseTitle?: string;
  trackKey?: string;
  trackPosition?: string;
  trackTitle?: string;
  userYoutubeOverrideId?: string | null;
  watchdogMs?: number;
  youtubeVideoId?: string | null;
};

export const resolvePlaybackSkipHeadline = (
  source: PlaybackSkipSource,
  connectionQuality?: string,
): string => {
  if (source === "watchdog") {
    if (connectionQuality === "slow") {
      return "Embed Load Watchdog (Slow Network)";
    }

    return "Embed Load Watchdog";
  }

  return "YouTube Embed Error";
};

const resolvePlaybackSkipYoutubeId = (
  details?: PlaybackSkipSentryDetails,
): string | null =>
  details?.youtubeVideoId?.trim() ||
  details?.userYoutubeOverrideId?.trim() ||
  details?.discogsMatchedYoutubeId?.trim() ||
  null;

const resolvePlaybackSkipTrackDetailLine = (
  details: PlaybackSkipSentryDetails | undefined,
  trackLabel: string,
): string => {
  if (details?.trackPosition && details?.trackTitle) {
    return `${details.trackPosition} · ${details.trackTitle}`;
  }

  if (details?.previewVideoTitle?.trim()) {
    return details.previewVideoTitle.trim();
  }

  return trackLabel;
};

const resolvePlaybackSkipReleaseLine = (
  details?: PlaybackSkipSentryDetails,
): string =>
  [details?.artist, details?.releaseTitle]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" · ");

export const buildPlaybackSkipSentryMessage = ({
  source,
  reason,
  details,
}: {
  source: PlaybackSkipSource;
  reason: string;
  trackLabel: string;
  details?: PlaybackSkipSentryDetails;
}): string => {
  const headline = resolvePlaybackSkipHeadline(
    source,
    details?.connectionQuality,
  );

  const segments = [`${headline} - ${reason}`];
  const youtubeId = resolvePlaybackSkipYoutubeId(details);
  if (youtubeId) {
    segments.push(`yt:${youtubeId}`);
  }

  return segments.join(" - ");
};

export const buildPlaybackSkipSentryDetailLine = ({
  trackLabel,
  details,
}: {
  source: PlaybackSkipSource;
  reason: string;
  trackLabel: string;
  details?: PlaybackSkipSentryDetails;
}): string => {
  const segments = [resolvePlaybackSkipTrackDetailLine(details, trackLabel)];

  const releaseLine = resolvePlaybackSkipReleaseLine(details);
  if (releaseLine) {
    segments.push(releaseLine);
  }

  const youtubeId = resolvePlaybackSkipYoutubeId(details);
  if (youtubeId) {
    segments.push(`yt:${youtubeId}`);
  }

  return segments.join(" — ");
};

export const buildPlaybackSkipSentryTags = ({
  source,
  errorCode,
  details,
}: {
  source: PlaybackSkipSource;
  errorCode: number;
  details?: PlaybackSkipSentryDetails;
}): Record<string, string> => {
  const tags: Record<string, string> = {
    "playback.skip_source": source,
    "playback.youtube_error_code": String(errorCode),
  };

  if (details?.releaseId !== undefined) {
    tags["playback.release_id"] = String(details.releaseId);
  }
  if (details?.instanceId) {
    tags["playback.instance_id"] = details.instanceId;
  }
  if (details?.trackPosition) {
    tags["playback.track_position"] = details.trackPosition;
  }
  if (details?.trackKey) {
    tags["playback.track_key"] = details.trackKey;
  }
  const youtubeId = resolvePlaybackSkipYoutubeId(details);
  if (youtubeId) {
    tags["playback.youtube_video_id"] = youtubeId;
  }
  if (details?.connectionQuality) {
    tags["playback.connection_quality"] = details.connectionQuality;
  }

  return tags;
};
