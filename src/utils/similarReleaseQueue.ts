import type { QueryClient } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { DiscogsReleaseQueryKeys } from "src/hooks/queries/querykeys.constants";
import type { DiscogsRelease, DiscogsReleaseDetail } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { buildFullPlayableAlbumQueue } from "src/utils/playbackQueue";
import { parseReleaseId } from "src/utils/releaseNotes";
import { flattenTracklist } from "src/utils/releasePlayback";

const getUncachedReleaseIds = (
  queryClient: QueryClient,
  releaseIds: string[],
) =>
  releaseIds.filter(
    (releaseId) =>
      queryClient.getQueryData(DiscogsReleaseQueryKeys.byId(releaseId)) ===
      undefined,
  );

const seedReleaseDetailCache = (
  queryClient: QueryClient,
  releases: Record<string, DiscogsReleaseDetail>,
) => {
  for (const [releaseId, detail] of Object.entries(releases)) {
    queryClient.setQueryData(DiscogsReleaseQueryKeys.byId(releaseId), detail);
  }
};

const getCachedReleaseDetail = (queryClient: QueryClient, releaseId: string) =>
  queryClient.getQueryData<DiscogsReleaseDetail>(
    DiscogsReleaseQueryKeys.byId(releaseId),
  );

export const prefetchSimilarReleaseDetails = async ({
  similarReleases,
  queryClient,
}: {
  similarReleases: DiscogsRelease[];
  queryClient: QueryClient;
}): Promise<void> => {
  const releaseIds = new Set<string>();

  for (const release of similarReleases) {
    const releaseId = parseReleaseId(release);

    if (releaseId !== null) {
      releaseIds.add(String(releaseId));
    }
  }

  const idsToFetch = getUncachedReleaseIds(queryClient, [...releaseIds]);

  if (idsToFetch.length === 0) {
    return;
  }

  const batchReleases = await api.discogsReleaseBatch(idsToFetch);
  seedReleaseDetailCache(queryClient, batchReleases ?? {});
};

export const fetchPlayableQueuesForSimilarReleases = async ({
  similarReleases,
  queryClient,
}: {
  similarReleases: DiscogsRelease[];
  queryClient: QueryClient;
}): Promise<PlaybackQueueItem[][]> => {
  await prefetchSimilarReleaseDetails({ similarReleases, queryClient });

  return Promise.all(
    similarReleases.map(async (similarRelease) => {
      const releaseId = parseReleaseId(similarRelease);

      if (releaseId === null) {
        return [];
      }

      const detail = getCachedReleaseDetail(queryClient, String(releaseId));

      if (!detail) {
        return [];
      }

      try {
        return buildFullPlayableAlbumQueue({
          release: similarRelease,
          tracks: flattenTracklist(detail.tracklist ?? []),
          videos: detail.videos ?? [],
        });
      } catch {
        return [];
      }
    }),
  );
};
