import type { DiscogsRelease, DiscogsVideo } from "src/types";
import type { DiscogsTrack } from "src/types/discogs-release-detail.types";
import { formatArtistNames } from "src/utils/releaseDisplay";

export type PlaybackSkipLogEntry = {
  trackLabel: string;
  reason: string;
};

export const YOUTUBE_EMBED_ERROR_VIDEO_UNAVAILABLE = 100;
export const YOUTUBE_EMBED_ERROR_EMBED_DISABLED = 101;
export const YOUTUBE_EMBED_ERROR_EMBED_DISABLED_ALT = 150;

export const resolveYoutubeEmbedErrorReason = (errorCode: number): string => {
  if (errorCode === 0 || errorCode === YOUTUBE_EMBED_ERROR_VIDEO_UNAVAILABLE) {
    return "Private or removed on YouTube";
  }

  if (
    errorCode === YOUTUBE_EMBED_ERROR_EMBED_DISABLED ||
    errorCode === YOUTUBE_EMBED_ERROR_EMBED_DISABLED_ALT
  ) {
    return "Cannot play in embedded player";
  }

  if (errorCode === 2) {
    return "Invalid YouTube video";
  }

  if (errorCode === 5) {
    return "YouTube playback error";
  }

  return "Unavailable on YouTube";
};

export const playbackSkipLogDedupeKey = (
  entry: Pick<PlaybackSkipLogEntry, "trackLabel">,
): string => entry.trackLabel;

export const formatPlaybackSkipLogTitle = (entryCount: number): string => {
  if (entryCount <= 1) {
    return "Skipped unavailable track";
  }

  return `Skipped ${entryCount} unavailable tracks`;
};

export const resolvePlaybackSkipLogDisplay = ({
  release,
  tracks,
  activeTrackIndex,
  previewVideo,
}: {
  release: DiscogsRelease | null;
  tracks: DiscogsTrack[];
  activeTrackIndex: number;
  previewVideo: DiscogsVideo | null;
}): Pick<PlaybackSkipLogEntry, "trackLabel"> => {
  if (previewVideo?.title?.trim()) {
    return { trackLabel: previewVideo.title.trim() };
  }

  if (!release) {
    return { trackLabel: "Current track" };
  }

  const artist = formatArtistNames(release);
  const album = release.basic_information.title?.trim() ?? "";
  const track = tracks[activeTrackIndex];
  const position = track?.position?.trim() ?? "";
  const title = track?.title?.trim() ?? "Unknown track";
  const trackHead = position ? `${position} ${title}` : title;
  const releaseTail = [artist, album]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");

  if (!releaseTail) {
    return { trackLabel: trackHead };
  }

  return { trackLabel: `${trackHead} - ${releaseTail}` };
};
