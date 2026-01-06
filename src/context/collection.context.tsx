"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  type FC,
  useCallback,
  useContext,
  useReducer,
} from "react";
import type { PropsWithChildrenOnly } from "src/@types/react";
import { USERNAME_STORAGE_PARAM } from "src/constants";
import type { DiscogsCollection, DiscogsRelease } from "src/types";

export enum CollectionSortingValues {
  AZLabel = "AZLabel",
  ZALabel = "ZALabel",
  DateAddedNew = "DateAddedNew",
  DateAddedOld = "DateAddedOld",
  RatingHigh = "RatingHigh",
  RatingLow = "RatingLow",
  AlbumYearNew = "AlbumYearNew",
  AlbumYearOld = "AlbumYearOld",
}

export enum CollectionActionTypes {
  SetUser = "SET_USER",
  SetPage = "SET_PAGE",
  SetNextPageLink = "SET_NEXT_PAGE_LINK",
  SetCollection = "SET_COLLECTION",
  SetReleases = "SET_RELEASES",
  SetFetchingCollection = "SET_FETCHING_COLLECTION",
  SetFilteredReleases = "SET_FILTERED_RELEASES",
  SetReleaseStyles = "SET_RELEASE_STYLES",
  SetSelectedReleaseStyle = "SET_SELECTED_RELEASE_STYLE",
  SetSelectedReleaseSort = "SET_SELECTED_RELEASE_SORT",
  SetError = "SET_ERROR",
  ResetState = "RESET_STATE",
}

// Re-export types for backward compatibility
export type Release = DiscogsRelease;
export type Collection = DiscogsCollection;

export interface CollectionStateStore {
  username: string | null;
  page: number;
  nextPageLink: string | null;
  collection: DiscogsCollection | null;
  releases: DiscogsRelease[];
  fetchingCollection: boolean;
  filteredReleases: DiscogsRelease[];
  releaseStyles: string[];
  selectedReleaseStyle: string[];
  selectedReleaseSort: CollectionSortingValues;
  error: string | null;
}

export type CollectionActions =
  | {
      type: CollectionActionTypes.SetUser;
      payload: string | null;
    }
  | {
      type: CollectionActionTypes.SetPage;
      payload: number;
    }
  | {
      type: CollectionActionTypes.SetNextPageLink;
      payload: string | null;
    }
  | {
      type: CollectionActionTypes.SetCollection;
      payload: DiscogsCollection;
    }
  | {
      type: CollectionActionTypes.SetReleases;
      payload: DiscogsRelease[];
    }
  | {
      type: CollectionActionTypes.SetFetchingCollection;
      payload: boolean;
    }
  | {
      type: CollectionActionTypes.SetFilteredReleases;
      payload: DiscogsRelease[];
    }
  | {
      type: CollectionActionTypes.SetReleaseStyles;
      payload: string[];
    }
  | {
      type: CollectionActionTypes.SetSelectedReleaseStyle;
      payload: string[];
    }
  | {
      type: CollectionActionTypes.SetSelectedReleaseSort;
      payload: CollectionSortingValues;
    }
  | {
      type: CollectionActionTypes.ResetState;
      payload: CollectionStateStore;
    }
  | {
      type: CollectionActionTypes.SetError;
      payload: string | null;
    };

export const CollectionReducer = (
  state: CollectionStateStore,
  action: CollectionActions,
) => {
  switch (action.type) {
    case CollectionActionTypes.SetUser:
      return {
        ...state,
        username: action.payload,
      };
    case CollectionActionTypes.SetPage:
      return {
        ...state,
        page: action.payload,
      };
    case CollectionActionTypes.SetNextPageLink:
      return {
        ...state,
        nextPageLink: action.payload,
      };
    case CollectionActionTypes.SetCollection:
      return {
        ...state,
        collection: action.payload,
      };
    case CollectionActionTypes.SetReleases:
      return {
        ...state,
        releases: action.payload,
      };
    case CollectionActionTypes.SetFilteredReleases:
      return {
        ...state,
        filteredReleases: action.payload,
      };
    case CollectionActionTypes.SetFetchingCollection:
      return {
        ...state,
        fetchingCollection: action.payload,
      };
    case CollectionActionTypes.SetReleaseStyles:
      return {
        ...state,
        releaseStyles: action.payload,
      };
    case CollectionActionTypes.SetSelectedReleaseStyle:
      return {
        ...state,
        selectedReleaseStyle: action.payload,
      };
    case CollectionActionTypes.SetSelectedReleaseSort:
      return {
        ...state,
        selectedReleaseSort: action.payload,
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

export interface CollectionProviderProps {
  state: CollectionStateStore;
  dispatchUser: (user: string | null) => void;
  dispatchPage: (page: number) => void;
  dispatchNextPageLink: (link: string | null) => void;
  dispatchCollection: (collection: DiscogsCollection) => void;
  dispatchReleases: (releases: DiscogsRelease[]) => void;
  dispatchFetchingCollection: (fetching: boolean) => void;
  dispatchFilteredReleases: (releases: DiscogsRelease[]) => void;
  dispatchReleaseStyles: (styles: string[]) => void;
  dispatchSelectedReleaseStyle: (style: string[]) => void;
  dispatchSelectedReleaseSort: (sort: CollectionSortingValues) => void;
  dispatchError: (error: string | null) => void;
  dispatchResetState: () => void;
}

export const CollectionContext = createContext({} as CollectionProviderProps);

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

export const CollectionContextProvider: FC<PropsWithChildrenOnly> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(CollectionReducer, initialState);
  const router = useRouter();

  const dispatchUser = useCallback((user: string | null) => {
    dispatch({ type: CollectionActionTypes.SetUser, payload: user });
  }, []);

  const dispatchPage = useCallback((page: number) => {
    dispatch({ type: CollectionActionTypes.SetPage, payload: page });
  }, []);

  const dispatchNextPageLink = useCallback((link: string | null) => {
    dispatch({ type: CollectionActionTypes.SetNextPageLink, payload: link });
  }, []);

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

  const dispatchFilteredReleases = useCallback((releases: DiscogsRelease[]) => {
    dispatch({
      type: CollectionActionTypes.SetFilteredReleases,
      payload: releases,
    });
  }, []);

  const dispatchReleases = useCallback((releases: DiscogsRelease[]) => {
    dispatch({
      type: CollectionActionTypes.SetReleases,
      payload: releases,
    });
  }, []);

  const dispatchReleaseStyles = useCallback((styles: string[]) => {
    dispatch({
      type: CollectionActionTypes.SetReleaseStyles,
      payload: styles,
    });
  }, []);

  const dispatchSelectedReleaseStyle = useCallback((style: string[]) => {
    dispatch({
      type: CollectionActionTypes.SetSelectedReleaseStyle,
      payload: style,
    });
  }, []);

  const dispatchSelectedReleaseSort = useCallback(
    (sort: CollectionSortingValues) => {
      dispatch({
        type: CollectionActionTypes.SetSelectedReleaseSort,
        payload: sort,
      });
    },
    [],
  );

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
        dispatchUser,
        dispatchResetState,
        dispatchPage,
        dispatchNextPageLink,
        dispatchFetchingCollection,
        dispatchCollection,
        dispatchReleases,
        dispatchFilteredReleases,
        dispatchReleaseStyles,
        dispatchSelectedReleaseStyle,
        dispatchSelectedReleaseSort,
        dispatchError,
      }}
    >
      {children}
    </CollectionContext.Provider>
  ) : null;
};

export const useCollectionContext = () => useContext(CollectionContext);
