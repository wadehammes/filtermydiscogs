"use client";

import { Suspense, useEffect } from "react";
import {
  dismissCollectionLoadingToast,
  resolveCollectionTotalItems,
  showCollectionLoadingToast,
} from "src/components/CollectionLoadingToast/collectionLoadingToast";
import { isLargeCollection } from "src/constants/collection";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { useCollectionLoadState } from "src/hooks/useCollectionData.hook";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";

const CollectionLoadingToastInner = () => {
  const {
    state: { username, isAuthenticated, isCheckingAuth },
  } = useAuth();
  const {
    state: { collection, error },
  } = useCollectionContext();
  const { isLoading: isCollectionPaginationLoading } = useCollectionLoadState();
  const allReleases = useAllReleases();

  useEffect(() => {
    const shouldTrackLoading = isAuthenticated && !isCheckingAuth && !error;
    const totalItems = resolveCollectionTotalItems(username, collection);
    const isLargeLoad = totalItems !== null && isLargeCollection(totalItems);

    if (!(shouldTrackLoading && isCollectionPaginationLoading && isLargeLoad)) {
      dismissCollectionLoadingToast();
      return;
    }

    showCollectionLoadingToast({
      loadedCount: allReleases.length,
      totalItems,
    });
  }, [
    allReleases.length,
    collection,
    error,
    isCollectionPaginationLoading,
    isAuthenticated,
    isCheckingAuth,
    username,
  ]);

  return null;
};

export const CollectionLoadingToast = () => (
  <Suspense fallback={null}>
    <CollectionLoadingToastInner />
  </Suspense>
);
