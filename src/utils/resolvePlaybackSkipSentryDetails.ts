import type { PlaybackSkipSentryDetails } from "src/lib/sentry/buildPlaybackSkipSentryEvent";
import type { DiscogsRelease, DiscogsVideo } from "src/types";
import type { DiscogsTrack } from "src/types/discogs-release-detail.types";
import { definedProps } from "src/utils/definedProps";
import { formatArtistNames } from "src/utils/releaseDisplay";
import { buildTrackKey } from "src/utils/userTrack";

export const resolvePlaybackSkipSentryDetails = ({
  release,
  tracks,
  activeTrackIndex,
  previewVideo,
  youtubeVideoId,
  userYoutubeOverrideId,
  discogsMatchedYoutubeId,
  connectionQuality,
  watchdogMs,
}: {
  release: DiscogsRelease | null;
  tracks: DiscogsTrack[];
  activeTrackIndex: number;
  previewVideo: DiscogsVideo | null;
  youtubeVideoId?: string | null;
  userYoutubeOverrideId?: string | null;
  discogsMatchedYoutubeId?: string | null;
  connectionQuality?: string;
  watchdogMs?: number;
}): PlaybackSkipSentryDetails => {
  if (previewVideo?.title?.trim()) {
    return definedProps({
      isPreviewVideo: true,
      previewVideoTitle: previewVideo.title.trim(),
      releaseId: release?.basic_information.id,
      releaseTitle: release?.basic_information.title?.trim(),
      artist: release ? formatArtistNames(release) : undefined,
      instanceId: release?.instance_id,
      youtubeVideoId,
      userYoutubeOverrideId,
      discogsMatchedYoutubeId,
      connectionQuality,
      watchdogMs,
    });
  }

  const track = tracks[activeTrackIndex];
  const trackPosition = track?.position?.trim() ?? "";
  const trackTitle = track?.title?.trim() ?? "";
  const instanceId = release?.instance_id;
  const trackKey =
    instanceId && trackPosition
      ? buildTrackKey(instanceId, trackPosition)
      : undefined;

  return definedProps({
    releaseId: release?.basic_information.id,
    releaseTitle: release?.basic_information.title?.trim(),
    artist: release ? formatArtistNames(release) : undefined,
    instanceId,
    trackPosition: trackPosition || undefined,
    trackTitle: trackTitle || undefined,
    trackKey,
    youtubeVideoId,
    userYoutubeOverrideId,
    discogsMatchedYoutubeId,
    connectionQuality,
    watchdogMs,
  });
};
