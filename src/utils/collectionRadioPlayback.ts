import type { CollectionRadioSession } from "src/atoms/collectionRadioPlayback.atoms";
import type { DiscogsRelease } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { buildFullPlayableAlbumQueue } from "src/utils/playbackQueue";
import { flattenTracklist } from "src/utils/releasePlayback";

export type CollectionRadioStartPlan = {
  startItem: PlaybackQueueItem;
  upcomingItems: PlaybackQueueItem[];
};

export const shouldShowCollectionRadioPlayButton = ({
  hasActiveFilters,
  matchingViewActive,
}: {
  hasActiveFilters: boolean;
  matchingViewActive: boolean;
}): boolean => hasActiveFilters || matchingViewActive;

export const planCollectionRadioStartFromDetail = (
  release: DiscogsRelease,
  detail: Pick<DiscogsReleaseDetail, "tracklist" | "videos">,
): CollectionRadioStartPlan | null => {
  const tracks = flattenTracklist(detail.tracklist ?? []);
  const albumQueue = buildFullPlayableAlbumQueue({
    release,
    tracks,
    videos: detail.videos ?? [],
  });

  if (albumQueue.length === 0) {
    return null;
  }

  const [startItem, ...upcomingItems] = albumQueue;

  if (!startItem) {
    return null;
  }

  return { startItem, upcomingItems };
};

export const createCollectionRadioSession = (
  orderedReleases: DiscogsRelease[],
  nextReleaseIndex: number,
): CollectionRadioSession => ({
  orderedReleases,
  nextReleaseIndex,
});

export const markCollectionRadioQueueItems = (
  items: PlaybackQueueItem[],
): PlaybackQueueItem[] =>
  items.map((item) => ({
    ...item,
    fromCollectionRadio: true,
  }));

export const planCollectionRadioAlbumQueueFromDetail = (
  release: DiscogsRelease,
  detail: Pick<DiscogsReleaseDetail, "tracklist" | "videos">,
): PlaybackQueueItem[] => {
  const tracks = flattenTracklist(detail.tracklist ?? []);
  const albumQueue = buildFullPlayableAlbumQueue({
    release,
    tracks,
    videos: detail.videos ?? [],
  });

  return markCollectionRadioQueueItems(albumQueue);
};
