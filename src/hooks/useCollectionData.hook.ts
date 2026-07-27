import { useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useEffect, useMemo, useRef } from "react";
import { collectionFiltersActiveAtom } from "src/atoms/filters.atoms";
import { ERROR_FETCHING } from "src/constants";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes } from "src/context/filters.context";
import { DiscogsCollectionQueryKeys } from "src/hooks/queries/querykeys.constants";
import { useDiscogsCollectionQuery } from "src/hooks/queries/useDiscogsCollectionQuery";
import { useFiltersDispatch } from "src/hooks/useFilterAtoms.hook";
import { getEffectiveCollectionPages } from "src/utils/collectionPagination";

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
  const { dispatchFetchingCollection, dispatchCollection, dispatchError } =
    useCollectionContext();

  const filtersDispatch = useFiltersDispatch();
  const setCollectionFiltersActive = useSetAtom(collectionFiltersActiveAtom);

  const queryEnabled =
    isAuthenticated && !!username && !rateLimited && !isCheckingAuth;

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

  const prevUsernameRef = useRef<string | null>(null);
  useEffect(() => {
    if (isAuthenticated && username && username !== prevUsernameRef.current) {
      prevUsernameRef.current = username;
      setCollectionFiltersActive(false);
      queryClient.invalidateQueries({
        queryKey: DiscogsCollectionQueryKeys.byUsername(username),
      });
    }
  }, [isAuthenticated, username, queryClient, setCollectionFiltersActive]);

  useEffect(() => {
    if (queryEnabled && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [queryEnabled, hasNextPage, isFetchingNextPage, fetchNextPage]);

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
    queryEnabled &&
    !isLoading &&
    !(hasNextPage || isFetchingNextPage) &&
    !!processedData;

  useEffect(() => {
    if (!queryEnabled) {
      dispatchFetchingCollection(false);
      setCollectionFiltersActive(false);
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

      if (collection) {
        dispatchCollection(collection);
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
