import type { QueryClient } from "@tanstack/react-query";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import type { DiscogsRelease } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import {
  buildFullPlayableAlbumQueue,
  createQueueItem,
  shuffleQueueItems,
} from "src/utils/playbackQueue";
import { parseReleaseId } from "src/utils/releaseNotes";
import {
  buildReleasePlaybackMatchIndex,
  flattenTracklist,
  parseYoutubeVideoId,
} from "src/utils/releasePlayback";

export type CollectionRadioStartPlan = {
  startItem: PlaybackQueueItem;
  upcomingItems: PlaybackQueueItem[];
};

export const shouldShowCollectionRadioPlayButton = ({
  hasActiveFilters,
  matchingViewActive,
  matchingReleaseCount,
}: {
  hasActiveFilters: boolean;
  matchingViewActive: boolean;
  matchingReleaseCount: number;
}): boolean =>
  matchingReleaseCount > 0 && (hasActiveFilters || matchingViewActive);

export const resolveIsCollectionRadioSelectionStale = ({
  isCollectionRadioSession,
  sessionReleaseIdsKey,
  currentReleaseIdsKey,
}: {
  isCollectionRadioSession: boolean;
  sessionReleaseIdsKey: string | null;
  currentReleaseIdsKey: string;
}): boolean =>
  isCollectionRadioSession &&
  sessionReleaseIdsKey !== null &&
  sessionReleaseIdsKey !== currentReleaseIdsKey;

export const attachDiscogsReleaseDetailPlaybackFields = (
  release: DiscogsRelease,
  detail: Pick<DiscogsReleaseDetail, "tracklist" | "videos">,
): DiscogsRelease => ({
  ...release,
  tracklist: detail.tracklist ?? [],
  videos: detail.videos ?? [],
});

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

export const markCollectionRadioQueueItems = (
  items: PlaybackQueueItem[],
): PlaybackQueueItem[] =>
  items.map((item) => ({
    ...item,
    fromCollectionRadio: true,
  }));

export const listPlayableTrackQueueItemsFromDetail = (
  release: DiscogsRelease,
  detail: Pick<DiscogsReleaseDetail, "tracklist" | "videos">,
): PlaybackQueueItem[] => {
  const playbackRelease = attachDiscogsReleaseDetailPlaybackFields(
    release,
    detail,
  );
  const tracks = flattenTracklist(detail.tracklist ?? []);
  const matchIndex = buildReleasePlaybackMatchIndex(
    tracks,
    detail.videos ?? [],
  );

  return tracks
    .filter((track) => matchIndex.trackVideoByPosition.has(track.position))
    .map((track) => {
      const video = matchIndex.trackVideoByPosition.get(track.position);
      const youtubeVideoId = video ? parseYoutubeVideoId(video.uri) : null;

      return createQueueItem({
        release: playbackRelease,
        trackPosition: track.position,
        trackTitle: track.title,
        ...(youtubeVideoId ? { youtubeVideoId } : {}),
      });
    });
};

export const shuffleCollectionRadioQueueFromDetails = (
  orderedReleases: DiscogsRelease[],
  releaseDetails: Array<{
    release: DiscogsRelease;
    detail: Pick<DiscogsReleaseDetail, "tracklist" | "videos">;
  }>,
  shuffleItems: <T>(items: readonly T[]) => T[] = shuffleQueueItems,
): PlaybackQueueItem[] => {
  const detailByInstanceId = new Map(
    releaseDetails.map(({ release, detail }) => [
      String(release.instance_id),
      detail,
    ]),
  );
  const pool: PlaybackQueueItem[] = [];

  for (const release of orderedReleases) {
    const detail = detailByInstanceId.get(String(release.instance_id));

    if (!detail) {
      continue;
    }

    pool.push(...listPlayableTrackQueueItemsFromDetail(release, detail));
  }

  if (pool.length === 0) {
    return [];
  }

  return markCollectionRadioQueueItems(shuffleItems(pool));
};

export const collectCollectionRadioReleaseIds = (
  releases: DiscogsRelease[],
): number[] =>
  releases.flatMap((release) => {
    const releaseId = parseReleaseId(release);

    return releaseId === null ? [] : [releaseId];
  });

export const areCollectionRadioReleaseDetailsCached = (
  queryClient: QueryClient,
  releases: DiscogsRelease[],
): boolean => {
  const releaseIds = collectCollectionRadioReleaseIds(releases);

  if (releaseIds.length === 0) {
    return false;
  }

  return releaseIds.every((releaseId) => {
    const queryKey = discogsReleaseQueryOptions(String(releaseId)).queryKey;

    return queryClient.getQueryData(queryKey) !== undefined;
  });
};

export const buildReleaseDetailsFromQueryCache = (
  queryClient: QueryClient,
  releases: DiscogsRelease[],
): Array<{
  release: DiscogsRelease;
  detail: DiscogsReleaseDetail;
}> | null => {
  const releaseDetails: Array<{
    release: DiscogsRelease;
    detail: DiscogsReleaseDetail;
  }> = [];

  for (const release of releases) {
    const releaseId = parseReleaseId(release);

    if (releaseId === null) {
      continue;
    }

    const detail = queryClient.getQueryData<DiscogsReleaseDetail>(
      discogsReleaseQueryOptions(String(releaseId)).queryKey,
    );

    if (detail === undefined) {
      return null;
    }

    releaseDetails.push({ release, detail });
  }

  return releaseDetails;
};

export const planShuffledCollectionRadioStart = (
  shuffledItems: PlaybackQueueItem[],
): CollectionRadioStartPlan | null => {
  if (shuffledItems.length === 0) {
    return null;
  }

  const [startItem, ...upcomingItems] = shuffledItems;

  if (!startItem) {
    return null;
  }

  return { startItem, upcomingItems };
};
