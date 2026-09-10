import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";
import {
  prepareCollectionQueryFromCache,
  resetCollectionCacheReady as resetCollectionCachePrepareState,
} from "src/utils/collectionCacheSync";

export interface UseCollectionCacheReadyParams {
  username: string;
  enabled: boolean;
}

export interface CollectionCacheReadyState {
  ready: boolean;
  hydratedFromCache: boolean;
}

const INITIAL_CACHE_READY_STATE: CollectionCacheReadyState = {
  ready: false,
  hydratedFromCache: false,
};

const cacheReadyByUsername = new Map<string, CollectionCacheReadyState>();
const cacheReadySubscribers = new Set<() => void>();

function normalizeCacheReadyUsername(username: string): string {
  return username.trim().toLowerCase();
}

function notifyCacheReadySubscribers() {
  for (const subscriber of cacheReadySubscribers) {
    subscriber();
  }
}

function getCacheReadySnapshot(
  username: string,
  enabled: boolean,
): CollectionCacheReadyState {
  if (!(enabled && username)) {
    return INITIAL_CACHE_READY_STATE;
  }

  return (
    cacheReadyByUsername.get(normalizeCacheReadyUsername(username)) ??
    INITIAL_CACHE_READY_STATE
  );
}

function setSharedCacheReadyState(
  username: string,
  state: CollectionCacheReadyState,
) {
  cacheReadyByUsername.set(normalizeCacheReadyUsername(username), state);
  notifyCacheReadySubscribers();
}

function subscribeToCacheReady(onStoreChange: () => void) {
  cacheReadySubscribers.add(onStoreChange);
  return () => {
    cacheReadySubscribers.delete(onStoreChange);
  };
}

export const useCollectionCacheReady = ({
  username,
  enabled,
}: UseCollectionCacheReadyParams): CollectionCacheReadyState => {
  const queryClient = useQueryClient();

  const state = useSyncExternalStore(
    subscribeToCacheReady,
    () => getCacheReadySnapshot(username, enabled),
    () => getCacheReadySnapshot(username, enabled),
  );

  useEffect(() => {
    if (!(enabled && username)) {
      return;
    }

    const cacheKey = normalizeCacheReadyUsername(username);
    const existingState = cacheReadyByUsername.get(cacheKey);
    if (existingState?.ready) {
      return;
    }

    void prepareCollectionQueryFromCache(queryClient, username)
      .then((result) => {
        setSharedCacheReadyState(username, {
          ready: true,
          hydratedFromCache: result.hydratedFromCache,
        });
      })
      .catch(() => {
        setSharedCacheReadyState(username, {
          ready: true,
          hydratedFromCache: false,
        });
      });
  }, [enabled, queryClient, username]);

  return state;
};

export function resetCollectionCacheReady(username: string): void {
  resetCollectionCachePrepareState(username);
  cacheReadyByUsername.delete(normalizeCacheReadyUsername(username));
  notifyCacheReadySubscribers();
}
