import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { fetchDiscogsCollection } from "src/api/helpers";
import { COLLECTION_PAGE_SIZE } from "src/constants/collection";
import { DiscogsCollectionQueryKeys } from "src/hooks/queries/querykeys.constants";
import type { DiscogsCollection, DiscogsRelease } from "src/types";
import {
  clearPersistedCollectionCache,
  type PersistedCollectionCache,
  readPersistedCollectionCache,
  writePersistedCollectionCache,
} from "src/utils/collectionCacheStorage";
import { persistCollectionItemCount } from "src/utils/collectionItemCountStorage";
import type { CollectionPageParam } from "src/utils/collectionPagination";
import { patchCollectionPagesReleaseByInstanceId } from "src/utils/collectionReleaseLookup";
import { parseReleaseId } from "src/utils/releaseNotes";

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

export function patchCollectionPagesReleaseRating(
  pages: DiscogsCollection[],
  releaseId: number,
  rating: number,
): DiscogsCollection[] {
  return pages.map((page) => ({
    ...page,
    releases: page.releases.map((release) =>
      parseReleaseId(release) === releaseId ? { ...release, rating } : release,
    ),
  }));
}

export function patchCollectionQueryReleaseRating(
  data: InfiniteData<DiscogsCollection, CollectionPageParam> | undefined,
  releaseId: number,
  rating: number,
): InfiniteData<DiscogsCollection, CollectionPageParam> | undefined {
  if (!data) {
    return data;
  }

  return {
    ...data,
    pages: patchCollectionPagesReleaseRating(data.pages, releaseId, rating),
  };
}

export async function patchPersistedCollectionReleaseRating(
  username: string,
  releaseId: number,
  rating: number,
): Promise<void> {
  const cached = await readPersistedCollectionCache(username);
  if (!cached) {
    return;
  }

  await writePersistedCollectionCache(username, {
    ...cached,
    pages: patchCollectionPagesReleaseRating(cached.pages, releaseId, rating),
    fetchedAt: Date.now(),
  });
}

export function patchCollectionQueryReleaseNotes(
  data: InfiniteData<DiscogsCollection, CollectionPageParam> | undefined,
  instanceId: string,
  notes: DiscogsRelease["notes"],
): InfiniteData<DiscogsCollection, CollectionPageParam> | undefined {
  if (!data) {
    return data;
  }

  return {
    ...data,
    pages: patchCollectionPagesReleaseByInstanceId(data.pages, instanceId, {
      notes: notes ?? [],
    }),
  };
}

export async function patchPersistedCollectionReleaseNotes(
  username: string,
  instanceId: string,
  notes: DiscogsRelease["notes"],
): Promise<void> {
  const cached = await readPersistedCollectionCache(username);
  if (!cached) {
    return;
  }

  await writePersistedCollectionCache(username, {
    ...cached,
    pages: patchCollectionPagesReleaseByInstanceId(cached.pages, instanceId, {
      notes: notes ?? [],
    }),
    fetchedAt: Date.now(),
  });
}
