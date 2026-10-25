import type { DiscogsRelease, DiscogsTrack, DiscogsVideo } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { isSameReleaseInstance } from "src/utils/releaseNotes";
import { flattenTracklist } from "src/utils/releasePlayback";

export const readReleaseEmbeddedTracklist = (
  release: DiscogsRelease,
): DiscogsTrack[] => {
  const tracklist: unknown = release.tracklist;

  if (!Array.isArray(tracklist)) {
    return [];
  }

  return flattenTracklist(tracklist as DiscogsTrack[]);
};

export const readReleaseEmbeddedVideos = (
  release: DiscogsRelease,
): DiscogsVideo[] => {
  const videos: unknown = release.videos;

  return Array.isArray(videos) ? (videos as DiscogsVideo[]) : [];
};

export const resolveQueueItemEmbedTracksVideos = ({
  item,
  currentRelease,
  currentTracks,
  currentVideos,
  cachedReleaseDetail,
}: {
  item: PlaybackQueueItem;
  currentRelease: DiscogsRelease | null;
  currentTracks: DiscogsTrack[];
  currentVideos: DiscogsVideo[];
  cachedReleaseDetail: DiscogsReleaseDetail | null | undefined;
}): { tracks: DiscogsTrack[]; videos: DiscogsVideo[] } => {
  if (isSameReleaseInstance(currentRelease, item.release)) {
    return { tracks: currentTracks, videos: currentVideos };
  }

  if (cachedReleaseDetail) {
    return {
      tracks: flattenTracklist(cachedReleaseDetail.tracklist ?? []),
      videos: cachedReleaseDetail.videos ?? [],
    };
  }

  const embeddedTracks = readReleaseEmbeddedTracklist(item.release);

  if (embeddedTracks.length > 0) {
    return {
      tracks: embeddedTracks,
      videos: readReleaseEmbeddedVideos(item.release),
    };
  }

  return { tracks: [], videos: [] };
};
