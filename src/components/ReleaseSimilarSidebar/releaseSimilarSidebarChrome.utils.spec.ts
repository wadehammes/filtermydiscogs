import { describe, expect, it } from "@jest/globals";
import {
  getReleaseSimilarSidebarChrome,
  shouldMountReleaseSimilarSidebar,
} from "src/components/ReleaseSimilarSidebar/releaseSimilarSidebarChrome.utils";

describe("releaseSimilarSidebarChrome.utils", () => {
  it("mounts the sidebar while loading or when rows are visible", () => {
    expect(shouldMountReleaseSimilarSidebar(false, 0)).toBe(false);
    expect(shouldMountReleaseSimilarSidebar(true, 0)).toBe(true);
    expect(shouldMountReleaseSimilarSidebar(false, 2)).toBe(true);
  });

  it("keeps toolbar chrome when only the pool count is known", () => {
    expect(
      getReleaseSimilarSidebarChrome({
        isLoading: true,
        visibleReleaseCount: 0,
        totalSimilarMatchCount: 12,
        similarPageCount: 3,
        hasPaginationHandlers: true,
      }),
    ).toEqual({
      showActionsToolbar: true,
      showListLoader: false,
      showSimilarPagination: true,
    });
  });
});
