import { useAllReleases } from "src/hooks/useFilterAtoms.hook";

export interface UseNeedsCollectionLoadParams {
  isLoading: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export const useNeedsCollectionLoad = ({
  isLoading,
  hasNextPage = false,
  isFetchingNextPage = false,
}: UseNeedsCollectionLoadParams) => {
  const allReleases = useAllReleases();
  const isPaginating = hasNextPage || isFetchingNextPage;

  return (isLoading || isPaginating) && allReleases.length === 0;
};
