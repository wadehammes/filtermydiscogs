import type { QueryClient } from "@tanstack/react-query";
import { prefetchReleaseModal } from "src/components/ReleaseModal/prefetchReleaseModal";
import { DiscogsReleaseQueryKeys } from "src/hooks/queries/querykeys.constants";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import type { DiscogsRelease } from "src/types";
import { parseReleaseId } from "src/utils/releaseNotes";
import { cancelInFlightDiscogsReleasePrefetches } from "src/utils/releaseOpenPrefetch";

export interface PrefetchReleaseOpenDataOptions {
  cancelOtherFetches?: boolean;
}

export const prefetchReleaseOpenData = (
  queryClient: QueryClient,
  release: DiscogsRelease,
  options: PrefetchReleaseOpenDataOptions = {},
): void => {
  prefetchReleaseModal();

  const releaseId = parseReleaseId(release);
  if (releaseId === null) {
    return;
  }

  const idString = String(releaseId);
  const releaseQueryKey = DiscogsReleaseQueryKeys.byId(idString);

  if (options.cancelOtherFetches) {
    cancelInFlightDiscogsReleasePrefetches(queryClient, idString);
  }

  const queryState = queryClient.getQueryState(releaseQueryKey);

  if (queryState?.fetchStatus === "fetching") {
    return;
  }

  if (queryClient.getQueryData(releaseQueryKey) === undefined) {
    void queryClient.prefetchQuery(discogsReleaseQueryOptions(idString));
  }
};
