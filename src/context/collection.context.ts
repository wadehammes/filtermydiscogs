import {
  createContext,
  useContext,
  useReducer,
  FC,
  Dispatch,
  SetStateAction,
} from "react";
import { PropsWithChildrenOnly } from "src/@types/react";
import { LOAD_RELEASES_TEXT } from "src/utils/constants";

enum CollectionSortingValues {
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
  username: string;
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
}

export enum CollectionActionTypes {
  SetUser = "SetUser",
  SetPage = "SetPage",
  SetNextPageLink = "SetNextPageLink",
  SetCollection = "SetCollection",
  SetReleases = "SetReleases",
  SetFetchingCollection = "SetFetchingCollection",
  SetFilteredReleases = "SetFilteredReleases",
  SetReleaseStyles = "SetReleaseStyles",
  SetSelectedReleaseStyle = "SetSelectedReleaseStyle",
  SetLoadMoreReleasesText = "SetLoadMoreReleasesText",
  SetSelectedReleaseSort = "SetSelectedReleaseSort",
}

export type CollectionActions =
  | {
      type: CollectionActionTypes.SetUser;
      payload: string;
    }
  | {
      type: CollectionActionTypes.SetPage;
      payload: number;
    }
  | {
      type: CollectionActionTypes.SetNextPageLink;
      payload: string;
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
    };

export interface CollectionProviderProps {
  state: CollectionStateStore;
  dispatch: Dispatch<SetStateAction<CollectionActionTypes>>;
}

export const CollectionReducer = (
  state: CollectionStateStore,
  action: CollectionActions
) => {
  switch (action.type) {
    case CollectionActionTypes.SetUser:
      return {
        ...state,
        user: action.payload,
      };
    case CollectionActionTypes.SetPage:
      return {
        ...state,
        page: action.payload,
      };
    case CollectionActionTypes.SetNextPageLink:
      return {
        ...state,
        nextpageLink: action.payload,
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
    case CollectionActionTypes.SetCollection:
      return {
        ...state,
        selectedReleaseSort: action.payload,
      };
    case CollectionActionTypes.SetLoadMoreReleasesText:
      return {
        ...state,
        loadMoreReleasesText: action.payload,
      };
    default:
      return state;
  }
};

const initialState: CollectionStateStore = {
  username: "",
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
};

export const CollectionContext = createContext({} as CollectionProviderProps);

export const CollectionContextProvider: FC<PropsWithChildrenOnly> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(CollectionReducer, initialState);

  return children ? (
    <CollectionContext.Provider value={{ state, dispatch }}>
      {children}
    </CollectionContext.Provider>
  ) : null;
};

export const useReleasesContext = () => useContext(CollectionContext);
