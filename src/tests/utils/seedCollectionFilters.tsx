"use client";

import { useStore } from "jotai";
import { type ReactNode, useLayoutEffect, useMemo, useRef } from "react";
import {
  collectionFiltersActiveAtom,
  filtersDispatchAtom,
} from "src/atoms/filters.atoms";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes } from "src/context/filters.context";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import type { DiscogsRelease } from "src/types";
import type { PersistedFiltersState } from "src/types/filters.types";
import { defaultPersistedFilters } from "src/utils/filtersStorage";

type SeedCollectionFiltersProps = {
  releases: DiscogsRelease[];
  children: ReactNode;
  sessionFilters?: Partial<PersistedFiltersState>;
};

export const SeedCollectionFilters = ({
  releases,
  children,
  sessionFilters,
}: SeedCollectionFiltersProps) => {
  const { dispatchFetchingCollection, dispatchCollection } =
    useCollectionContext();
  const store = useStore();
  const releasesSeedKey = useMemo(
    () => releases.map((release) => String(release.instance_id)).join(","),
    [releases],
  );
  const seededReleasesKeyRef = useRef<string | null>(null);
  const seededSessionFiltersKeyRef = useRef<string | null>(null);
  const sessionFiltersSeedKey = sessionFilters
    ? JSON.stringify(sessionFilters)
    : null;

  if (seededReleasesKeyRef.current !== releasesSeedKey) {
    seededReleasesKeyRef.current = releasesSeedKey;
    store.set(filtersDispatchAtom, {
      type: FiltersActionTypes.SetAllReleases,
      payload: releases,
    });
    store.set(collectionFiltersActiveAtom, true);
  }

  if (
    sessionFiltersSeedKey !== null &&
    seededSessionFiltersKeyRef.current !== sessionFiltersSeedKey
  ) {
    seededSessionFiltersKeyRef.current = sessionFiltersSeedKey;
    store.set(filtersDispatchAtom, {
      type: FiltersActionTypes.ApplySessionFilters,
      payload: { ...defaultPersistedFilters, ...sessionFilters },
    });
  }

  useLayoutEffect(() => {
    dispatchFetchingCollection(false);
    dispatchCollection(
      collectionFactory.build(
        { releases },
        { page: 1, totalPages: 1, releaseCount: releases.length },
      ),
    );
  }, [dispatchCollection, dispatchFetchingCollection, releases]);

  return children;
};
