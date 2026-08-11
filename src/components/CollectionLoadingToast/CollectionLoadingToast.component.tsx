"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";
import {
  dismissCollectionLoadingToast,
  showCollectionLoadingToast,
} from "src/components/CollectionLoadingToast/collectionLoadingToast";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";

const CollectionLoadingToastInner = () => {
  const pathname = usePathname();
  const {
    state: { isAuthenticated, isCheckingAuth },
  } = useAuth();
  const {
    state: { fetchingCollection, error },
  } = useCollectionContext();
  const allReleases = useAllReleases();

  useEffect(() => {
    const shouldTrackLoading =
      isAuthenticated && !isCheckingAuth && !error && pathname !== "/releases";

    if (!(shouldTrackLoading && fetchingCollection)) {
      dismissCollectionLoadingToast();
      return;
    }

    showCollectionLoadingToast(allReleases.length);
  }, [
    allReleases.length,
    error,
    fetchingCollection,
    isAuthenticated,
    isCheckingAuth,
    pathname,
  ]);

  return null;
};

export const CollectionLoadingToast = () => (
  <Suspense fallback={null}>
    <CollectionLoadingToastInner />
  </Suspense>
);
