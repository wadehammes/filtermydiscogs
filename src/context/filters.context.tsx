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
import { getAvailableFormats } from "src/utils/getAvailableFormats";
import { getAvailableStyles } from "src/utils/getAvailableStyles";
import { getAvailableYears } from "src/utils/getAvailableYears";
import { sortReleases as sortReleasesUtil } from "src/utils/sortReleases";

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
  selectedFormats: string[];
  selectedSort: SortValues;
  availableStyles: string[];
  availableYears: number[];
  availableFormats: string[];
  filteredReleases: DiscogsRelease[];
  allReleases: DiscogsRelease[];
  isRandomMode: boolean;
  randomRelease: DiscogsRelease | null;
  searchQuery: string;
  isSearching: boolean;
}

export enum FiltersActionTypes {
  SetAvailableStyles = "SET_AVAILABLE_STYLES",
  SetAvailableYears = "SET_AVAILABLE_YEARS",
  SetAvailableFormats = "SET_AVAILABLE_FORMATS",
  SetAllReleases = "SET_ALL_RELEASES",
  ToggleStyle = "TOGGLE_STYLE",
  ToggleYear = "TOGGLE_YEAR",
  ToggleFormat = "TOGGLE_FORMAT",
  SetSort = "SET_SORT",
  ClearStyles = "CLEAR_STYLES",
  SetStyles = "SET_STYLES",
  ClearYears = "CLEAR_YEARS",
  SetYears = "SET_YEARS",
  ClearFormats = "CLEAR_FORMATS",
  SetFormats = "SET_FORMATS",
  ToggleRandomMode = "TOGGLE_RANDOM_MODE",
  SetRandomRelease = "SET_RANDOM_RELEASE",
  ClearAllFilters = "CLEAR_ALL_FILTERS",
  SetSearchQuery = "SET_SEARCH_QUERY",
  SetSearching = "SET_SEARCHING",
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
      type: FiltersActionTypes.SetAvailableFormats;
      payload: string[];
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
      type: FiltersActionTypes.ToggleFormat;
      payload: string;
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
      type: FiltersActionTypes.ClearFormats;
      payload: undefined;
    }
  | {
      type: FiltersActionTypes.SetFormats;
      payload: string[];
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
    }
  | {
      type: FiltersActionTypes.SetSearching;
      payload: boolean;
    };

const getRandomRelease = (
  releases: DiscogsRelease[],
): DiscogsRelease | null => {
  if (releases.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * releases.length);
  return releases[randomIndex] || null;
};

// Helper function to handle random mode logic when filters change
const handleRandomModeAfterFilter = (
  isRandomMode: boolean,
  currentRandomRelease: DiscogsRelease | null,
  filteredReleases: DiscogsRelease[],
) => {
  if (isRandomMode && filteredReleases.length > 0) {
    const newRandomRelease = getRandomRelease(filteredReleases);
    return {
      filteredReleases: newRandomRelease ? [newRandomRelease] : [],
      randomRelease: newRandomRelease,
    };
  }

  return {
    filteredReleases,
    randomRelease: currentRandomRelease,
  };
};

// Use the shared filterReleases utility
const filterReleases = filterReleasesUtil;
const sortReleases = sortReleasesUtil;

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

    case FiltersActionTypes.SetAvailableFormats:
      return {
        ...state,
        availableFormats: action.payload,
      };

    case FiltersActionTypes.SetAllReleases: {
      const filteredReleases = filterReleases(
        action.payload,
        state.selectedStyles,
        state.selectedYears,
        state.selectedFormats,
        state.searchQuery,
      );
      const sortedReleases = sortReleases(filteredReleases, state.selectedSort);
      const availableStyles = getAvailableStyles(sortedReleases);
      const availableYears = getAvailableYears(sortedReleases);
      const availableFormats = getAvailableFormats(sortedReleases);

      return {
        ...state,
        allReleases: action.payload,
        filteredReleases: sortedReleases,
        availableStyles,
        availableYears,
        availableFormats,
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
        state.selectedFormats,
        state.searchQuery,
      );
      const newSortedReleases = sortReleases(
        newFilteredReleases,
        state.selectedSort,
      );
      const availableStyles = getAvailableStyles(newSortedReleases);
      const availableYears = getAvailableYears(newSortedReleases);
      const availableFormats = getAvailableFormats(newSortedReleases);

      const {
        filteredReleases: finalFilteredReleases,
        randomRelease: newRandomRelease,
      } = handleRandomModeAfterFilter(
        state.isRandomMode,
        state.randomRelease,
        newSortedReleases,
      );

      return {
        ...state,
        selectedStyles: newSelectedStyles,
        filteredReleases: finalFilteredReleases,
        availableStyles,
        availableYears,
        availableFormats,
        randomRelease: newRandomRelease,
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
        state.selectedFormats,
        state.searchQuery,
      );
      const newSortedReleases = sortReleases(
        newFilteredReleases,
        state.selectedSort,
      );
      const availableStyles = getAvailableStyles(newSortedReleases);
      const availableYears = getAvailableYears(newSortedReleases);
      const availableFormats = getAvailableFormats(newSortedReleases);

      const {
        filteredReleases: finalFilteredReleases,
        randomRelease: newRandomRelease,
      } = handleRandomModeAfterFilter(
        state.isRandomMode,
        state.randomRelease,
        newSortedReleases,
      );

      return {
        ...state,
        selectedYears: newSelectedYears,
        filteredReleases: finalFilteredReleases,
        availableStyles,
        availableYears,
        availableFormats,
        randomRelease: newRandomRelease,
      };
    }

    case FiltersActionTypes.ToggleFormat: {
      const newSelectedFormats = state.selectedFormats.includes(action.payload)
        ? state.selectedFormats.filter((format) => format !== action.payload)
        : [...state.selectedFormats, action.payload];

      const newFilteredReleases = filterReleases(
        state.allReleases,
        state.selectedStyles,
        state.selectedYears,
        newSelectedFormats,
        state.searchQuery,
      );
      const newSortedReleases = sortReleases(
        newFilteredReleases,
        state.selectedSort,
      );
      const availableStyles = getAvailableStyles(newSortedReleases);
      const availableYears = getAvailableYears(newSortedReleases);
      const availableFormats = getAvailableFormats(newSortedReleases);

      const {
        filteredReleases: finalFilteredReleases,
        randomRelease: newRandomRelease,
      } = handleRandomModeAfterFilter(
        state.isRandomMode,
        state.randomRelease,
        newSortedReleases,
      );

      return {
        ...state,
        selectedFormats: newSelectedFormats,
        filteredReleases: finalFilteredReleases,
        availableStyles,
        availableYears,
        availableFormats,
        randomRelease: newRandomRelease,
      };
    }

    case FiltersActionTypes.SetSort: {
      const filteredReleases = filterReleases(
        state.allReleases,
        state.selectedStyles,
        state.selectedYears,
        state.selectedFormats,
        state.searchQuery,
      );
      const sortedFilteredReleases = sortReleases(
        filteredReleases,
        action.payload,
      );

      const {
        filteredReleases: finalFilteredReleases,
        randomRelease: newRandomRelease,
      } = handleRandomModeAfterFilter(
        state.isRandomMode,
        state.randomRelease,
        sortedFilteredReleases,
      );

      return {
        ...state,
        selectedSort: action.payload,
        filteredReleases: finalFilteredReleases,
        randomRelease: newRandomRelease,
      };
    }

    case FiltersActionTypes.ClearStyles: {
      const newFilteredReleases = filterReleases(
        state.allReleases,
        [],
        state.selectedYears,
        state.selectedFormats,
        state.searchQuery,
      );
      const sortedReleases = sortReleases(
        newFilteredReleases,
        state.selectedSort,
      );
      const availableStyles = getAvailableStyles(sortedReleases);
      const availableYears = getAvailableYears(sortedReleases);
      const availableFormats = getAvailableFormats(sortedReleases);

      const {
        filteredReleases: finalFilteredReleases,
        randomRelease: newRandomRelease,
      } = handleRandomModeAfterFilter(
        state.isRandomMode,
        state.randomRelease,
        sortedReleases,
      );

      return {
        ...state,
        selectedStyles: [],
        filteredReleases: finalFilteredReleases,
        availableStyles,
        availableYears,
        availableFormats,
        randomRelease: newRandomRelease,
      };
    }

    case FiltersActionTypes.SetStyles: {
      const newFilteredReleases = filterReleases(
        state.allReleases,
        action.payload,
        state.selectedYears,
        state.selectedFormats,
        state.searchQuery,
      );
      const newSortedReleases = sortReleases(
        newFilteredReleases,
        state.selectedSort,
      );
      const availableStyles = getAvailableStyles(newSortedReleases);
      const availableYears = getAvailableYears(newSortedReleases);
      const availableFormats = getAvailableFormats(newSortedReleases);

      const {
        filteredReleases: finalFilteredReleases,
        randomRelease: newRandomRelease,
      } = handleRandomModeAfterFilter(
        state.isRandomMode,
        state.randomRelease,
        newSortedReleases,
      );

      return {
        ...state,
        selectedStyles: action.payload,
        filteredReleases: finalFilteredReleases,
        availableStyles,
        availableYears,
        availableFormats,
        randomRelease: newRandomRelease,
      };
    }

    case FiltersActionTypes.ClearYears: {
      const newFilteredReleases = filterReleases(
        state.allReleases,
        state.selectedStyles,
        [],
        state.selectedFormats,
        state.searchQuery,
      );
      const sortedReleases = sortReleases(
        newFilteredReleases,
        state.selectedSort,
      );
      const availableStyles = getAvailableStyles(sortedReleases);
      const availableYears = getAvailableYears(sortedReleases);
      const availableFormats = getAvailableFormats(sortedReleases);

      const {
        filteredReleases: finalFilteredReleases,
        randomRelease: newRandomRelease,
      } = handleRandomModeAfterFilter(
        state.isRandomMode,
        state.randomRelease,
        sortedReleases,
      );

      return {
        ...state,
        selectedYears: [],
        filteredReleases: finalFilteredReleases,
        availableStyles,
        availableYears,
        availableFormats,
        randomRelease: newRandomRelease,
      };
    }

    case FiltersActionTypes.SetYears: {
      const newFilteredReleases = filterReleases(
        state.allReleases,
        state.selectedStyles,
        action.payload,
        state.selectedFormats,
        state.searchQuery,
      );
      const newSortedReleases = sortReleases(
        newFilteredReleases,
        state.selectedSort,
      );
      const availableStyles = getAvailableStyles(newSortedReleases);
      const availableYears = getAvailableYears(newSortedReleases);
      const availableFormats = getAvailableFormats(newSortedReleases);

      const {
        filteredReleases: finalFilteredReleases,
        randomRelease: newRandomRelease,
      } = handleRandomModeAfterFilter(
        state.isRandomMode,
        state.randomRelease,
        newSortedReleases,
      );

      return {
        ...state,
        selectedYears: action.payload,
        filteredReleases: finalFilteredReleases,
        availableStyles,
        availableYears,
        availableFormats,
        randomRelease: newRandomRelease,
      };
    }

    case FiltersActionTypes.ClearFormats: {
      const newFilteredReleases = filterReleases(
        state.allReleases,
        state.selectedStyles,
        state.selectedYears,
        [],
        state.searchQuery,
      );
      const sortedReleases = sortReleases(
        newFilteredReleases,
        state.selectedSort,
      );
      const availableStyles = getAvailableStyles(sortedReleases);
      const availableYears = getAvailableYears(sortedReleases);
      const availableFormats = getAvailableFormats(sortedReleases);

      const {
        filteredReleases: finalFilteredReleases,
        randomRelease: newRandomRelease,
      } = handleRandomModeAfterFilter(
        state.isRandomMode,
        state.randomRelease,
        sortedReleases,
      );

      return {
        ...state,
        selectedFormats: [],
        filteredReleases: finalFilteredReleases,
        availableStyles,
        availableYears,
        availableFormats,
        randomRelease: newRandomRelease,
      };
    }

    case FiltersActionTypes.SetFormats: {
      const newFilteredReleases = filterReleases(
        state.allReleases,
        state.selectedStyles,
        state.selectedYears,
        action.payload,
        state.searchQuery,
      );
      const newSortedReleases = sortReleases(
        newFilteredReleases,
        state.selectedSort,
      );
      const availableStyles = getAvailableStyles(newSortedReleases);
      const availableYears = getAvailableYears(newSortedReleases);
      const availableFormats = getAvailableFormats(newSortedReleases);

      const {
        filteredReleases: finalFilteredReleases,
        randomRelease: newRandomRelease,
      } = handleRandomModeAfterFilter(
        state.isRandomMode,
        state.randomRelease,
        newSortedReleases,
      );

      return {
        ...state,
        selectedFormats: action.payload,
        filteredReleases: finalFilteredReleases,
        availableStyles,
        availableYears,
        availableFormats,
        randomRelease: newRandomRelease,
      };
    }

    case FiltersActionTypes.ToggleRandomMode: {
      const newIsRandomMode = !state.isRandomMode;
      let newFilteredReleases = state.filteredReleases;
      let newRandomRelease = state.randomRelease;

      if (newIsRandomMode) {
        // Entering random mode - get a random release from the FILTERED collection
        newRandomRelease = getRandomRelease(state.filteredReleases);
        newFilteredReleases = newRandomRelease ? [newRandomRelease] : [];
      } else {
        // Exiting random mode - restore all filtered releases
        newFilteredReleases = filterReleases(
          state.allReleases,
          state.selectedStyles,
          state.selectedYears,
          state.selectedFormats,
          state.searchQuery,
        );
        newRandomRelease = null;
      }

      const availableStyles = getAvailableStyles(newFilteredReleases);
      const availableYears = getAvailableYears(newFilteredReleases);
      const availableFormats = getAvailableFormats(newFilteredReleases);

      return {
        ...state,
        isRandomMode: newIsRandomMode,
        randomRelease: newRandomRelease,
        filteredReleases: newFilteredReleases,
        availableStyles,
        availableYears,
        availableFormats,
      };
    }

    case FiltersActionTypes.SetRandomRelease: {
      const newRandomRelease = action.payload;
      const newFilteredReleases = newRandomRelease
        ? [newRandomRelease]
        : state.filteredReleases;

      const availableStyles = getAvailableStyles(newFilteredReleases);
      const availableYears = getAvailableYears(newFilteredReleases);
      const availableFormats = getAvailableFormats(newFilteredReleases);

      return {
        ...state,
        randomRelease: newRandomRelease,
        filteredReleases: newFilteredReleases,
        availableStyles,
        availableYears,
        availableFormats,
      };
    }

    case FiltersActionTypes.ClearAllFilters: {
      const newFilteredReleases = filterReleases(
        state.allReleases,
        [],
        [],
        [],
        "",
      );
      const sortedReleases = sortReleases(
        newFilteredReleases,
        state.selectedSort,
      );

      return {
        ...state,
        selectedStyles: [],
        selectedYears: [],
        selectedFormats: [],
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
        state.selectedFormats,
        action.payload,
      );
      const sortedReleases = sortReleases(
        newFilteredReleases,
        state.selectedSort,
      );
      const availableStyles = getAvailableStyles(sortedReleases);
      const availableYears = getAvailableYears(sortedReleases);
      const availableFormats = getAvailableFormats(sortedReleases);

      const {
        filteredReleases: finalFilteredReleases,
        randomRelease: newRandomRelease,
      } = handleRandomModeAfterFilter(
        state.isRandomMode,
        state.randomRelease,
        sortedReleases,
      );

      return {
        ...state,
        searchQuery: action.payload,
        filteredReleases: finalFilteredReleases,
        availableStyles,
        availableYears,
        availableFormats,
        randomRelease: newRandomRelease,
        isSearching: false, // Clear searching state when search completes
      };
    }

    case FiltersActionTypes.SetSearching:
      return {
        ...state,
        isSearching: action.payload,
      };

    default:
      return state;
  }
};

const initialState: FiltersState = {
  selectedStyles: [],
  selectedYears: [],
  selectedFormats: [],
  selectedSort: SortValues.DateAddedNew,
  availableStyles: [],
  availableYears: [],
  availableFormats: [],
  filteredReleases: [],
  allReleases: [],
  isRandomMode: false,
  randomRelease: null,
  searchQuery: "",
  isSearching: false,
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
  const {
    allReleases,
    selectedStyles,
    selectedYears,
    selectedFormats,
    searchQuery,
    selectedSort,
  } = state;

  const filteredReleases = useMemo(() => {
    const filtered = filterReleases(
      allReleases,
      selectedStyles,
      selectedYears,
      selectedFormats,
      searchQuery,
    );
    return sortReleases(filtered, selectedSort);
  }, [
    allReleases,
    selectedStyles,
    selectedYears,
    selectedFormats,
    searchQuery,
    selectedSort,
  ]);

  return filteredReleases;
};
