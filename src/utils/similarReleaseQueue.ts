import type { QueryClient } from "@tanstack/react-query";
import { fetchDiscogsRelease } from "src/api/helpers";
import { DiscogsReleaseQueryKeys } from "src/hooks/queries/querykeys.constants";
import type { DiscogsRelease } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { buildFullPlayableAlbumQueue } from "src/utils/playbackQueue";
import { parseReleaseId } from "src/utils/releaseNotes";
import { flattenTracklist } from "src/utils/releasePlayback";

const RELEASE_DETAIL_STALE_MS = 5 * 60 * 1000;

const fetchReleaseDetail = (queryClient: QueryClient, releaseId: string) =>
  queryClient.fetchQuery({
    queryKey: DiscogsReleaseQueryKeys.byId(releaseId),
    queryFn: () => fetchDiscogsRelease(releaseId),
    staleTime: RELEASE_DETAIL_STALE_MS,
  });

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

  await Promise.all(
    [...releaseIds].map((releaseId) =>
      fetchReleaseDetail(queryClient, releaseId).catch(() => undefined),
    ),
  );
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

      try {
        const detail = await fetchReleaseDetail(queryClient, String(releaseId));

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
