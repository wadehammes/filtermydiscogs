import type { QueryClient } from "@tanstack/react-query";
import type { DiscogsRelease } from "src/types";
import { prefetchDiscogsReleaseQuery } from "src/utils/prefetchDiscogsReleaseQuery";

export const prefetchReleaseOpenData = (
  queryClient: QueryClient,
  release: DiscogsRelease,
): void => {
  prefetchDiscogsReleaseQuery(queryClient, release);
};
