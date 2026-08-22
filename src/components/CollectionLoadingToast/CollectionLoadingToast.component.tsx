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
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";

const CollectionLoadingToastInner = () => {
  const {
    state: { username, isAuthenticated, isCheckingAuth },
  } = useAuth();
  const {
    state: { collection, fetchingCollection, error },
  } = useCollectionContext();
  const allReleases = useAllReleases();

  useEffect(() => {
    const shouldTrackLoading = isAuthenticated && !isCheckingAuth && !error;
    const totalItems = resolveCollectionTotalItems(username, collection);
    const isLargeLoad = totalItems !== null && isLargeCollection(totalItems);

    if (!(shouldTrackLoading && fetchingCollection && isLargeLoad)) {
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
    fetchingCollection,
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
