import type { DiscogsRelease, DiscogsTrack, DiscogsVideo } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { isSameReleaseInstance } from "src/utils/releaseNotes";
import { flattenTracklist } from "src/utils/releasePlayback";

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

  if (!cachedReleaseDetail) {
    return { tracks: [], videos: [] };
  }

  return {
    tracks: flattenTracklist(cachedReleaseDetail.tracklist ?? []),
    videos: cachedReleaseDetail.videos ?? [],
  };
};
