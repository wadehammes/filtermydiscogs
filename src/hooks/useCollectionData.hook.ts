import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ERROR_FETCHING } from "src/constants";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes } from "src/context/filters.context";
import { DiscogsCollectionQueryKeys } from "src/hooks/queries/querykeys.constants";
import { useDiscogsCollectionQuery } from "src/hooks/queries/useDiscogsCollectionQuery";
import { useFiltersDispatch } from "src/hooks/useFilterAtoms.hook";

export const useCollectionData = (
  username: string | null,
  isAuthenticated: boolean,
  rateLimited = false,
) => {
  const queryClient = useQueryClient();
  const { dispatchFetchingCollection, dispatchCollection, dispatchError } =
    useCollectionContext();

  const filtersDispatch = useFiltersDispatch();

  const queryEnabled = isAuthenticated && !!username && !rateLimited;

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
    enabled: queryEnabled,
  });

  // Only invalidate queries when username actually changes, not on every auth check
  const prevUsernameRef = useRef<string | null>(null);
  useEffect(() => {
    if (isAuthenticated && username && username !== prevUsernameRef.current) {
      prevUsernameRef.current = username;
      queryClient.invalidateQueries({
        queryKey: DiscogsCollectionQueryKeys.byUsername(username),
      });
    }
  }, [isAuthenticated, username, queryClient]);

  useEffect(() => {
    if (isAuthenticated && username && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [
    isAuthenticated,
    username,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  const processedData = useMemo(() => {
    if (!collectionData?.pages) return null;

    const pages = collectionData.pages;
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

  const handleDataUpdate = useCallback(() => {
    if (processedData) {
      const { allReleases, collection } = processedData;

      if (collection) {
        dispatchCollection(collection);
      }
      dispatchFetchingCollection(false);
      dispatchError(null);

      filtersDispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: allReleases,
      });
    } else if (!queryEnabled) {
      dispatchFetchingCollection(false);
      filtersDispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: [],
      });
    } else if (isError) {
      dispatchFetchingCollection(false);
      dispatchError(queryError?.message || ERROR_FETCHING);
    } else if (isLoading) {
      dispatchFetchingCollection(true);
    }
  }, [
    processedData,
    queryEnabled,
    isError,
    isLoading,
    queryError,
    dispatchCollection,
    dispatchFetchingCollection,
    dispatchError,
    filtersDispatch,
  ]);

  useEffect(() => {
    handleDataUpdate();
  }, [handleDataUpdate]);

  return {
    isLoading,
    isError,
    queryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};
