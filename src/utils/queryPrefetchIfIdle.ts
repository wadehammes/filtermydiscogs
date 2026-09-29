import type { QueryClient, QueryKey } from "@tanstack/react-query";

export const isQueryKeyFetching = (
  queryClient: QueryClient,
  queryKey: QueryKey,
): boolean => queryClient.getQueryState(queryKey)?.fetchStatus === "fetching";

export const runQueryPrefetchFireAndForget = (
  run: () => Promise<unknown>,
): void => {
  void run().catch(() => undefined);
};
