"use client";

import { useSetAtom } from "jotai";
import { type ReactNode, useLayoutEffect } from "react";
import { collectionFiltersActiveAtom } from "src/atoms/filters.atoms";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes } from "src/context/filters.context";
import { useFiltersDispatch } from "src/hooks/useFilterAtoms.hook";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import type { DiscogsRelease } from "src/types";

type SeedCollectionFiltersProps = {
  releases: DiscogsRelease[];
  children: ReactNode;
};

export const SeedCollectionFilters = ({
  releases,
  children,
}: SeedCollectionFiltersProps) => {
  const { dispatchFetchingCollection, dispatchCollection } =
    useCollectionContext();
  const filtersDispatch = useFiltersDispatch();
  const setCollectionFiltersActive = useSetAtom(collectionFiltersActiveAtom);

  useLayoutEffect(() => {
    dispatchFetchingCollection(false);
    dispatchCollection(
      collectionFactory.build(
        { releases },
        { page: 1, totalPages: 1, releaseCount: releases.length },
      ),
    );
    filtersDispatch({
      type: FiltersActionTypes.SetAllReleases,
      payload: releases,
    });
    setCollectionFiltersActive(true);
  }, [
    dispatchCollection,
    dispatchFetchingCollection,
    filtersDispatch,
    releases,
    setCollectionFiltersActive,
  ]);

  return children;
};
