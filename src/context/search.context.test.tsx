import { act, renderHook } from "@testing-library/react";
import { SearchActionTypes, SearchProvider, useSearch } from "./search.context";

describe("SearchProvider", () => {
  it("provides initial search state", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: SearchProvider,
    });

    expect(result.current.state.query).toBe("");
    expect(result.current.state.isSearching).toBe(false);
    expect(result.current.state.searchResults).toEqual([]);
    expect(result.current.state.totalResults).toBe(0);
    expect(result.current.state.currentPage).toBe(1);
    expect(result.current.state.hasSearched).toBe(false);
  });

  it("sets query", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: SearchProvider,
    });

    act(() => {
      result.current.dispatch({
        type: SearchActionTypes.SetQuery,
        payload: "test query",
      });
    });

    expect(result.current.state.query).toBe("test query");
    expect(result.current.state.hasSearched).toBe(false);
  });

  it("sets searching state", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: SearchProvider,
    });

    act(() => {
      result.current.dispatch({
        type: SearchActionTypes.SetSearching,
        payload: true,
      });
    });

    expect(result.current.state.isSearching).toBe(true);

    act(() => {
      result.current.dispatch({
        type: SearchActionTypes.SetSearching,
        payload: false,
      });
    });

    expect(result.current.state.isSearching).toBe(false);
  });

  it("sets search results", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: SearchProvider,
    });

    const mockResults = [
      {
        id: 1,
        type: "release",
        title: "Test Release",
        uri: "https://example.com",
        thumb: "https://example.com/thumb.jpg",
        cover_image: "https://example.com/cover.jpg",
        resource_url: "https://example.com/resource",
      },
    ];

    act(() => {
      result.current.dispatch({
        type: SearchActionTypes.SetSearchResults,
        payload: {
          results: mockResults,
          totalResults: 100,
          page: 1,
        },
      });
    });

    expect(result.current.state.searchResults).toEqual(mockResults);
    expect(result.current.state.totalResults).toBe(100);
    expect(result.current.state.currentPage).toBe(1);
    expect(result.current.state.isSearching).toBe(false);
    expect(result.current.state.hasSearched).toBe(true);
  });

  it("clears search", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: SearchProvider,
    });

    // Set some state first
    act(() => {
      result.current.dispatch({
        type: SearchActionTypes.SetQuery,
        payload: "test",
      });
    });

    act(() => {
      result.current.dispatch({
        type: SearchActionTypes.SetSearchResults,
        payload: {
          results: [
            {
              id: 1,
              type: "release",
              title: "Test",
              uri: "https://example.com",
              thumb: "",
              cover_image: "",
              resource_url: "",
            },
          ],
          totalResults: 10,
          page: 1,
        },
      });
    });

    // Clear search
    act(() => {
      result.current.dispatch({
        type: SearchActionTypes.ClearSearch,
        payload: undefined,
      });
    });

    expect(result.current.state.query).toBe("");
    expect(result.current.state.searchResults).toEqual([]);
    expect(result.current.state.totalResults).toBe(0);
    expect(result.current.state.currentPage).toBe(1);
    expect(result.current.state.isSearching).toBe(false);
    expect(result.current.state.hasSearched).toBe(false);
  });

  it("sets page", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: SearchProvider,
    });

    act(() => {
      result.current.dispatch({
        type: SearchActionTypes.SetPage,
        payload: 2,
      });
    });

    expect(result.current.state.currentPage).toBe(2);
  });

  it("resets hasSearched when setting query", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: SearchProvider,
    });

    // Set search results first
    act(() => {
      result.current.dispatch({
        type: SearchActionTypes.SetSearchResults,
        payload: {
          results: [],
          totalResults: 0,
          page: 1,
        },
      });
    });

    expect(result.current.state.hasSearched).toBe(true);

    // Set query should reset hasSearched
    act(() => {
      result.current.dispatch({
        type: SearchActionTypes.SetQuery,
        payload: "new query",
      });
    });

    expect(result.current.state.hasSearched).toBe(false);
  });

  it("throws error when useSearch is used outside SearchProvider", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useSearch());
    }).toThrow("useSearch must be used within a SearchProvider");

    consoleSpy.mockRestore();
  });
});
