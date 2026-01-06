import { act, renderHook } from "@testing-library/react";
import { mocked } from "jest-mock";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { filterReleases as filterReleasesUtil } from "src/utils/filterReleases";
import { getAvailableFormats } from "src/utils/getAvailableFormats";
import { getAvailableStyles } from "src/utils/getAvailableStyles";
import { getAvailableYears } from "src/utils/getAvailableYears";
import { sortReleases as sortReleasesUtil } from "src/utils/sortReleases";
import {
  FiltersActionTypes,
  FiltersProvider,
  SortValues,
  useFilters,
} from "./filters.context";

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
      wrapper: FiltersProvider,
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
      wrapper: FiltersProvider,
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
      wrapper: FiltersProvider,
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
      wrapper: FiltersProvider,
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
      wrapper: FiltersProvider,
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
      wrapper: FiltersProvider,
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
      wrapper: FiltersProvider,
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
      wrapper: FiltersProvider,
    });

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetSort,
        payload: SortValues.AZTitle,
      });
    });

    expect(result.current.state.selectedSort).toBe(SortValues.AZTitle);
  });

  it("toggles random mode", () => {
    const mockReleases = releaseFactory.buildList(3);
    mockFilterReleases.mockReturnValue(mockReleases);

    const { result } = renderHook(() => useFilters(), {
      wrapper: FiltersProvider,
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
      wrapper: FiltersProvider,
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
      wrapper: FiltersProvider,
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
      wrapper: FiltersProvider,
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
      wrapper: FiltersProvider,
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
