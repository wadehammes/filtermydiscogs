import { useCollectionContext } from "src/context/collection.context";
import { useFilters } from "src/context/filters.context";

export const useReleasesDisplay = () => {
  const { state } = useCollectionContext();
  const { state: filtersState } = useFilters();

  const { error } = state;
  const { filteredReleases } = filtersState;

  const hasReleases = filteredReleases.length > 0;
  const hasError = !!error;

  return {
    error,
    filteredReleases,
    hasReleases,
    hasError,
    releaseCount: filteredReleases.length,
  };
};
