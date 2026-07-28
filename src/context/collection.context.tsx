"use client";

/**
 * Collection pagination metadata (Discogs API paging, fetch status, errors).
 * Release list and filters live in Jotai (`src/atoms/filters.atoms.ts`).
 */

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useReducer } from "react";
import type { PropsWithChildrenOnly } from "src/@types/react";
import { USERNAME_STORAGE_PARAM } from "src/constants";
import type { DiscogsCollection, DiscogsRelease } from "src/types";

export enum CollectionActionTypes {
  SetCollection = "SET_COLLECTION",
  SetFetchingCollection = "SET_FETCHING_COLLECTION",
  SetError = "SET_ERROR",
  ResetState = "RESET_STATE",
}

// Re-export types for backward compatibility
export type Release = DiscogsRelease;
export type Collection = DiscogsCollection;

export interface CollectionStateStore {
  collection: DiscogsCollection | null;
  fetchingCollection: boolean;
  error: string | null;
}

export type CollectionActions =
  | {
      type: CollectionActionTypes.SetCollection;
      payload: DiscogsCollection;
    }
  | {
      type: CollectionActionTypes.SetFetchingCollection;
      payload: boolean;
    }
  | {
      type: CollectionActionTypes.SetError;
      payload: string | null;
    }
  | {
      type: CollectionActionTypes.ResetState;
      payload: CollectionStateStore;
    };

export const CollectionReducer = (
  state: CollectionStateStore,
  action: CollectionActions,
) => {
  switch (action.type) {
    case CollectionActionTypes.SetCollection:
      if (state.collection === action.payload) {
        return state;
      }

      return {
        ...state,
        collection: action.payload,
      };
    case CollectionActionTypes.SetFetchingCollection:
      return {
        ...state,
        fetchingCollection: action.payload,
      };
    case CollectionActionTypes.SetError:
      return {
        ...state,
        error: action.payload,
      };
    case CollectionActionTypes.ResetState:
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};

const initialState: CollectionStateStore = {
  collection: null,
  fetchingCollection: true,
  error: null,
};

export interface CollectionProviderProps {
  state: CollectionStateStore;
  dispatchCollection: (collection: DiscogsCollection) => void;
  dispatchFetchingCollection: (fetching: boolean) => void;
  dispatchError: (error: string | null) => void;
  dispatchResetState: () => void;
}

const CollectionContext = createContext({} as CollectionProviderProps);

const resetCollectionState = ({
  router,
}: {
  router: ReturnType<typeof useRouter>;
}) => {
  const {
    location: { href },
    localStorage,
  } = window;

  const url = new URL(href);
  url.searchParams.delete("username");
  router.replace(url.toString());
  localStorage.removeItem(USERNAME_STORAGE_PARAM);
};

export const CollectionContextProvider = ({
  children,
}: PropsWithChildrenOnly) => {
  const [state, dispatch] = useReducer(CollectionReducer, initialState);
  const router = useRouter();

  const dispatchCollection = useCallback((collection: DiscogsCollection) => {
    dispatch({
      type: CollectionActionTypes.SetCollection,
      payload: collection,
    });
  }, []);

  const dispatchFetchingCollection = useCallback((fetching: boolean) => {
    dispatch({
      type: CollectionActionTypes.SetFetchingCollection,
      payload: fetching,
    });
  }, []);

  const dispatchError = useCallback((error: string | null) => {
    dispatch({
      type: CollectionActionTypes.SetError,
      payload: error,
    });
  }, []);

  const dispatchResetState = useCallback(() => {
    resetCollectionState({ router });
    dispatch({ type: CollectionActionTypes.ResetState, payload: initialState });
  }, [router]);

  return children ? (
    <CollectionContext.Provider
      value={{
        state,
        dispatchResetState,
        dispatchFetchingCollection,
        dispatchCollection,
        dispatchError,
      }}
    >
      {children}
    </CollectionContext.Provider>
  ) : null;
};

export const useCollectionContext = () => useContext(CollectionContext);
