import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { fetchDiscogsCollection } from "src/api/helpers";
import { COLLECTION_PAGE_SIZE } from "src/constants/collection";
import { DiscogsCollectionQueryKeys } from "src/hooks/queries/querykeys.constants";
import type { DiscogsCollection } from "src/types";
import {
  clearPersistedCollectionCache,
  type PersistedCollectionCache,
  readPersistedCollectionCache,
  writePersistedCollectionCache,
} from "src/utils/collectionCacheStorage";
import { persistCollectionItemCount } from "src/utils/collectionItemCountStorage";
import type { CollectionPageParam } from "src/utils/collectionPagination";

const cacheLoadPromises = new Map<
  string,
  Promise<PersistedCollectionCache | null>
>();
const preparePromises = new Map<
  string,
  Promise<CollectionCachePrepareResult>
>();
const validatePromises = new Map<string, Promise<boolean>>();

export interface CollectionCachePrepareResult {
  hydratedFromCache: boolean;
}

function normalizeCollectionCacheUsername(username: string): string {
  return username.trim().toLowerCase();
}

function loadPersistedCollectionCache(
  username: string,
): Promise<PersistedCollectionCache | null> {
  const cacheKey = normalizeCollectionCacheUsername(username);
  const existing = cacheLoadPromises.get(cacheKey);
  if (existing) {
    return existing;
  }

  const promise = readPersistedCollectionCache(username);
  cacheLoadPromises.set(cacheKey, promise);
  return promise;
}

export function resetCollectionCacheReady(username: string): void {
  const cacheKey = normalizeCollectionCacheUsername(username);
  cacheLoadPromises.delete(cacheKey);
  preparePromises.delete(cacheKey);
  validatePromises.delete(cacheKey);
}

export function hydrateCollectionQueryFromCache(
  queryClient: QueryClient,
  username: string,
  cached: PersistedCollectionCache,
): void {
  const data: InfiniteData<DiscogsCollection, CollectionPageParam> = {
    pages: cached.pages,
    pageParams: cached.pageParams,
  };

  queryClient.setQueryData(
    DiscogsCollectionQueryKeys.byUsername(username),
    data,
  );
}

export async function validatePersistedCollectionCache(
  queryClient: QueryClient,
  username: string,
  cached: PersistedCollectionCache,
): Promise<boolean> {
  try {
    const page = await fetchDiscogsCollection({
      username,
      page: 1,
      perPage: COLLECTION_PAGE_SIZE,
    });

    if (page.pagination.items === cached.totalItems) {
      return true;
    }

    persistCollectionItemCount(username, page.pagination.items);
  } catch {
    return false;
  }

  await clearPersistedCollectionCache(username);
  resetCollectionCacheReady(username);
  queryClient.removeQueries({
    queryKey: DiscogsCollectionQueryKeys.byUsername(username),
  });
  return false;
}

export async function prepareCollectionQueryFromCache(
  queryClient: QueryClient,
  username: string,
): Promise<CollectionCachePrepareResult> {
  const cacheKey = normalizeCollectionCacheUsername(username);
  const existing = preparePromises.get(cacheKey);
  if (existing) {
    return existing;
  }

  const promise = (async (): Promise<CollectionCachePrepareResult> => {
    const cached = await loadPersistedCollectionCache(username);
    if (!cached) {
      return { hydratedFromCache: false };
    }

    const cacheStillValid = await validatePersistedCollectionCache(
      queryClient,
      username,
      cached,
    );

    if (!cacheStillValid) {
      return { hydratedFromCache: false };
    }

    hydrateCollectionQueryFromCache(queryClient, username, cached);
    return { hydratedFromCache: true };
  })();

  preparePromises.set(cacheKey, promise);
  return promise;
}

export async function ensureCollectionCacheHydrated(
  queryClient: QueryClient,
  username: string,
): Promise<boolean> {
  const cached = await loadPersistedCollectionCache(username);
  if (!cached) {
    return false;
  }

  hydrateCollectionQueryFromCache(queryClient, username, cached);
  return true;
}

export async function ensureCollectionCacheValidated(
  queryClient: QueryClient,
  username: string,
): Promise<boolean> {
  const cacheKey = normalizeCollectionCacheUsername(username);
  const existing = validatePromises.get(cacheKey);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    const cached = await loadPersistedCollectionCache(username);
    if (!cached) {
      return false;
    }

    return validatePersistedCollectionCache(queryClient, username, cached);
  })();

  validatePromises.set(cacheKey, promise);
  return promise;
}

export async function persistCollectionQueryToCache(
  username: string,
  pages: DiscogsCollection[],
  pageParams: CollectionPageParam[],
): Promise<void> {
  if (pages.length === 0 || pageParams.length === 0) {
    return;
  }

  const lastPage = pages.at(-1);
  const totalItems = lastPage?.pagination?.items;
  if (typeof totalItems !== "number" || !Number.isFinite(totalItems)) {
    return;
  }

  await writePersistedCollectionCache(username, {
    pages,
    pageParams,
    totalItems,
    fetchedAt: Date.now(),
  });
}
