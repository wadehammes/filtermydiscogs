export const shouldMountReleaseSimilarSidebar = (
  isLoading: boolean,
  visibleReleaseCount: number,
): boolean => isLoading || visibleReleaseCount > 0;

export const getReleaseSimilarSidebarChrome = ({
  isLoading,
  visibleReleaseCount,
  totalSimilarMatchCount,
  similarPageCount,
  hasPaginationHandlers,
}: {
  isLoading: boolean;
  visibleReleaseCount: number;
  totalSimilarMatchCount: number;
  similarPageCount: number;
  hasPaginationHandlers: boolean;
}) => ({
  showActionsToolbar: visibleReleaseCount > 0 || totalSimilarMatchCount > 0,
  showListLoader:
    isLoading && visibleReleaseCount === 0 && totalSimilarMatchCount === 0,
  showSimilarPagination:
    similarPageCount > 1 && hasPaginationHandlers,
});