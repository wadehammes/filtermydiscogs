import { beforeEach, describe, expect, it } from "@jest/globals";
import { useAtomValue, useSetAtom } from "jotai";
import {
  applyPendingFiltersRestoreAtom,
  collectionFiltersActiveAtom,
  pendingFiltersRestoreAtom,
} from "src/atoms/filters.atoms";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { computeFilterDerivedState } from "src/utils/computeFilterDerivedState";
import { FILTERS_STORAGE_KEY } from "src/utils/filtersStorage";
import { sortReleases as sortReleasesUtil } from "src/utils/sortReleases";
import { act, renderHook, TestProviders, waitFor } from "test-utils";
import { FiltersActionTypes, SortValues, useFilters } from "./filters.context";

jest.mock("src/utils/computeFilterDerivedState");
jest.mock("src/utils/sortReleases");
jest.mock("src/utils/releaseSearchIndex", () => ({
  buildReleaseSearchIndex: jest.fn(),
  syncReleaseSearchIndex: jest.fn(),
  clearReleaseSearchIndex: jest.fn(),
  getReleaseSearchText: jest.fn(() => ""),
  getReleaseSearchIndexEntry: jest.fn(() => ({
    searchText: "",
    genreStyleTags: [],
    formatTags: [],
  })),
}));

const mockComputeFilterDerivedState = jest.mocked(computeFilterDerivedState);
const mockSortReleases = jest.mocked(sortReleasesUtil);

describe("FiltersProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();

    mockComputeFilterDerivedState.mockImplementation(({ releases }) => ({
      filteredReleases: releases,
      facetOptions: {
        availableStyles: [],
        availableYears: [],
        availableFormats: [],
      },
    }));
    mockSortReleases.mockImplementation((releases) => releases);
  });

  it("provides initial state", () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    expect(result.current.state.selectedStyles).toEqual([]);
    expect(result.current.state.selectedYears).toEqual([]);
    expect(result.current.state.selectedFormats).toEqual([]);
    expect(result.current.state.selectedSort).toBe(SortValues.DateAddedNew);
    expect(result.current.state.filteredReleases).toEqual([]);
    expect(result.current.state.allReleases).toEqual([]);
    expect(result.current.state.isRandomMode).toBe(false);
  });

  it("keeps session filters at defaults when localStorage has saved filters", async () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        selectedStyles: ["Rock"],
        selectedYears: [1984],
        selectedFormats: ["LP"],
        selectedSort: SortValues.AZTitle,
        styleOperator: "AND",
        searchQuery: "test query",
      }),
    );

    const { result } = renderHook(
      () => {
        const filters = useFilters();
        const pendingRestore = useAtomValue(pendingFiltersRestoreAtom);
        return { filters, pendingRestore };
      },
      {
        wrapper: TestProviders,
      },
    );

    expect(result.current.filters.state.selectedStyles).toEqual([]);
    expect(result.current.filters.state.selectedYears).toEqual([]);
    expect(result.current.filters.state.selectedFormats).toEqual([]);
    expect(result.current.filters.state.selectedSort).toBe(
      SortValues.DateAddedNew,
    );
    expect(result.current.filters.state.styleOperator).toBe("OR");
    expect(result.current.filters.state.searchQuery).toBe("");

    await waitFor(() => {
      expect(result.current.pendingRestore).toEqual({
        selectedStyles: ["Rock"],
        selectedYears: [1984],
        selectedFormats: ["LP"],
        selectedSort: SortValues.AZTitle,
        styleOperator: "AND",
        formatOperator: "OR",
        yearOperator: "OR",
        searchQuery: "test query",
      });
    });
  });

  it("saves filter state to localStorage when filters change", () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetStyles,
        payload: ["Jazz"],
      });
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetSearchQuery,
        payload: "blue note",
      });
    });

    const saved = JSON.parse(localStorage.getItem(FILTERS_STORAGE_KEY) ?? "{}");

    expect(saved.selectedStyles).toEqual(["Jazz"]);
    expect(saved.searchQuery).toBe("blue note");
  });

  it("handles invalid localStorage data gracefully", () => {
    localStorage.setItem(FILTERS_STORAGE_KEY, "invalid json");

    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    expect(result.current.state.selectedStyles).toEqual([]);
    expect(result.current.state.selectedSort).toBe(SortValues.DateAddedNew);
    expect(result.current.state.searchQuery).toBe("");
  });

  it("offers saved filters for restore after remount instead of auto-applying", async () => {
    const { result, unmount } = renderHook(
      () => {
        const filters = useFilters();
        const pendingRestore = useAtomValue(pendingFiltersRestoreAtom);
        return { filters, pendingRestore };
      },
      {
        wrapper: TestProviders,
      },
    );

    act(() => {
      result.current.filters.dispatch({
        type: FiltersActionTypes.SetStyles,
        payload: ["Electronic"],
      });
    });

    act(() => {
      result.current.filters.dispatch({
        type: FiltersActionTypes.SetSearchQuery,
        payload: "ambient",
      });
    });

    unmount();

    const { result: remountedResult } = renderHook(
      () => {
        const filters = useFilters();
        const pendingRestore = useAtomValue(pendingFiltersRestoreAtom);
        return { filters, pendingRestore };
      },
      {
        wrapper: TestProviders,
      },
    );

    expect(remountedResult.current.filters.state.selectedStyles).toEqual([]);
    expect(remountedResult.current.filters.state.searchQuery).toBe("");

    await waitFor(() => {
      expect(remountedResult.current.pendingRestore).toEqual({
        selectedStyles: ["Electronic"],
        selectedYears: [],
        selectedFormats: [],
        selectedSort: SortValues.DateAddedNew,
        styleOperator: "OR",
        formatOperator: "OR",
        yearOperator: "OR",
        searchQuery: "ambient",
      });
    });
  });

  it("sets all releases", () => {
    const mockReleases = releaseFactory.buildList(3);
    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: mockReleases,
      });
    });

    expect(result.current.state.allReleases).toEqual(mockReleases);
  });

  it("does not auto-apply saved filters when collectionFiltersActive becomes true", async () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        selectedStyles: ["Rock"],
        selectedYears: [],
        selectedFormats: [],
        selectedSort: SortValues.AZTitle,
        styleOperator: "OR",
        searchQuery: "",
      }),
    );

    const mockReleases = releaseFactory.buildList(3);
    mockComputeFilterDerivedState.mockImplementation(
      ({ releases, selectedStyles }) => ({
        filteredReleases: selectedStyles.length > 0 ? [] : releases,
        facetOptions: {
          availableStyles: [],
          availableYears: [],
          availableFormats: [],
        },
      }),
    );

    const { result } = renderHook(
      () => {
        const filters = useFilters();
        const setCollectionFiltersActive = useSetAtom(
          collectionFiltersActiveAtom,
        );
        const applyPendingRestore = useSetAtom(applyPendingFiltersRestoreAtom);
        const pendingRestore = useAtomValue(pendingFiltersRestoreAtom);
        return {
          filters,
          setCollectionFiltersActive,
          applyPendingRestore,
          pendingRestore,
        };
      },
      {
        wrapper: TestProviders,
      },
    );

    await waitFor(() => {
      expect(result.current.pendingRestore?.selectedStyles).toEqual(["Rock"]);
    });

    act(() => {
      result.current.filters.dispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: mockReleases,
      });
    });

    expect(result.current.filters.state.filteredReleases).toEqual(mockReleases);

    act(() => {
      result.current.setCollectionFiltersActive(true);
    });

    expect(result.current.filters.state.filteredReleases).toEqual(mockReleases);

    act(() => {
      result.current.applyPendingRestore();
    });

    expect(result.current.filters.state.filteredReleases).toEqual([]);
    expect(result.current.filters.state.selectedStyles).toEqual(["Rock"]);
  });

  it("toggles style filter", () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.ToggleStyle,
        payload: "Rock",
      });
    });

    expect(result.current.state.selectedStyles).toEqual(["Rock"]);

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.ToggleStyle,
        payload: "Rock",
      });
    });

    expect(result.current.state.selectedStyles).toEqual([]);
  });

  it("toggles year filter", () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.ToggleYear,
        payload: 2020,
      });
    });

    expect(result.current.state.selectedYears).toEqual([2020]);

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.ToggleYear,
        payload: 2020,
      });
    });

    expect(result.current.state.selectedYears).toEqual([]);
  });

  it("toggles format filter", () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.ToggleFormat,
        payload: "LP",
      });
    });

    expect(result.current.state.selectedFormats).toEqual(["LP"]);

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.ToggleFormat,
        payload: "LP",
      });
    });

    expect(result.current.state.selectedFormats).toEqual([]);
  });

  it("sets styles", () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetStyles,
        payload: ["Rock", "Pop"],
      });
    });

    expect(result.current.state.selectedStyles).toEqual(["Rock", "Pop"]);
  });

  it("clears styles", () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetStyles,
        payload: ["Rock", "Pop"],
      });
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.ClearStyles,
        payload: undefined,
      });
    });

    expect(result.current.state.selectedStyles).toEqual([]);
  });

  it("sets sort", () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetSort,
        payload: SortValues.AZTitle,
      });
    });

    expect(result.current.state.selectedSort).toBe(SortValues.AZTitle);
  });

  it("sets style operator", () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetStyleOperator,
        payload: "AND",
      });
    });

    expect(result.current.state.styleOperator).toBe("AND");

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetStyleOperator,
        payload: "NONE",
      });
    });

    expect(result.current.state.styleOperator).toBe("NONE");
  });

  it("sets format operator", () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetFormatOperator,
        payload: "AND",
      });
    });

    expect(result.current.state.formatOperator).toBe("AND");

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetFormatOperator,
        payload: "NONE",
      });
    });

    expect(result.current.state.formatOperator).toBe("NONE");
  });

  it("sets year operator", () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetYearOperator,
        payload: "NONE",
      });
    });

    expect(result.current.state.yearOperator).toBe("NONE");

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetYearOperator,
        payload: "OR",
      });
    });

    expect(result.current.state.yearOperator).toBe("OR");
  });

  it("toggles random mode", () => {
    const mockReleases = releaseFactory.buildList(3);
    mockComputeFilterDerivedState.mockReturnValue({
      filteredReleases: mockReleases,
      facetOptions: {
        availableStyles: [],
        availableYears: [],
        availableFormats: [],
      },
    });

    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: mockReleases,
      });
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.ToggleRandomMode,
        payload: undefined,
      });
    });

    expect(result.current.state.isRandomMode).toBe(true);
  });

  it("sets search query", () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetSearchQuery,
        payload: "test query",
      });
    });

    expect(result.current.state.searchQuery).toBe("test query");
  });

  it("sets searching state", () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetSearching,
        payload: true,
      });
    });

    expect(result.current.state.isSearching).toBe(true);
  });

  it("clears all filters", () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetStyles,
        payload: ["Rock"],
      });
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetYears,
        payload: [2020],
      });
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetFormats,
        payload: ["LP"],
      });
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.ClearAllFilters,
        payload: undefined,
      });
    });

    expect(result.current.state.selectedStyles).toEqual([]);
    expect(result.current.state.selectedYears).toEqual([]);
    expect(result.current.state.selectedFormats).toEqual([]);
    expect(result.current.state.searchQuery).toBe("");

    const saved = JSON.parse(localStorage.getItem(FILTERS_STORAGE_KEY) ?? "{}");
    expect(saved.selectedStyles).toEqual([]);
    expect(saved.selectedYears).toEqual([]);
    expect(saved.selectedFormats).toEqual([]);
    expect(saved.searchQuery).toBe("");
  });

  it("computes filtered releases when filters change", () => {
    const mockReleases = releaseFactory.buildList(5);
    const filteredReleases = releaseFactory.buildList(2);
    mockComputeFilterDerivedState.mockReturnValue({
      filteredReleases,
      facetOptions: {
        availableStyles: [],
        availableYears: [],
        availableFormats: [],
      },
    });

    const { result } = renderHook(
      () => {
        const filters = useFilters();
        const setCollectionFiltersActive = useSetAtom(
          collectionFiltersActiveAtom,
        );
        return { filters, setCollectionFiltersActive };
      },
      {
        wrapper: TestProviders,
      },
    );

    act(() => {
      result.current.filters.dispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: mockReleases,
      });
      result.current.setCollectionFiltersActive(true);
    });

    act(() => {
      result.current.filters.dispatch({
        type: FiltersActionTypes.SetStyles,
        payload: ["Rock"],
      });
    });

    expect(mockComputeFilterDerivedState).toHaveBeenCalled();
    expect(result.current.filters.state.filteredReleases).toEqual(
      filteredReleases,
    );
  });

  it("computes availableYears from releases matching other active filters", () => {
    const allReleases = releaseFactory.buildList(5);
    const allYears = [2020, 2021, 2022, 2023, 2024];
    const rockYears = [1980, 1990];

    mockComputeFilterDerivedState.mockImplementation(
      ({ releases, selectedStyles }) => ({
        filteredReleases: releases,
        facetOptions: {
          availableStyles: [],
          availableYears:
            selectedStyles.includes("Rock") && selectedStyles.length > 0
              ? rockYears
              : allYears,
          availableFormats: [],
        },
      }),
    );

    const { result } = renderHook(
      () => {
        const filters = useFilters();
        const setCollectionFiltersActive = useSetAtom(
          collectionFiltersActiveAtom,
        );
        return { filters, setCollectionFiltersActive };
      },
      {
        wrapper: TestProviders,
      },
    );

    act(() => {
      result.current.filters.dispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: allReleases,
      });
      result.current.setCollectionFiltersActive(true);
    });

    expect(mockComputeFilterDerivedState).toHaveBeenCalledWith(
      expect.objectContaining({
        releases: allReleases,
        selectedStyles: [],
      }),
    );
    expect(result.current.filters.state.availableYears).toEqual(allYears);

    mockComputeFilterDerivedState.mockClear();

    act(() => {
      result.current.filters.dispatch({
        type: FiltersActionTypes.SetStyles,
        payload: ["Rock"],
      });
    });

    expect(mockComputeFilterDerivedState).toHaveBeenCalledWith(
      expect.objectContaining({
        releases: allReleases,
        selectedStyles: ["Rock"],
      }),
    );
    expect(result.current.filters.state.availableYears).toEqual(rockYears);
  });

  it("computes availableStyles from releases matching other active filters", () => {
    const allReleases = releaseFactory.buildList(5);
    const allStyles = ["Rock", "Pop", "Jazz", "Electronic", "Hip Hop"];
    const vinylStyles = ["Rock", "Punk"];

    mockComputeFilterDerivedState.mockImplementation(
      ({ releases, selectedFormats }) => ({
        filteredReleases: releases,
        facetOptions: {
          availableStyles:
            selectedFormats.includes("Vinyl") && selectedFormats.length > 0
              ? vinylStyles
              : allStyles,
          availableYears: [],
          availableFormats: [],
        },
      }),
    );

    const { result } = renderHook(
      () => {
        const filters = useFilters();
        const setCollectionFiltersActive = useSetAtom(
          collectionFiltersActiveAtom,
        );
        return { filters, setCollectionFiltersActive };
      },
      {
        wrapper: TestProviders,
      },
    );

    act(() => {
      result.current.filters.dispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: allReleases,
      });
      result.current.setCollectionFiltersActive(true);
    });

    expect(mockComputeFilterDerivedState).toHaveBeenCalledWith(
      expect.objectContaining({
        releases: allReleases,
        selectedFormats: [],
      }),
    );
    expect(result.current.filters.state.availableStyles).toEqual(allStyles);

    mockComputeFilterDerivedState.mockClear();

    act(() => {
      result.current.filters.dispatch({
        type: FiltersActionTypes.SetFormats,
        payload: ["Vinyl"],
      });
    });

    expect(mockComputeFilterDerivedState).toHaveBeenCalledWith(
      expect.objectContaining({
        releases: allReleases,
        selectedFormats: ["Vinyl"],
      }),
    );
    expect(result.current.filters.state.availableStyles).toEqual(vinylStyles);
  });

  it("computes availableFormats from releases matching other active filters", () => {
    const allReleases = releaseFactory.buildList(5);
    const allFormats = ['12"', '7"', "LP", "Vinyl", "Cassette"];
    const rockFormats = ["Vinyl", '12"'];

    mockComputeFilterDerivedState.mockImplementation(
      ({ releases, selectedStyles }) => ({
        filteredReleases: releases,
        facetOptions: {
          availableStyles: [],
          availableYears: [],
          availableFormats:
            selectedStyles.includes("Rock") && selectedStyles.length > 0
              ? rockFormats
              : allFormats,
        },
      }),
    );

    const { result } = renderHook(
      () => {
        const filters = useFilters();
        const setCollectionFiltersActive = useSetAtom(
          collectionFiltersActiveAtom,
        );
        return { filters, setCollectionFiltersActive };
      },
      {
        wrapper: TestProviders,
      },
    );

    act(() => {
      result.current.filters.dispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: allReleases,
      });
      result.current.setCollectionFiltersActive(true);
    });

    expect(mockComputeFilterDerivedState).toHaveBeenCalledWith(
      expect.objectContaining({
        releases: allReleases,
        selectedStyles: [],
      }),
    );
    expect(result.current.filters.state.availableFormats).toEqual(allFormats);

    mockComputeFilterDerivedState.mockClear();

    act(() => {
      result.current.filters.dispatch({
        type: FiltersActionTypes.SetStyles,
        payload: ["Rock"],
      });
    });

    expect(mockComputeFilterDerivedState).toHaveBeenCalledWith(
      expect.objectContaining({
        releases: allReleases,
        selectedStyles: ["Rock"],
      }),
    );
    expect(result.current.filters.state.availableFormats).toEqual(rockFormats);
  });

  it("throws error when useFilters is used outside FiltersProvider", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useFilters());
    }).toThrow("useFilters must be used within a FiltersProvider");

    consoleSpy.mockRestore();
  });
});
