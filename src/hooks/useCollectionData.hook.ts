import { useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useEffect, useMemo, useRef } from "react";
import {
  collectionFiltersActiveAtom,
  filtersDispatchAtom,
} from "src/atoms/filters.atoms";
import { ERROR_FETCHING } from "src/constants";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes } from "src/context/filters.context";
import { useSyncCratesMutation } from "src/hooks/mutations/useCrateMutations";
import { DiscogsCollectionQueryKeys } from "src/hooks/queries/querykeys.constants";
import { useDiscogsCollectionQuery } from "src/hooks/queries/useDiscogsCollectionQuery";
import {
  resetCollectionCacheReady,
  useCollectionCacheReady,
} from "src/hooks/useCollectionCacheReady.hook";
import type { DiscogsCollection } from "src/types";
import { persistCollectionQueryToCache } from "src/utils/collectionCacheSync";
import {
  type CollectionPageParam,
  getEffectiveCollectionPages,
} from "src/utils/collectionPagination";
import { prepareCollectionForSync } from "src/utils/syncCollection.helper";
import { toast } from "src/utils/toast";

export interface UseCollectionDataParams {
  username: string | null;
  isAuthenticated: boolean;
  rateLimited?: boolean;
  isCheckingAuth?: boolean;
}

export const useCollectionData = ({
  username,
  isAuthenticated,
  rateLimited = false,
  isCheckingAuth = false,
}: UseCollectionDataParams) => {
  const queryClient = useQueryClient();
  const { state: authState } = useAuth();
  const { dispatchFetchingCollection, dispatchCollection, dispatchError } =
    useCollectionContext();
  const syncMutation = useSyncCratesMutation(authState.userId);
  const { mutate: syncCrates, isPending: isSyncPending } = syncMutation;
  const autoSyncRef = useRef(false);

  const filtersDispatch = useSetAtom(filtersDispatchAtom);
  const setCollectionFiltersActive = useSetAtom(collectionFiltersActiveAtom);
  const lastCollectionRef = useRef<DiscogsCollection | null>(null);

  const queryEnabled =
    isAuthenticated && !!username && !rateLimited && !isCheckingAuth;

  const cacheReady = useCollectionCacheReady({
    username: username || "",
    enabled: queryEnabled,
  });

  const queryFetchEnabled = queryEnabled && cacheReady.ready;

  const {
    data: collectionData,
    isLoading,
    isError,
    error: queryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDiscogsCollectionQuery({
    username: username || "",
    enabled: queryFetchEnabled,
  });

  const prevUsernameRef = useRef<string | null>(null);
  useEffect(() => {
    if (!(isAuthenticated && username)) {
      return;
    }

    const previousUsername = prevUsernameRef.current;
    prevUsernameRef.current = username;

    if (previousUsername === username) {
      return;
    }

    lastCollectionRef.current = null;
    autoSyncRef.current = false;
    setCollectionFiltersActive(false);

    if (previousUsername) {
      resetCollectionCacheReady(previousUsername);
      queryClient.invalidateQueries({
        queryKey: DiscogsCollectionQueryKeys.byUsername(username),
      });
    }
  }, [isAuthenticated, username, queryClient, setCollectionFiltersActive]);

  useEffect(() => {
    if (queryFetchEnabled && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [queryFetchEnabled, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const processedData = useMemo(() => {
    if (!collectionData?.pages) {
      return null;
    }

    const pages = getEffectiveCollectionPages({ pages: collectionData.pages });
    const allReleases = pages.flatMap((page) =>
      page.releases.map((release) => ({
        ...release,
        notes: release.notes ?? [],
      })),
    );
    const collection = pages[pages.length - 1];

    return {
      allReleases,
      collection,
    };
  }, [collectionData?.pages]);

  const isCollectionFullyLoaded =
    queryFetchEnabled &&
    !isLoading &&
    !(hasNextPage || isFetchingNextPage) &&
    !!processedData;

  useEffect(() => {
    if (
      !(
        isCollectionFullyLoaded &&
        username &&
        collectionData?.pages?.length &&
        collectionData.pageParams?.length
      )
    ) {
      return;
    }

    void persistCollectionQueryToCache(
      username,
      collectionData.pages,
      collectionData.pageParams as CollectionPageParam[],
    );
  }, [
    collectionData?.pageParams,
    collectionData?.pages,
    isCollectionFullyLoaded,
    username,
  ]);

  useEffect(() => {
    if (
      !(
        cacheReady.hydratedFromCache &&
        isCollectionFullyLoaded &&
        username &&
        !rateLimited
      ) ||
      autoSyncRef.current ||
      isSyncPending
    ) {
      return;
    }

    const syncResult = prepareCollectionForSync(
      collectionData,
      hasNextPage,
      isFetchingNextPage,
    );

    if (!(syncResult.isValid && syncResult.instanceIds)) {
      return;
    }

    autoSyncRef.current = true;

    syncCrates(
      { collectionInstanceIds: syncResult.instanceIds },
      {
        onSuccess: (data) => {
          if (data.removedCount > 0) {
            toast.success(
              `Sync complete: Removed ${data.removedCount} release${data.removedCount !== 1 ? "s" : ""} from your crates.`,
            );
          }
        },
      },
    );
  }, [
    cacheReady.hydratedFromCache,
    collectionData,
    hasNextPage,
    isCollectionFullyLoaded,
    isFetchingNextPage,
    isSyncPending,
    rateLimited,
    syncCrates,
    username,
  ]);

  useEffect(() => {
    if (!queryEnabled) {
      dispatchFetchingCollection(false);
      setCollectionFiltersActive(false);
      lastCollectionRef.current = null;
      filtersDispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: [],
      });
      return;
    }

    if (isError) {
      dispatchFetchingCollection(false);
      dispatchError(queryError?.message || ERROR_FETCHING);
      return;
    }

    if (processedData) {
      const { allReleases, collection } = processedData;

      if (collection && collection !== lastCollectionRef.current) {
        dispatchCollection(collection);
        lastCollectionRef.current = collection;
      }

      filtersDispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: allReleases,
      });

      if (isCollectionFullyLoaded) {
        dispatchFetchingCollection(false);
        dispatchError(null);
        setCollectionFiltersActive(true);
      } else {
        dispatchFetchingCollection(true);
        setCollectionFiltersActive(false);
      }
      return;
    }

    if (isLoading) {
      dispatchFetchingCollection(true);
      setCollectionFiltersActive(false);
    }
  }, [
    isCollectionFullyLoaded,
    processedData,
    queryEnabled,
    isError,
    isLoading,
    queryError,
    dispatchCollection,
    dispatchFetchingCollection,
    dispatchError,
    filtersDispatch,
    setCollectionFiltersActive,
  ]);

  return {
    isLoading,
    isError,
    queryError,
    hasNextPage,
    isFetchingNextPage,
  };
};

export const useCollectionLoadState = () => {
  const { state: authState } = useAuth();
  const { username, isAuthenticated, rateLimited, isCheckingAuth } = authState;

  const queryEnabled =
    isAuthenticated && !!username && !rateLimited && !isCheckingAuth;

  const query = useDiscogsCollectionQuery({
    username: username || "",
    enabled: false,
  });

  const hasLoadedPages = (query.data?.pages.length ?? 0) > 0;

  return {
    isLoading: queryEnabled && !hasLoadedPages && !query.isError,
    isError: query.isError,
    queryError: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
};
