import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { collectionFiltersActiveAtom } from "src/atoms/filters.atoms";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes } from "src/context/filters.context";
import { useFiltersDispatch } from "src/hooks/useFilterAtoms.hook";

export const useCollectionReset = () => {
  const { dispatchResetState } = useCollectionContext();
  const filtersDispatch = useFiltersDispatch();
  const setCollectionFiltersActive = useSetAtom(collectionFiltersActiveAtom);

  return useCallback(() => {
    dispatchResetState();
    setCollectionFiltersActive(false);
    filtersDispatch({
      type: FiltersActionTypes.SetAllReleases,
      payload: [],
    });
  }, [dispatchResetState, filtersDispatch, setCollectionFiltersActive]);
};
