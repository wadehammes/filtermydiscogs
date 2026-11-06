import { PUBLIC_PLAYBACK_VIDEO_REPORT_ERROR_CODE } from "src/lib/sentry/playbackSkipSentrySource";
import type { DiscogsRelease } from "src/types";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import { definedProps } from "src/utils/definedProps";
import type { PlaybackSkipLogEntry } from "src/utils/playbackSkippedTrackLog";
import { formatArtistNames } from "src/utils/releaseDisplay";
import { formatTrackPositionTitle } from "src/utils/userTrack";

const PUBLIC_PLAYBACK_VIDEO_REPORT_REASON =
  "Listener reported wrong or misleading video for this track on a public page";

export const buildPublicPlaybackVideoReportEntry = (
  playlistId: string,
  track: PlaylistTrackRow,
  release: DiscogsRelease | null,
): PlaybackSkipLogEntry => {
  const trackLabel = formatTrackPositionTitle(
    track.track_position,
    track.track_title,
  );

  const artistFromTrack = track.artist?.trim();
  const artistFromRelease =
    release !== null ? formatArtistNames(release).trim() : "";

  return {
    errorCode: PUBLIC_PLAYBACK_VIDEO_REPORT_ERROR_CODE,
    trackLabel,
    reason: PUBLIC_PLAYBACK_VIDEO_REPORT_REASON,
    context: definedProps({
      trackKey: track.track_key,
      trackPosition: track.track_position,
      trackTitle: track.track_title,
      artist: artistFromTrack || artistFromRelease || undefined,
      youtubeVideoId: track.youtube_id,
      instanceId: track.instance_id,
      publicPlaylistId: playlistId,
      releaseId:
        typeof release?.basic_information?.id === "number"
          ? release.basic_information.id
          : undefined,
      releaseTitle: release?.basic_information.title,
    }),
  };
};
