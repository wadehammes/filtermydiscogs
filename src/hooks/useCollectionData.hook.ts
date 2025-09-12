import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { ERROR_FETCHING } from "src/constants";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes, useFilters } from "src/context/filters.context";
import { useDiscogsCollectionQuery } from "src/hooks/queries/useDiscogsCollectionQuery";
import type { CollectionPage } from "src/types";

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

  const { state: filtersState, dispatch: filtersDispatch } = useFilters();
  const { selectedSort } = filtersState;

  const queryEnabled = isAuthenticated && !!username;

  const {
    data: collectionData,
    isLoading,
    isError,
    error: queryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDiscogsCollectionQuery(username || "", queryEnabled, selectedSort);

  // Force refetch collection when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && username) {
      queryClient.refetchQueries({
        queryKey: ["discogsCollection", username],
      });
    }
  }, [isAuthenticated, username, queryClient]);

  // Auto-fetch all pages when sort changes to maintain full collection
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

    // Single pass through releases to extract both styles and years
    const uniqueStyles = new Set<string>();
    const uniqueYears = new Set<number>();

    for (const release of allReleases) {
      // Extract styles
      for (const style of release.basic_information.styles) {
        uniqueStyles.add(style);
      }

      // Extract year (filter invalid years)
      const year = release.basic_information.year;
      if (year > 0) {
        uniqueYears.add(year);
      }
    }

    const sortedStyles: string[] = Array.from(uniqueStyles).sort((a, b) =>
      a.localeCompare(b),
    );

    const sortedYears: number[] = Array.from(uniqueYears).sort((a, b) => b - a); // Newest first

    return {
      allReleases,
      collection,
      sortedStyles,
      sortedYears,
    };
  }, [collectionData?.pages]);

  const handleDataUpdate = useCallback(() => {
    if (processedData) {
      const { allReleases, collection, sortedStyles, sortedYears } =
        processedData;

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
      filtersDispatch({
        type: FiltersActionTypes.SetAvailableYears,
        payload: sortedYears,
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
