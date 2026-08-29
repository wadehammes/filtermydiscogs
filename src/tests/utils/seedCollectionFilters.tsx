"use client";

import { useSetAtom } from "jotai";
import { type ReactNode, useLayoutEffect } from "react";
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
  const dispatchFilters = useSetAtom(filtersDispatchAtom);
  const setCollectionFiltersActive = useSetAtom(collectionFiltersActiveAtom);

  useLayoutEffect(() => {
    dispatchFetchingCollection(false);
    dispatchCollection(
      collectionFactory.build(
        { releases },
        { page: 1, totalPages: 1, releaseCount: releases.length },
      ),
    );
    dispatchFilters({
      type: FiltersActionTypes.SetAllReleases,
      payload: releases,
    });
    if (sessionFilters) {
      dispatchFilters({
        type: FiltersActionTypes.ApplySessionFilters,
        payload: { ...defaultPersistedFilters, ...sessionFilters },
      });
    }
    setCollectionFiltersActive(true);
  }, [
    dispatchCollection,
    dispatchFetchingCollection,
    dispatchFilters,
    releases,
    sessionFilters,
    setCollectionFiltersActive,
  ]);

  return children;
};
