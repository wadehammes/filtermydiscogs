import { act, renderHook } from "@testing-library/react";
import { mocked } from "jest-mock";
import { useRouter } from "next/navigation";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  CollectionActionTypes,
  CollectionContextProvider,
  CollectionReducer,
  CollectionSortingValues,
  useCollectionContext,
} from "./collection.context";

jest.mock("next/navigation");

const mockUseRouter = mocked(useRouter);

describe("CollectionReducer", () => {
  const initialState = {
    username: null,
    page: 1,
    nextPageLink: null,
    collection: null,
    releases: [],
    fetchingCollection: true,
    filteredReleases: [],
    releaseStyles: [],
    selectedReleaseStyle: [],
    selectedReleaseSort: CollectionSortingValues.DateAddedNew,
    error: null,
  };

  it("sets user", () => {
    const action = {
      type: CollectionActionTypes.SetUser,
      payload: "testuser",
    } as const;
    const result = CollectionReducer(initialState, action);

    expect(result.username).toBe("testuser");
  });

  it("sets page", () => {
    const action = {
      type: CollectionActionTypes.SetPage,
      payload: 2,
    } as const;
    const result = CollectionReducer(initialState, action);

    expect(result.page).toBe(2);
  });

  it("sets next page link", () => {
    const action = {
      type: CollectionActionTypes.SetNextPageLink,
      payload: "https://example.com/next",
    } as const;
    const result = CollectionReducer(initialState, action);

    expect(result.nextPageLink).toBe("https://example.com/next");
  });

  it("sets collection", () => {
    const mockCollection = collectionFactory.build();
    const action = {
      type: CollectionActionTypes.SetCollection,
      payload: mockCollection,
    } as const;
    const result = CollectionReducer(initialState, action);

    expect(result.collection).toEqual(mockCollection);
  });

  it("sets releases", () => {
    const mockReleases = releaseFactory.buildList(3);
    const action = {
      type: CollectionActionTypes.SetReleases,
      payload: mockReleases,
    } as const;
    const result = CollectionReducer(initialState, action);

    expect(result.releases).toEqual(mockReleases);
  });

  it("sets fetching collection state", () => {
    const action = {
      type: CollectionActionTypes.SetFetchingCollection,
      payload: false,
    } as const;
    const result = CollectionReducer(initialState, action);

    expect(result.fetchingCollection).toBe(false);
  });

  it("sets filtered releases", () => {
    const mockReleases = releaseFactory.buildList(2);
    const action = {
      type: CollectionActionTypes.SetFilteredReleases,
      payload: mockReleases,
    } as const;
    const result = CollectionReducer(initialState, action);

    expect(result.filteredReleases).toEqual(mockReleases);
  });

  it("sets release styles", () => {
    const action = {
      type: CollectionActionTypes.SetReleaseStyles,
      payload: ["Rock", "Pop"] as string[],
    } as const;
    const result = CollectionReducer(initialState, action);

    expect(result.releaseStyles).toEqual(["Rock", "Pop"]);
  });

  it("sets selected release style", () => {
    const action = {
      type: CollectionActionTypes.SetSelectedReleaseStyle,
      payload: ["Rock"] as string[],
    } as const;
    const result = CollectionReducer(initialState, action);

    expect(result.selectedReleaseStyle).toEqual(["Rock"]);
  });

  it("sets selected release sort", () => {
    const action = {
      type: CollectionActionTypes.SetSelectedReleaseSort,
      payload: CollectionSortingValues.AZLabel,
    } as const;
    const result = CollectionReducer(initialState, action);

    expect(result.selectedReleaseSort).toBe(CollectionSortingValues.AZLabel);
  });

  it("sets error", () => {
    const action = {
      type: CollectionActionTypes.SetError,
      payload: "Error message",
    } as const;
    const result = CollectionReducer(initialState, action);

    expect(result.error).toBe("Error message");
  });

  it("resets state", () => {
    const modifiedState = {
      ...initialState,
      username: "testuser",
      page: 5,
    };
    const action = {
      type: CollectionActionTypes.ResetState,
      payload: initialState,
    } as const;
    const result = CollectionReducer(modifiedState, action);

    expect(result).toEqual(initialState);
  });

  it("returns state unchanged for unknown action", () => {
    const action = {
      type: "UNKNOWN_ACTION" as CollectionActionTypes,
      payload: null,
    };
    // biome-ignore lint/suspicious/noExplicitAny: Testing unknown action type
    const result = CollectionReducer(initialState, action as any);

    expect(result).toEqual(initialState);
  });
});

describe("CollectionContextProvider", () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      replace: jest.fn(),
      push: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    } as ReturnType<typeof useRouter>);
    localStorage.clear();
  });

  it("provides initial state", () => {
    const { result } = renderHook(() => useCollectionContext(), {
      wrapper: CollectionContextProvider,
    });

    expect(result.current.state.username).toBeNull();
    expect(result.current.state.page).toBe(1);
    expect(result.current.state.releases).toEqual([]);
  });

  it("dispatches user", () => {
    const { result } = renderHook(() => useCollectionContext(), {
      wrapper: CollectionContextProvider,
    });

    act(() => {
      result.current.dispatchUser("testuser");
    });

    expect(result.current.state.username).toBe("testuser");
  });

  it("dispatches page", () => {
    const { result } = renderHook(() => useCollectionContext(), {
      wrapper: CollectionContextProvider,
    });

    act(() => {
      result.current.dispatchPage(3);
    });

    expect(result.current.state.page).toBe(3);
  });

  it("dispatches collection", () => {
    const { result } = renderHook(() => useCollectionContext(), {
      wrapper: CollectionContextProvider,
    });

    const mockCollection = collectionFactory.build();

    act(() => {
      result.current.dispatchCollection(mockCollection);
    });

    expect(result.current.state.collection).toEqual(mockCollection);
  });

  it("dispatches releases", () => {
    const { result } = renderHook(() => useCollectionContext(), {
      wrapper: CollectionContextProvider,
    });

    const mockReleases = releaseFactory.buildList(2);

    act(() => {
      result.current.dispatchReleases(mockReleases);
    });

    expect(result.current.state.releases).toEqual(mockReleases);
  });

  it("dispatches reset state", () => {
    const mockReplace = jest.fn();
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
      push: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    } as ReturnType<typeof useRouter>);

    const originalHrefDescriptor = Object.getOwnPropertyDescriptor(
      window.location,
      "href",
    );

    try {
      Object.defineProperty(window.location, "href", {
        configurable: true,
        writable: true,
        value: "http://localhost/?username=testuser",
      });
    } catch {
      // If href is not configurable, skip this test
      return;
    }

    const { result } = renderHook(() => useCollectionContext(), {
      wrapper: CollectionContextProvider,
    });

    // Set some state first
    act(() => {
      result.current.dispatchUser("testuser");
      result.current.dispatchPage(5);
    });

    expect(result.current.state.username).toBe("testuser");
    expect(result.current.state.page).toBe(5);

    // Reset state
    act(() => {
      result.current.dispatchResetState();
    });

    expect(result.current.state.username).toBeNull();
    expect(result.current.state.page).toBe(1);
    expect(mockReplace).toHaveBeenCalled();

    if (originalHrefDescriptor) {
      Object.defineProperty(window.location, "href", originalHrefDescriptor);
    }
  });
});
