import { beforeEach, describe, expect, it } from "@jest/globals";
import { useRouter } from "next/navigation";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { createMockAppRouter } from "src/tests/mocks/mockAppRouter.mock";
import { act, renderHook, TestProviders } from "test-utils";
import {
  CollectionActionTypes,
  CollectionReducer,
  useCollectionContext,
} from "./collection.context";

const mockUseRouter = jest.mocked(useRouter);

describe("CollectionReducer", () => {
  const initialState = {
    collection: null,
    fetchingCollection: true,
    error: null,
  };

  it("sets collection", () => {
    const mockCollection = collectionFactory.build();
    const action = {
      type: CollectionActionTypes.SetCollection,
      payload: mockCollection,
    } as const;
    const result = CollectionReducer(initialState, action);

    expect(result.collection).toEqual(mockCollection);
  });

  it("returns state unchanged when collection payload is identical", () => {
    const mockCollection = collectionFactory.build();
    const state = {
      ...initialState,
      collection: mockCollection,
    };
    const action = {
      type: CollectionActionTypes.SetCollection,
      payload: mockCollection,
    } as const;
    const result = CollectionReducer(state, action);

    expect(result).toBe(state);
  });

  it("sets fetching collection state", () => {
    const action = {
      type: CollectionActionTypes.SetFetchingCollection,
      payload: false,
    } as const;
    const result = CollectionReducer(initialState, action);

    expect(result.fetchingCollection).toBe(false);
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
      fetchingCollection: false,
      error: "Error message",
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
    mockUseRouter.mockReturnValue(createMockAppRouter());
    localStorage.clear();
  });

  it("provides initial state", () => {
    const { result } = renderHook(() => useCollectionContext(), {
      wrapper: ({ children }) => (
        <TestProviders includeCollectionSync={false}>{children}</TestProviders>
      ),
    });

    expect(result.current.state.collection).toBeNull();
    expect(result.current.state.fetchingCollection).toBe(true);
    expect(result.current.state.error).toBeNull();
  });

  it("dispatches collection", () => {
    const { result } = renderHook(() => useCollectionContext(), {
      wrapper: TestProviders,
    });

    const mockCollection = collectionFactory.build();

    act(() => {
      result.current.dispatchCollection(mockCollection);
    });

    expect(result.current.state.collection).toEqual(mockCollection);
  });

  it("dispatches reset state", () => {
    const mockReplace = jest.fn();
    mockUseRouter.mockReturnValue(
      createMockAppRouter({ replace: mockReplace }),
    );

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
      return;
    }

    const { result } = renderHook(() => useCollectionContext(), {
      wrapper: TestProviders,
    });

    act(() => {
      result.current.dispatchError("Error message");
      result.current.dispatchFetchingCollection(false);
    });

    expect(result.current.state.error).toBe("Error message");
    expect(result.current.state.fetchingCollection).toBe(false);

    act(() => {
      result.current.dispatchResetState();
    });

    expect(result.current.state.error).toBeNull();
    expect(result.current.state.fetchingCollection).toBe(true);
    expect(mockReplace).toHaveBeenCalled();

    if (originalHrefDescriptor) {
      Object.defineProperty(window.location, "href", originalHrefDescriptor);
    }
  });
});
