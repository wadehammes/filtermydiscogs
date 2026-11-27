import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { searchQueryAtom, selectedStylesAtom } from "src/atoms/filters.atoms";
import { useDashboardCollectionDrilldown } from "src/hooks/useDashboardCollectionDrilldown.hook";
import { createMockAppRouter } from "src/tests/mocks/mockAppRouter.mock";
import { act, renderFeatureHook } from "test-utils";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockUseRouter = jest.mocked(useRouter);

describe("useDashboardCollectionDrilldown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("when invoked, applies session filters and navigates to collection", () => {
    const mockPush = jest.fn();
    mockUseRouter.mockReturnValue(createMockAppRouter({ push: mockPush }));

    const { result } = renderFeatureHook(() => {
      const openCollectionDrilldown = useDashboardCollectionDrilldown();
      const selectedStyles = useAtomValue(selectedStylesAtom);
      const searchQuery = useAtomValue(searchQueryAtom);

      return { openCollectionDrilldown, selectedStyles, searchQuery };
    });

    act(() => {
      result.current.openCollectionDrilldown({
        kind: "genreStyle",
        label: "Jazz",
      });
    });

    expect(result.current.selectedStyles).toEqual(["Jazz"]);
    expect(result.current.searchQuery).toBe("");
    expect(mockPush).toHaveBeenCalledWith("/collection");
  });
});
