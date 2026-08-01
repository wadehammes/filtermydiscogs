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
  return isLoading || hasNextPage || isFetchingNextPage;
};
