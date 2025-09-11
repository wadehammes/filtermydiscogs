import { useQueryClient } from "@tanstack/react-query";
import flatten from "lodash.flatten";
import { useCallback, useEffect, useMemo } from "react";
import { ERROR_FETCHING } from "src/constants";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes, useFilters } from "src/context/filters.context";
import { useDiscogsCollectionQuery } from "src/hooks/queries/useDiscogsCollectionQuery";
import type { CollectionPage, DiscogsRelease } from "src/types";

export const useCollectionData = (
  username: string | null,
  isAuthenticated: boolean,
) => {
  const queryClient = useQueryClient();
  const {
    dispatchFetchingCollection,
    dispatchCollection,
    dispatchReleases,
    dispatchError,
  } = useCollectionContext();

  const { dispatch: filtersDispatch } = useFilters();

  const queryEnabled = isAuthenticated && !!username;

  const {
    data: collectionData,
    isLoading,
    isError,
    error: queryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDiscogsCollectionQuery(username || "", queryEnabled);

  // Force refetch collection when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && username) {
      queryClient.refetchQueries({
        queryKey: ["discogsCollection", username],
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

    const pages = collectionData.pages as CollectionPage[];
    const allReleases = pages.flatMap((page: CollectionPage) => page.releases);
    const collection = pages[pages.length - 1];

    const uniqueStyles = new Set<string>(
      flatten(
        allReleases.map(
          (release: DiscogsRelease) => release.basic_information.styles,
        ),
      ),
    );

    const sortedStyles: string[] = Array.from(uniqueStyles).sort((a, b) =>
      a.localeCompare(b),
    );

    return {
      allReleases,
      collection,
      sortedStyles,
    };
  }, [collectionData?.pages]);

  const handleDataUpdate = useCallback(() => {
    if (processedData) {
      const { allReleases, collection, sortedStyles } = processedData;

      dispatchReleases(allReleases);
      if (collection) {
        dispatchCollection(collection);
      }
      dispatchFetchingCollection(false);
      dispatchError(null);

      filtersDispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: allReleases,
      });
      filtersDispatch({
        type: FiltersActionTypes.SetAvailableStyles,
        payload: sortedStyles,
      });
    } else if (isError) {
      dispatchFetchingCollection(false);
      dispatchError(queryError?.message || ERROR_FETCHING);
    } else if (isLoading) {
      dispatchFetchingCollection(true);
    }
  }, [
    processedData,
    isError,
    isLoading,
    queryError,
    dispatchReleases,
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
