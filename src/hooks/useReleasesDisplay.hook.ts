import { useCollectionContext } from "src/context/collection.context";
import { useFilteredReleases } from "src/hooks/useFilterAtoms.hook";

export const useReleasesDisplay = () => {
  const { state } = useCollectionContext();
  const filteredReleases = useFilteredReleases();

  const { error } = state;

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
