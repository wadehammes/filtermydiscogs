"use client";

import { useRouter } from "next/navigation";
import { startTransition, useCallback } from "react";
import { FiltersActionTypes } from "src/context/filters.context";
import { useFiltersDispatch } from "src/hooks/useFilterAtoms.hook";
import {
  buildDashboardDrilldownSessionFilters,
  type DashboardDrilldownTarget,
} from "src/utils/dashboardDrilldownFilters";

export const useDashboardCollectionDrilldown = () => {
  const router = useRouter();
  const filtersDispatch = useFiltersDispatch();

  return useCallback(
    (target: DashboardDrilldownTarget) => {
      startTransition(() => {
        filtersDispatch({
          type: FiltersActionTypes.ApplySessionFilters,
          payload: buildDashboardDrilldownSessionFilters(target),
        });
        router.push("/collection");
      });
    },
    [filtersDispatch, router],
  );
};
