import { useAllReleases } from "src/hooks/useFilterAtoms.hook";

export const useNeedsCollectionLoad = (isQueryLoading: boolean) => {
  const allReleases = useAllReleases();

  return isQueryLoading && allReleases.length === 0;
};
