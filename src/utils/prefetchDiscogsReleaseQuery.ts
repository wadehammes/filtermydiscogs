import type { QueryClient } from "@tanstack/react-query";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import type { DiscogsRelease } from "src/types";
import {
  isQueryKeyFetching,
  runQueryPrefetchFireAndForget,
} from "src/utils/queryPrefetchIfIdle";
import { parseReleaseId } from "src/utils/releaseNotes";

export const prefetchDiscogsReleaseQuery = (
  queryClient: QueryClient,
  release: DiscogsRelease,
): void => {
  const releaseId = parseReleaseId(release);
  if (releaseId === null) {
    return;
  }

  const releaseQuery = discogsReleaseQueryOptions(String(releaseId));

  if (isQueryKeyFetching(queryClient, releaseQuery.queryKey)) {
    return;
  }

  if (queryClient.getQueryData(releaseQuery.queryKey) === undefined) {
    runQueryPrefetchFireAndForget(() =>
      queryClient.prefetchQuery(releaseQuery),
    );
  }
};
