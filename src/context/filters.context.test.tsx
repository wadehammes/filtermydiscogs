import { beforeEach, describe, expect, it } from "@jest/globals";
import { useSetAtom } from "jotai";
import { collectionFiltersActiveAtom } from "src/atoms/filters.atoms";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { filterReleases as filterReleasesUtil } from "src/utils/filterReleases";
import { FILTERS_STORAGE_KEY } from "src/utils/filtersStorage";
import { getAvailableFormats } from "src/utils/getAvailableFormats";
import { getAvailableStyles } from "src/utils/getAvailableStyles";
import { getAvailableYears } from "src/utils/getAvailableYears";
import { sortReleases as sortReleasesUtil } from "src/utils/sortReleases";
import { act, renderHook, TestProviders } from "test-utils";
import { FiltersActionTypes, SortValues, useFilters } from "./filters.context";

jest.mock("src/utils/filterReleases");
jest.mock("src/utils/sortReleases");
jest.mock("src/utils/getAvailableStyles");
jest.mock("src/utils/getAvailableYears");
jest.mock("src/utils/getAvailableFormats");

const mockFilterReleases = jest.mocked(filterReleasesUtil);
const mockSortReleases = jest.mocked(sortReleasesUtil);
const mockGetAvailableStyles = jest.mocked(getAvailableStyles);
const mockGetAvailableYears = jest.mocked(getAvailableYears);
const mockGetAvailableFormats = jest.mocked(getAvailableFormats);

describe("FiltersProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();

    // Setup default mocks
    mockFilterReleases.mockImplementation(({ releases }) => releases);
    mockSortReleases.mockImplementation((releases) => releases);
    mockGetAvailableStyles.mockReturnValue([]);
    mockGetAvailableYears.mockReturnValue([]);
    mockGetAvailableFormats.mockReturnValue([]);
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

  it("loads saved filter state from localStorage", () => {
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

    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    expect(result.current.state.selectedStyles).toEqual(["Rock"]);
    expect(result.current.state.selectedYears).toEqual([1984]);
    expect(result.current.state.selectedFormats).toEqual(["LP"]);
    expect(result.current.state.selectedSort).toBe(SortValues.AZTitle);
    expect(result.current.state.styleOperator).toBe("AND");
    expect(result.current.state.searchQuery).toBe("test query");
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

  it("restores filter state after remount", () => {
    const { result, unmount } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetStyles,
        payload: ["Electronic"],
      });
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetSearchQuery,
        payload: "ambient",
      });
    });

    unmount();

    const { result: remountedResult } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    expect(remountedResult.current.state.selectedStyles).toEqual([
      "Electronic",
    ]);
    expect(remountedResult.current.state.searchQuery).toBe("ambient");
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

  it("ignores persisted filters until collectionFiltersActive is true", () => {
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
    mockFilterReleases.mockImplementation(({ releases, selectedStyles }) =>
      selectedStyles.length > 0 ? [] : releases,
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
        payload: mockReleases,
      });
    });

    expect(result.current.filters.state.filteredReleases).toEqual(mockReleases);

    act(() => {
      result.current.setCollectionFiltersActive(true);
    });

    expect(result.current.filters.state.filteredReleases).toEqual([]);
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

    // Set styles first
    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetStyles,
        payload: ["Rock", "Pop"],
      });
    });

    // Clear styles
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

  it("toggles random mode", () => {
    const mockReleases = releaseFactory.buildList(3);
    mockFilterReleases.mockReturnValue(mockReleases);

    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    // Set releases first
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

    // Set some filters
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

    // Clear all
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
    mockFilterReleases.mockReturnValue(filteredReleases);

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

    expect(mockFilterReleases).toHaveBeenCalled();
    expect(result.current.filters.state.filteredReleases).toEqual(
      filteredReleases,
    );
  });

  it("computes availableYears from releases matching other active filters", () => {
    const allReleases = releaseFactory.buildList(5);
    const rockReleases = releaseFactory.buildList(2);
    const allYears = [2020, 2021, 2022, 2023, 2024];
    const rockYears = [1980, 1990];

    mockFilterReleases.mockImplementation(
      ({ selectedStyles, selectedYears }) => {
        if (selectedStyles.includes("Rock") && selectedYears.length === 0) {
          return rockReleases;
        }

        return allReleases;
      },
    );
    mockGetAvailableYears.mockImplementation((releases) =>
      releases === rockReleases ? rockYears : allYears,
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

    expect(mockGetAvailableYears).toHaveBeenCalledWith(allReleases);
    expect(result.current.filters.state.availableYears).toEqual(allYears);

    mockGetAvailableYears.mockClear();

    act(() => {
      result.current.filters.dispatch({
        type: FiltersActionTypes.SetStyles,
        payload: ["Rock"],
      });
    });

    expect(mockGetAvailableYears).toHaveBeenCalledWith(rockReleases);
    expect(result.current.filters.state.availableYears).toEqual(rockYears);
  });

  it("computes availableStyles from releases matching other active filters", () => {
    const allReleases = releaseFactory.buildList(5);
    const vinylReleases = releaseFactory.buildList(2);
    const allStyles = ["Rock", "Pop", "Jazz", "Electronic", "Hip Hop"];
    const vinylStyles = ["Rock", "Punk"];

    mockFilterReleases.mockImplementation(
      ({ selectedFormats, selectedStyles }) => {
        if (selectedFormats.includes("Vinyl") && selectedStyles.length === 0) {
          return vinylReleases;
        }

        return allReleases;
      },
    );
    mockGetAvailableStyles.mockImplementation((releases) =>
      releases === vinylReleases ? vinylStyles : allStyles,
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

    expect(mockGetAvailableStyles).toHaveBeenCalledWith(allReleases);
    expect(result.current.filters.state.availableStyles).toEqual(allStyles);

    mockGetAvailableStyles.mockClear();

    act(() => {
      result.current.filters.dispatch({
        type: FiltersActionTypes.SetFormats,
        payload: ["Vinyl"],
      });
    });

    expect(mockGetAvailableStyles).toHaveBeenCalledWith(vinylReleases);
    expect(result.current.filters.state.availableStyles).toEqual(vinylStyles);
  });

  it("computes availableFormats from releases matching other active filters", () => {
    const allReleases = releaseFactory.buildList(5);
    const rockReleases = releaseFactory.buildList(2);
    const allFormats = ['12"', '7"', "LP", "Vinyl", "Cassette"];
    const rockFormats = ["Vinyl", '12"'];

    mockFilterReleases.mockImplementation(
      ({ selectedStyles, selectedFormats }) => {
        if (selectedStyles.includes("Rock") && selectedFormats.length === 0) {
          return rockReleases;
        }

        return allReleases;
      },
    );
    mockGetAvailableFormats.mockImplementation((releases) =>
      releases === rockReleases ? rockFormats : allFormats,
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

    expect(mockGetAvailableFormats).toHaveBeenCalledWith(allReleases);
    expect(result.current.filters.state.availableFormats).toEqual(allFormats);

    mockGetAvailableFormats.mockClear();

    act(() => {
      result.current.filters.dispatch({
        type: FiltersActionTypes.SetStyles,
        payload: ["Rock"],
      });
    });

    expect(mockGetAvailableFormats).toHaveBeenCalledWith(rockReleases);
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
