import {
  createContext,
  type FC,
  type PropsWithChildren,
  useContext,
  useMemo,
  useReducer,
} from "react";
import type { DiscogsRelease } from "src/types";
import { filterReleases as filterReleasesUtil } from "src/utils/filterReleases";
import { getAvailableStyles } from "src/utils/getAvailableStyles";
import { getAvailableYears } from "src/utils/getAvailableYears";

export enum SortValues {
  AZLabel = "AZLabel",
  ZALabel = "ZALabel",
  AZArtist = "AZArtist",
  ZAArtist = "ZAArtist",
  AZTitle = "AZTitle",
  ZATitle = "ZATitle",
  DateAddedNew = "DateAddedNew",
  DateAddedOld = "DateAddedOld",
  RatingHigh = "RatingHigh",
  RatingLow = "RatingLow",
  AlbumYearNew = "AlbumYearNew",
  AlbumYearOld = "AlbumYearOld",
}

export interface FiltersState {
  selectedStyles: string[];
  selectedYears: number[];
  selectedSort: SortValues;
  availableStyles: string[];
  availableYears: number[];
  filteredReleases: DiscogsRelease[];
  allReleases: DiscogsRelease[];
  isRandomMode: boolean;
  randomRelease: DiscogsRelease | null;
  searchQuery: string;
}

export enum FiltersActionTypes {
  SetAvailableStyles = "SET_AVAILABLE_STYLES",
  SetAvailableYears = "SET_AVAILABLE_YEARS",
  SetAllReleases = "SET_ALL_RELEASES",
  ToggleStyle = "TOGGLE_STYLE",
  ToggleYear = "TOGGLE_YEAR",
  SetSort = "SET_SORT",
  ClearStyles = "CLEAR_STYLES",
  SetStyles = "SET_STYLES",
  ClearYears = "CLEAR_YEARS",
  SetYears = "SET_YEARS",
  ToggleRandomMode = "TOGGLE_RANDOM_MODE",
  SetRandomRelease = "SET_RANDOM_RELEASE",
  ClearAllFilters = "CLEAR_ALL_FILTERS",
  SetSearchQuery = "SET_SEARCH_QUERY",
}

export type FiltersActions =
  | {
      type: FiltersActionTypes.SetAvailableStyles;
      payload: string[];
    }
  | {
      type: FiltersActionTypes.SetAvailableYears;
      payload: number[];
    }
  | {
      type: FiltersActionTypes.SetAllReleases;
      payload: DiscogsRelease[];
    }
  | {
      type: FiltersActionTypes.ToggleStyle;
      payload: string;
    }
  | {
      type: FiltersActionTypes.ToggleYear;
      payload: number;
    }
  | {
      type: FiltersActionTypes.SetSort;
      payload: SortValues;
    }
  | {
      type: FiltersActionTypes.ClearStyles;
      payload: undefined;
    }
  | {
      type: FiltersActionTypes.SetStyles;
      payload: string[];
    }
  | {
      type: FiltersActionTypes.ClearYears;
      payload: undefined;
    }
  | {
      type: FiltersActionTypes.SetYears;
      payload: number[];
    }
  | {
      type: FiltersActionTypes.ToggleRandomMode;
      payload: undefined;
    }
  | {
      type: FiltersActionTypes.SetRandomRelease;
      payload: DiscogsRelease | null;
    }
  | {
      type: FiltersActionTypes.ClearAllFilters;
      payload: undefined;
    }
  | {
      type: FiltersActionTypes.SetSearchQuery;
      payload: string;
    };

const getRandomRelease = (
  releases: DiscogsRelease[],
): DiscogsRelease | null => {
  if (releases.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * releases.length);
  return releases[randomIndex] || null;
};

// Use the shared filterReleases utility
const filterReleases = filterReleasesUtil;

// Client-side sorting is now handled by the Discogs API
// This function is kept for backward compatibility but returns releases as-is
const sortReleases = (releases: DiscogsRelease[]): DiscogsRelease[] => {
  // Server-side sorting is now handled by the Discogs API
  // No need to sort client-side anymore
  return releases;
};

const filtersReducer = (
  state: FiltersState,
  action: FiltersActions,
): FiltersState => {
  switch (action.type) {
    case FiltersActionTypes.SetAvailableStyles:
      return {
        ...state,
        availableStyles: action.payload,
      };

    case FiltersActionTypes.SetAvailableYears:
      return {
        ...state,
        availableYears: action.payload,
      };

    case FiltersActionTypes.SetAllReleases: {
      const filteredReleases = filterReleases(
        action.payload,
        state.selectedStyles,
        state.selectedYears,
        state.searchQuery,
      );
      const sortedReleases = sortReleases(filteredReleases);
      const availableStyles = getAvailableStyles(sortedReleases);
      const availableYears = getAvailableYears(sortedReleases);

      return {
        ...state,
        allReleases: action.payload,
        filteredReleases: sortedReleases,
        availableStyles,
        availableYears,
      };
    }

    case FiltersActionTypes.ToggleStyle: {
      const newSelectedStyles = state.selectedStyles.includes(action.payload)
        ? state.selectedStyles.filter((style) => style !== action.payload)
        : [...state.selectedStyles, action.payload];

      const newFilteredReleases = filterReleases(
        state.allReleases,
        newSelectedStyles,
        state.selectedYears,
        state.searchQuery,
      );
      const newSortedReleases = sortReleases(newFilteredReleases);
      const availableStyles = getAvailableStyles(newSortedReleases);
      const availableYears = getAvailableYears(newSortedReleases);

      return {
        ...state,
        selectedStyles: newSelectedStyles,
        filteredReleases: newSortedReleases,
        availableStyles,
        availableYears,
      };
    }

    case FiltersActionTypes.ToggleYear: {
      const newSelectedYears = state.selectedYears.includes(action.payload)
        ? state.selectedYears.filter((year) => year !== action.payload)
        : [...state.selectedYears, action.payload];

      const newFilteredReleases = filterReleases(
        state.allReleases,
        state.selectedStyles,
        newSelectedYears,
        state.searchQuery,
      );
      const newSortedReleases = sortReleases(newFilteredReleases);
      const availableStyles = getAvailableStyles(newSortedReleases);
      const availableYears = getAvailableYears(newSortedReleases);

      return {
        ...state,
        selectedYears: newSelectedYears,
        filteredReleases: newSortedReleases,
        availableStyles,
        availableYears,
      };
    }

    case FiltersActionTypes.SetSort: {
      const sortedFilteredReleases = sortReleases(state.filteredReleases);

      return {
        ...state,
        selectedSort: action.payload,
        filteredReleases: sortedFilteredReleases,
      };
    }

    case FiltersActionTypes.ClearStyles: {
      const newFilteredReleases = filterReleases(
        state.allReleases,
        [],
        state.selectedYears,
        state.searchQuery,
      );
      const sortedReleases = sortReleases(newFilteredReleases);

      const availableStyles = getAvailableStyles(sortedReleases);
      const availableYears = getAvailableYears(sortedReleases);

      return {
        ...state,
        selectedStyles: [],
        filteredReleases: sortedReleases,
        availableStyles,
        availableYears,
        isRandomMode: false,
        randomRelease: null,
      };
    }

    case FiltersActionTypes.SetStyles: {
      const newFilteredReleases = filterReleases(
        state.allReleases,
        action.payload,
        state.selectedYears,
        state.searchQuery,
      );
      const newSortedReleases = sortReleases(newFilteredReleases);
      const availableStyles = getAvailableStyles(newSortedReleases);
      const availableYears = getAvailableYears(newSortedReleases);

      return {
        ...state,
        selectedStyles: action.payload,
        filteredReleases: newSortedReleases,
        availableStyles,
        availableYears,
        isRandomMode: false,
        randomRelease: null,
      };
    }

    case FiltersActionTypes.ClearYears: {
      const newFilteredReleases = filterReleases(
        state.allReleases,
        state.selectedStyles,
        [],
        state.searchQuery,
      );
      const sortedReleases = sortReleases(newFilteredReleases);
      const availableStyles = getAvailableStyles(sortedReleases);
      const availableYears = getAvailableYears(sortedReleases);

      return {
        ...state,
        selectedYears: [],
        filteredReleases: sortedReleases,
        availableStyles,
        availableYears,
        isRandomMode: false,
        randomRelease: null,
      };
    }

    case FiltersActionTypes.SetYears: {
      const newFilteredReleases = filterReleases(
        state.allReleases,
        state.selectedStyles,
        action.payload,
        state.searchQuery,
      );
      const newSortedReleases = sortReleases(newFilteredReleases);
      const availableStyles = getAvailableStyles(newSortedReleases);
      const availableYears = getAvailableYears(newSortedReleases);

      return {
        ...state,
        selectedYears: action.payload,
        filteredReleases: newSortedReleases,
        availableStyles,
        availableYears,
        isRandomMode: false,
        randomRelease: null,
      };
    }

    case FiltersActionTypes.ToggleRandomMode: {
      const newIsRandomMode = !state.isRandomMode;
      let newFilteredReleases = state.filteredReleases;
      let newRandomRelease = state.randomRelease;

      if (newIsRandomMode) {
        // Entering random mode - get a random release from current filtered releases
        const currentFiltered = filterReleases(
          state.allReleases,
          state.selectedStyles,
          state.selectedYears,
          state.searchQuery,
        );
        newRandomRelease = getRandomRelease(currentFiltered);
        newFilteredReleases = newRandomRelease ? [newRandomRelease] : [];
      } else {
        // Exiting random mode - restore all filtered releases
        newFilteredReleases = filterReleases(
          state.allReleases,
          state.selectedStyles,
          state.selectedYears,
          state.searchQuery,
        );
        newRandomRelease = null;
      }

      return {
        ...state,
        isRandomMode: newIsRandomMode,
        randomRelease: newRandomRelease,
        filteredReleases: newFilteredReleases,
      };
    }

    case FiltersActionTypes.SetRandomRelease: {
      const newRandomRelease = action.payload;
      const newFilteredReleases = newRandomRelease
        ? [newRandomRelease]
        : state.filteredReleases;

      return {
        ...state,
        randomRelease: newRandomRelease,
        filteredReleases: newFilteredReleases,
      };
    }

    case FiltersActionTypes.ClearAllFilters: {
      const newFilteredReleases = filterReleases(state.allReleases, [], [], "");
      const sortedReleases = sortReleases(newFilteredReleases);

      return {
        ...state,
        selectedStyles: [],
        selectedYears: [],
        searchQuery: "",
        filteredReleases: sortedReleases,
        isRandomMode: false,
        randomRelease: null,
      };
    }

    case FiltersActionTypes.SetSearchQuery: {
      const newFilteredReleases = filterReleases(
        state.allReleases,
        state.selectedStyles,
        state.selectedYears,
        action.payload,
      );
      const sortedReleases = sortReleases(newFilteredReleases);
      const availableStyles = getAvailableStyles(sortedReleases);
      const availableYears = getAvailableYears(sortedReleases);

      return {
        ...state,
        searchQuery: action.payload,
        filteredReleases: sortedReleases,
        availableStyles,
        availableYears,
        isRandomMode: false,
        randomRelease: null,
      };
    }

    default:
      return state;
  }
};

const initialState: FiltersState = {
  selectedStyles: [],
  selectedYears: [],
  selectedSort: SortValues.DateAddedNew,
  availableStyles: [],
  availableYears: [],
  filteredReleases: [],
  allReleases: [],
  isRandomMode: false,
  randomRelease: null,
  searchQuery: "",
};

const FiltersContext = createContext<{
  state: FiltersState;
  dispatch: React.Dispatch<FiltersActions>;
} | null>(null);

export const FiltersProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(filtersReducer, initialState);

  return (
    <FiltersContext.Provider value={{ state, dispatch }}>
      {children}
    </FiltersContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error("useFilters must be used within a FiltersProvider");
  }
  return context;
};

export const useMemoizedFilteredReleases = () => {
  const { state } = useFilters();
  const { allReleases, selectedStyles, selectedYears, searchQuery } = state;

  const filteredReleases = useMemo(() => {
    const filtered = filterReleases(
      allReleases,
      selectedStyles,
      selectedYears,
      searchQuery,
    );
    return sortReleases(filtered);
  }, [allReleases, selectedStyles, selectedYears, searchQuery]);

  return filteredReleases;
};
