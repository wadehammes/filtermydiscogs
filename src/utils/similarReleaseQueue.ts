import type { QueryClient } from "@tanstack/react-query";
import type { DiscogsRelease } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import {
  fetchDiscogsReleaseDetailsIntoCache,
  readDiscogsReleaseDetailFromCache,
} from "src/utils/discogsReleaseBatchCache";
import { buildFullPlayableAlbumQueue } from "src/utils/playbackQueue";
import { parseReleaseId } from "src/utils/releaseNotes";
import { flattenTracklist } from "src/utils/releasePlayback";

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

  await fetchDiscogsReleaseDetailsIntoCache(queryClient, [...releaseIds]);
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

      const detail = readDiscogsReleaseDetailFromCache(
        queryClient,
        String(releaseId),
      );

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
