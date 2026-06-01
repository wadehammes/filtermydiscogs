import { mocked } from "jest-mock";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { act, renderHook, TestProviders } from "src/tests/utils/test-utils";
import { filterReleases as filterReleasesUtil } from "src/utils/filterReleases";
import { getAvailableFormats } from "src/utils/getAvailableFormats";
import { getAvailableStyles } from "src/utils/getAvailableStyles";
import { getAvailableYears } from "src/utils/getAvailableYears";
import { sortReleases as sortReleasesUtil } from "src/utils/sortReleases";
import { FiltersActionTypes, SortValues, useFilters } from "./filters.context";

jest.mock("src/utils/filterReleases");
jest.mock("src/utils/sortReleases");
jest.mock("src/utils/getAvailableStyles");
jest.mock("src/utils/getAvailableYears");
jest.mock("src/utils/getAvailableFormats");

const mockFilterReleases = mocked(filterReleasesUtil);
const mockSortReleases = mocked(sortReleasesUtil);
const mockGetAvailableStyles = mocked(getAvailableStyles);
const mockGetAvailableYears = mocked(getAvailableYears);
const mockGetAvailableFormats = mocked(getAvailableFormats);

describe("FiltersProvider", () => {
  beforeEach(() => {
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
  });

  it("computes filtered releases when filters change", () => {
    const mockReleases = releaseFactory.buildList(5);
    const filteredReleases = releaseFactory.buildList(2);
    mockFilterReleases.mockReturnValue(filteredReleases);

    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    // Set releases
    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: mockReleases,
      });
    });

    // Apply filter
    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetStyles,
        payload: ["Rock"],
      });
    });

    expect(mockFilterReleases).toHaveBeenCalled();
    expect(result.current.state.filteredReleases).toEqual(filteredReleases);
  });

  it("computes availableYears from allReleases, not filtered releases", () => {
    const allReleases = releaseFactory.buildList(5);
    const filteredReleases = releaseFactory.buildList(2);
    const allYears = [2020, 2021, 2022, 2023, 2024];

    mockFilterReleases.mockReturnValue(filteredReleases);
    mockGetAvailableYears.mockReturnValue(allYears);

    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: allReleases,
      });
    });

    expect(mockGetAvailableYears).toHaveBeenCalledWith(allReleases);
    expect(result.current.state.availableYears).toEqual(allYears);

    mockGetAvailableYears.mockClear();
    mockGetAvailableYears.mockReturnValue(allYears);

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetYears,
        payload: [2020],
      });
    });

    expect(result.current.state.availableYears).toEqual(allYears);
    expect(mockGetAvailableYears).not.toHaveBeenCalled();
  });

  it("computes availableStyles from allReleases, not filtered releases", () => {
    const allReleases = releaseFactory.buildList(5);
    const filteredReleases = releaseFactory.buildList(2);
    const allStyles = ["Rock", "Pop", "Jazz", "Electronic", "Hip Hop"];

    mockFilterReleases.mockReturnValue(filteredReleases);
    mockGetAvailableStyles.mockReturnValue(allStyles);

    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: allReleases,
      });
    });

    expect(mockGetAvailableStyles).toHaveBeenCalledWith(allReleases);
    expect(result.current.state.availableStyles).toEqual(allStyles);

    mockGetAvailableStyles.mockClear();
    mockGetAvailableStyles.mockReturnValue(allStyles);

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.ToggleStyle,
        payload: "Rock",
      });
    });

    expect(result.current.state.availableStyles).toEqual(allStyles);
    expect(mockGetAvailableStyles).not.toHaveBeenCalled();
  });

  it("computes availableFormats from allReleases, not filtered releases", () => {
    const allReleases = releaseFactory.buildList(5);
    const filteredReleases = releaseFactory.buildList(2);
    const allFormats = ['12"', '7"', "LP", "Vinyl", "Cassette"];

    mockFilterReleases.mockReturnValue(filteredReleases);
    mockGetAvailableFormats.mockReturnValue(allFormats);

    const { result } = renderHook(() => useFilters(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: allReleases,
      });
    });

    expect(mockGetAvailableFormats).toHaveBeenCalledWith(allReleases);
    expect(result.current.state.availableFormats).toEqual(allFormats);

    mockGetAvailableFormats.mockClear();
    mockGetAvailableFormats.mockReturnValue(allFormats);

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.ToggleFormat,
        payload: '12"',
      });
    });

    expect(result.current.state.availableFormats).toEqual(allFormats);
    expect(mockGetAvailableFormats).not.toHaveBeenCalled();
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
