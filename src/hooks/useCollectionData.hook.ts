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
import { DiscogsCollectionQueryKeys } from "src/hooks/queries/querykeys.constants";
import { useDiscogsCollectionQuery } from "src/hooks/queries/useDiscogsCollectionQuery";
import type { DiscogsCollection } from "src/types";
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

  const filtersDispatch = useSetAtom(filtersDispatchAtom);
  const setCollectionFiltersActive = useSetAtom(collectionFiltersActiveAtom);
  const lastAllReleasesCountRef = useRef(0);
  const lastCollectionRef = useRef<DiscogsCollection | null>(null);

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
      lastAllReleasesCountRef.current = 0;
      lastCollectionRef.current = null;
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
      lastAllReleasesCountRef.current = 0;
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

      if (allReleases.length !== lastAllReleasesCountRef.current) {
        filtersDispatch({
          type: FiltersActionTypes.SetAllReleases,
          payload: allReleases,
        });
        lastAllReleasesCountRef.current = allReleases.length;
      }

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
    enabled: queryEnabled,
  });

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    queryError: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
};
