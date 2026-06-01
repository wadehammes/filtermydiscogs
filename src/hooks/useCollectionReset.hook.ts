import { useCallback } from "react";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes } from "src/context/filters.context";
import { useFiltersDispatch } from "src/hooks/useFilterAtoms.hook";

export const useCollectionReset = () => {
  const { dispatchResetState } = useCollectionContext();
  const filtersDispatch = useFiltersDispatch();

  return useCallback(() => {
    dispatchResetState();
    filtersDispatch({
      type: FiltersActionTypes.SetAllReleases,
      payload: [],
    });
  }, [dispatchResetState, filtersDispatch]);
};
