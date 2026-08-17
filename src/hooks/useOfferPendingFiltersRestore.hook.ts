"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import {
  allReleasesAtom,
  applyPendingFiltersRestoreAtom,
  collectionFiltersActiveAtom,
  dismissPendingFiltersRestoreAtom,
  pendingFiltersRestoreAtom,
} from "src/atoms/filters.atoms";
import {
  dismissPendingFiltersRestoreToast,
  showPendingFiltersRestoreToast,
} from "src/components/PendingFiltersRestoreOffer/pendingFiltersRestoreToast";
import type { PersistedFiltersState } from "src/types/filters.types";
import { computeFilterDerivedState } from "src/utils/computeFilterDerivedState";
import { persistedFiltersEqual } from "src/utils/filtersStorage";

export const useOfferPendingFiltersRestore = (enabled: boolean) => {
  const pendingRestore = useAtomValue(pendingFiltersRestoreAtom);
  const collectionFiltersActive = useAtomValue(collectionFiltersActiveAtom);
  const allReleases = useAtomValue(allReleasesAtom);
  const applyPendingRestore = useSetAtom(applyPendingFiltersRestoreAtom);
  const dismissPendingRestore = useSetAtom(dismissPendingFiltersRestoreAtom);
  const offeredPendingRef = useRef<PersistedFiltersState | null>(null);

  useEffect(() => {
    if (!enabled) {
      dismissPendingFiltersRestoreToast();
      return;
    }

    if (!(collectionFiltersActive && pendingRestore)) {
      if (!pendingRestore) {
        offeredPendingRef.current = null;
        dismissPendingFiltersRestoreToast();
      }
      return;
    }

    if (
      offeredPendingRef.current &&
      persistedFiltersEqual(offeredPendingRef.current, pendingRestore)
    ) {
      return;
    }

    offeredPendingRef.current = pendingRestore;

    const { filteredReleases } = computeFilterDerivedState({
      releases: allReleases,
      selectedStyles: pendingRestore.selectedStyles,
      selectedYears: pendingRestore.selectedYears,
      selectedFormats: pendingRestore.selectedFormats,
      searchQuery: pendingRestore.searchQuery,
      styleOperator: pendingRestore.styleOperator,
    });

    showPendingFiltersRestoreToast({
      totalCount: allReleases.length,
      filteredCount: filteredReleases.length,
      onApply: () => {
        applyPendingRestore();
        dismissPendingFiltersRestoreToast();
        offeredPendingRef.current = null;
      },
      onDismiss: () => {
        dismissPendingRestore();
        dismissPendingFiltersRestoreToast();
        offeredPendingRef.current = null;
      },
    });
  }, [
    allReleases,
    applyPendingRestore,
    collectionFiltersActive,
    dismissPendingRestore,
    enabled,
    pendingRestore,
  ]);
};
