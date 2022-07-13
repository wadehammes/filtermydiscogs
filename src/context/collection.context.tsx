import { createContext, useContext, useReducer, FC, useCallback } from "react";
import { PropsWithChildrenOnly } from "src/@types/react";
import { LOAD_RELEASES_TEXT } from "src/constants";

export enum CollectionSortingValues {
  AZLabel = "AZLabel",
  ZALabel = "ZALabel",
  DateAddedNew = "DateAddedNew",
  DateAddedOld = "DateAddedOld",
  RatingHigh = "RatingHigh",
  RatingLow = "RatingLow",
}

export interface SortMenuItem {
  name: string;
  value: CollectionSortingValues;
}

export interface Release {
  instance_id: string;
  date_added: string;
  rating: string;
  basic_information: {
    resource_url: string;
    styles: string[];
    master_id: number;
    master_url: null;
    thumb: string;
    cover_image: string;
    title: string;
    year: number;
    formats: {
      name: string;
    }[];
    labels: {
      name: string;
    }[];
    artists: {
      name: string;
    }[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ReleaseJson {
  uri: string;
  [key: string]: unknown;
}

export interface Collection {
  pagination: {
    pages: number;
    items: number;
    urls: {
      next: string;
      prev: string;
    };
    [key: string]: unknown;
  };
  releases: Release[];
}

export interface CollectionStateStore {
  username: string | null;
  page: number;
  nextPageLink: string | null;
  collection: Collection | null;
  releases: Release[];
  fetchingCollection: boolean;
  filteredReleases: Release[];
  releaseStyles: string[];
  selectedReleaseStyle: string;
  loadMoreReleasesText: string;
  selectedReleaseSort: CollectionSortingValues;
  error: string | null;
}

export enum CollectionActionTypes {
  SetUser = "SetUser",
  SetPage = "SetPage",
  SetError = "SetError",
  SetNextPageLink = "SetNextPageLink",
  SetCollection = "SetCollection",
  SetReleases = "SetReleases",
  SetFetchingCollection = "SetFetchingCollection",
  SetFilteredReleases = "SetFilteredReleases",
  SetReleaseStyles = "SetReleaseStyles",
  SetSelectedReleaseStyle = "SetSelectedReleaseStyle",
  SetLoadMoreReleasesText = "SetLoadMoreReleasesText",
  SetSelectedReleaseSort = "SetSelectedReleaseSort",
  ResetState = "ResetState",
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
      payload: Collection;
    }
  | {
      type: CollectionActionTypes.SetReleases;
      payload: Release[];
    }
  | {
      type: CollectionActionTypes.SetFetchingCollection;
      payload: boolean;
    }
  | {
      type: CollectionActionTypes.SetFilteredReleases;
      payload: Release[];
    }
  | {
      type: CollectionActionTypes.SetReleaseStyles;
      payload: string[];
    }
  | {
      type: CollectionActionTypes.SetSelectedReleaseStyle;
      payload: string;
    }
  | {
      type: CollectionActionTypes.SetLoadMoreReleasesText;
      payload: string;
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
  action: CollectionActions
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
    case CollectionActionTypes.SetLoadMoreReleasesText:
      return {
        ...state,
        loadMoreReleasesText: action.payload,
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
  selectedReleaseStyle: "All",
  loadMoreReleasesText: LOAD_RELEASES_TEXT,
  selectedReleaseSort: CollectionSortingValues.DateAddedNew,
  error: null,
};

export interface CollectionProviderProps {
  state: CollectionStateStore;
  dispatchUser: (user: string | null) => void;
  dispatchPage: (page: number) => void;
  dispatchNextPageLink: (link: string | null) => void;
  dispatchCollection: (collection: Collection) => void;
  dispatchReleases: (releases: Release[]) => void;
  dispatchFetchingCollection: (fetching: boolean) => void;
  dispatchFilteredReleases: (releases: Release[]) => void;
  dispatchReleaseStyles: (styles: string[]) => void;
  dispatchSelectedReleaseStyle: (style: string) => void;
  dispatchLoadMoreReleaseText: (text: string) => void;
  dispatchSelectedReleaseSort: (sort: CollectionSortingValues) => void;
  dispatchError: (error: string | null) => void;
  dispatchResetState: () => void;
}

export const CollectionContext = createContext({} as CollectionProviderProps);

export const CollectionContextProvider: FC<PropsWithChildrenOnly> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(CollectionReducer, initialState);

  const dispatchUser = useCallback(
    (user: string | null) => {
      dispatch({ type: CollectionActionTypes.SetUser, payload: user });
    },
    [dispatch]
  );

  const dispatchPage = useCallback(
    (page: number) => {
      dispatch({ type: CollectionActionTypes.SetPage, payload: page });
    },
    [dispatch]
  );

  const dispatchNextPageLink = useCallback(
    (link: string | null) => {
      dispatch({ type: CollectionActionTypes.SetNextPageLink, payload: link });
    },
    [dispatch]
  );

  const dispatchCollection = useCallback(
    (collection: Collection) => {
      dispatch({
        type: CollectionActionTypes.SetCollection,
        payload: collection,
      });
    },
    [dispatch]
  );

  const dispatchFetchingCollection = useCallback(
    (fetching: boolean) => {
      dispatch({
        type: CollectionActionTypes.SetFetchingCollection,
        payload: fetching,
      });
    },
    [dispatch]
  );

  const dispatchFilteredReleases = useCallback(
    (releases: Release[]) => {
      dispatch({
        type: CollectionActionTypes.SetFilteredReleases,
        payload: releases,
      });
    },
    [dispatch]
  );

  const dispatchReleases = useCallback(
    (releases: Release[]) => {
      dispatch({
        type: CollectionActionTypes.SetReleases,
        payload: releases,
      });
    },
    [dispatch]
  );

  const dispatchReleaseStyles = useCallback(
    (styles: string[]) => {
      dispatch({
        type: CollectionActionTypes.SetReleaseStyles,
        payload: styles,
      });
    },
    [dispatch]
  );

  const dispatchSelectedReleaseStyle = useCallback(
    (style: string) => {
      dispatch({
        type: CollectionActionTypes.SetSelectedReleaseStyle,
        payload: style,
      });
    },
    [dispatch]
  );

  const dispatchSelectedReleaseSort = useCallback(
    (sort: CollectionSortingValues) => {
      dispatch({
        type: CollectionActionTypes.SetSelectedReleaseSort,
        payload: sort,
      });
    },
    [dispatch]
  );

  const dispatchLoadMoreReleaseText = useCallback(
    (text: string) => {
      dispatch({
        type: CollectionActionTypes.SetLoadMoreReleasesText,
        payload: text,
      });
    },
    [dispatch]
  );

  const dispatchError = useCallback(
    (error: string | null) => {
      dispatch({
        type: CollectionActionTypes.SetError,
        payload: error,
      });
    },
    [dispatch]
  );

  const dispatchResetState = useCallback(() => {
    dispatch({ type: CollectionActionTypes.ResetState, payload: initialState });
  }, [dispatch]);

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
        dispatchLoadMoreReleaseText,
        dispatchError,
      }}
    >
      {children}
    </CollectionContext.Provider>
  ) : null;
};

export const useCollectionContext = () => useContext(CollectionContext);
