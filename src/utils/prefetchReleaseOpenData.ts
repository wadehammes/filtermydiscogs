import type { QueryClient } from "@tanstack/react-query";
import type { DiscogsRelease } from "src/types";
import { prefetchDiscogsReleaseQuery } from "src/utils/prefetchDiscogsReleaseQuery";
import { prefetchReleaseModalChunk } from "src/utils/prefetchReleaseModalChunk";

export type PrefetchReleaseOpenDataOptions = {
  prefetchModalChunk?: boolean;
};

export const prefetchReleaseOpenData = (
  queryClient: QueryClient,
  release: DiscogsRelease,
  options: PrefetchReleaseOpenDataOptions = {},
): void => {
  const { prefetchModalChunk = true } = options;

  if (prefetchModalChunk) {
    prefetchReleaseModalChunk();
  }

  prefetchDiscogsReleaseQuery(queryClient, release);
};
