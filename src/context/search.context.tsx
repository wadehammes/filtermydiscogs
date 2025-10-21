import {
  createContext,
  type FC,
  type PropsWithChildren,
  useContext,
  useReducer,
} from "react";
import type { DiscogsSearchResult } from "src/types";

export interface SearchState {
  query: string;
  isSearching: boolean;
  searchResults: DiscogsSearchResult[];
  totalResults: number;
  currentPage: number;
  hasSearched: boolean;
}

export enum SearchActionTypes {
  SetQuery = "SET_QUERY",
  SetSearching = "SET_SEARCHING",
  SetSearchResults = "SET_SEARCH_RESULTS",
  ClearSearch = "CLEAR_SEARCH",
  SetPage = "SET_PAGE",
}

export type SearchActions =
  | {
      type: SearchActionTypes.SetQuery;
      payload: string;
    }
  | {
      type: SearchActionTypes.SetSearching;
      payload: boolean;
    }
  | {
      type: SearchActionTypes.SetSearchResults;
      payload: {
        results: DiscogsSearchResult[];
        totalResults: number;
        page: number;
      };
    }
  | {
      type: SearchActionTypes.ClearSearch;
      payload: undefined;
    }
  | {
      type: SearchActionTypes.SetPage;
      payload: number;
    };

const searchReducer = (
  state: SearchState,
  action: SearchActions,
): SearchState => {
  switch (action.type) {
    case SearchActionTypes.SetQuery:
      return {
        ...state,
        query: action.payload,
        hasSearched: false,
      };

    case SearchActionTypes.SetSearching:
      return {
        ...state,
        isSearching: action.payload,
      };

    case SearchActionTypes.SetSearchResults:
      return {
        ...state,
        searchResults: action.payload.results,
        totalResults: action.payload.totalResults,
        currentPage: action.payload.page,
        isSearching: false,
        hasSearched: true,
      };

    case SearchActionTypes.ClearSearch:
      return {
        ...state,
        query: "",
        searchResults: [],
        totalResults: 0,
        currentPage: 1,
        isSearching: false,
        hasSearched: false,
      };

    case SearchActionTypes.SetPage:
      return {
        ...state,
        currentPage: action.payload,
      };

    default:
      return state;
  }
};

const initialState: SearchState = {
  query: "",
  isSearching: false,
  searchResults: [],
  totalResults: 0,
  currentPage: 1,
  hasSearched: false,
};

const SearchContext = createContext<{
  state: SearchState;
  dispatch: React.Dispatch<SearchActions>;
} | null>(null);

export const SearchProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(searchReducer, initialState);

  return (
    <SearchContext.Provider value={{ state, dispatch }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};
