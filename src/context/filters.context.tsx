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

export type StyleOperator = "AND" | "OR" | "NONE";

export interface FiltersState {
  selectedStyles: string[];
  selectedYears: number[];
  selectedFormats: string[];
  selectedSort: SortValues;
  styleOperator: StyleOperator;
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
  SetStyleOperator = "SET_STYLE_OPERATOR",
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
      type: FiltersActionTypes.SetStyleOperator;
      payload: StyleOperator;
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

const getRandomRelease = ({
  releases,
}: {
  releases: DiscogsRelease[];
}): DiscogsRelease | null => {
  if (releases.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * releases.length);
  return releases[randomIndex] || null;
};

// Helper function to handle random mode logic when filters change
const handleRandomModeAfterFilter = ({
  isRandomMode,
  currentRandomRelease,
  filteredReleases,
}: {
  isRandomMode: boolean;
  currentRandomRelease: DiscogsRelease | null;
  filteredReleases: DiscogsRelease[];
}) => {
  if (isRandomMode && filteredReleases.length > 0) {
    const newRandomRelease = getRandomRelease({ releases: filteredReleases });
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

// Helper function to compute filtered, sorted releases and available options
const computeFilteredState = ({
  allReleases,
  selectedStyles,
  selectedYears,
  selectedFormats,
  searchQuery,
  selectedSort,
  styleOperator,
  isRandomMode,
  currentRandomRelease,
}: {
  allReleases: DiscogsRelease[];
  selectedStyles: string[];
  selectedYears: number[];
  selectedFormats: string[];
  searchQuery: string;
  selectedSort: SortValues;
  styleOperator: StyleOperator;
  isRandomMode: boolean;
  currentRandomRelease: DiscogsRelease | null;
}) => {
  const filtered = filterReleases({
    releases: allReleases,
    selectedStyles,
    selectedYears,
    selectedFormats,
    searchQuery,
    styleOperator,
  });
  const sorted = sortReleases(filtered, selectedSort);
  const availableStyles = getAvailableStyles(allReleases);
  const availableYears = getAvailableYears(allReleases);
  const availableFormats = getAvailableFormats(sorted);

  const {
    filteredReleases: finalFilteredReleases,
    randomRelease: newRandomRelease,
  } = handleRandomModeAfterFilter({
    isRandomMode,
    currentRandomRelease,
    filteredReleases: sorted,
  });

  return {
    filteredReleases: finalFilteredReleases,
    availableStyles,
    availableYears,
    availableFormats,
    randomRelease: newRandomRelease,
  };
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

    case FiltersActionTypes.SetAvailableFormats:
      return {
        ...state,
        availableFormats: action.payload,
      };

    case FiltersActionTypes.SetAllReleases: {
      const computed = computeFilteredState({
        allReleases: action.payload,
        selectedStyles: state.selectedStyles,
        selectedYears: state.selectedYears,
        selectedFormats: state.selectedFormats,
        searchQuery: state.searchQuery,
        selectedSort: state.selectedSort,
        styleOperator: state.styleOperator,
        isRandomMode: state.isRandomMode,
        currentRandomRelease: state.randomRelease,
      });

      return {
        ...state,
        allReleases: action.payload,
        ...computed,
      };
    }

    case FiltersActionTypes.ToggleStyle: {
      const newSelectedStyles = state.selectedStyles.includes(action.payload)
        ? state.selectedStyles.filter((style) => style !== action.payload)
        : [...state.selectedStyles, action.payload];

      const computed = computeFilteredState({
        allReleases: state.allReleases,
        selectedStyles: newSelectedStyles,
        selectedYears: state.selectedYears,
        selectedFormats: state.selectedFormats,
        searchQuery: state.searchQuery,
        selectedSort: state.selectedSort,
        styleOperator: state.styleOperator,
        isRandomMode: state.isRandomMode,
        currentRandomRelease: state.randomRelease,
      });

      return {
        ...state,
        selectedStyles: newSelectedStyles,
        ...computed,
      };
    }

    case FiltersActionTypes.ToggleYear: {
      const newSelectedYears = state.selectedYears.includes(action.payload)
        ? state.selectedYears.filter((year) => year !== action.payload)
        : [...state.selectedYears, action.payload];

      const computed = computeFilteredState({
        allReleases: state.allReleases,
        selectedStyles: state.selectedStyles,
        selectedYears: newSelectedYears,
        selectedFormats: state.selectedFormats,
        searchQuery: state.searchQuery,
        selectedSort: state.selectedSort,
        styleOperator: state.styleOperator,
        isRandomMode: state.isRandomMode,
        currentRandomRelease: state.randomRelease,
      });

      return {
        ...state,
        selectedYears: newSelectedYears,
        ...computed,
      };
    }

    case FiltersActionTypes.ToggleFormat: {
      const newSelectedFormats = state.selectedFormats.includes(action.payload)
        ? state.selectedFormats.filter((format) => format !== action.payload)
        : [...state.selectedFormats, action.payload];

      const computed = computeFilteredState({
        allReleases: state.allReleases,
        selectedStyles: state.selectedStyles,
        selectedYears: state.selectedYears,
        selectedFormats: newSelectedFormats,
        searchQuery: state.searchQuery,
        selectedSort: state.selectedSort,
        styleOperator: state.styleOperator,
        isRandomMode: state.isRandomMode,
        currentRandomRelease: state.randomRelease,
      });

      return {
        ...state,
        selectedFormats: newSelectedFormats,
        ...computed,
      };
    }

    case FiltersActionTypes.SetSort: {
      const computed = computeFilteredState({
        allReleases: state.allReleases,
        selectedStyles: state.selectedStyles,
        selectedYears: state.selectedYears,
        selectedFormats: state.selectedFormats,
        searchQuery: state.searchQuery,
        selectedSort: action.payload,
        styleOperator: state.styleOperator,
        isRandomMode: state.isRandomMode,
        currentRandomRelease: state.randomRelease,
      });

      return {
        ...state,
        selectedSort: action.payload,
        ...computed,
      };
    }

    case FiltersActionTypes.ClearStyles: {
      const computed = computeFilteredState({
        allReleases: state.allReleases,
        selectedStyles: [],
        selectedYears: state.selectedYears,
        selectedFormats: state.selectedFormats,
        searchQuery: state.searchQuery,
        selectedSort: state.selectedSort,
        styleOperator: state.styleOperator,
        isRandomMode: state.isRandomMode,
        currentRandomRelease: state.randomRelease,
      });

      return {
        ...state,
        selectedStyles: [],
        ...computed,
      };
    }

    case FiltersActionTypes.SetStyles: {
      const computed = computeFilteredState({
        allReleases: state.allReleases,
        selectedStyles: action.payload,
        selectedYears: state.selectedYears,
        selectedFormats: state.selectedFormats,
        searchQuery: state.searchQuery,
        selectedSort: state.selectedSort,
        styleOperator: state.styleOperator,
        isRandomMode: state.isRandomMode,
        currentRandomRelease: state.randomRelease,
      });

      return {
        ...state,
        selectedStyles: action.payload,
        ...computed,
      };
    }

    case FiltersActionTypes.SetStyleOperator: {
      const computed = computeFilteredState({
        allReleases: state.allReleases,
        selectedStyles: state.selectedStyles,
        selectedYears: state.selectedYears,
        selectedFormats: state.selectedFormats,
        searchQuery: state.searchQuery,
        selectedSort: state.selectedSort,
        styleOperator: action.payload,
        isRandomMode: state.isRandomMode,
        currentRandomRelease: state.randomRelease,
      });

      return {
        ...state,
        styleOperator: action.payload,
        ...computed,
      };
    }

    case FiltersActionTypes.ClearYears: {
      const computed = computeFilteredState({
        allReleases: state.allReleases,
        selectedStyles: state.selectedStyles,
        selectedYears: [],
        selectedFormats: state.selectedFormats,
        searchQuery: state.searchQuery,
        selectedSort: state.selectedSort,
        styleOperator: state.styleOperator,
        isRandomMode: state.isRandomMode,
        currentRandomRelease: state.randomRelease,
      });

      return {
        ...state,
        selectedYears: [],
        ...computed,
      };
    }

    case FiltersActionTypes.SetYears: {
      const computed = computeFilteredState({
        allReleases: state.allReleases,
        selectedStyles: state.selectedStyles,
        selectedYears: action.payload,
        selectedFormats: state.selectedFormats,
        searchQuery: state.searchQuery,
        selectedSort: state.selectedSort,
        styleOperator: state.styleOperator,
        isRandomMode: state.isRandomMode,
        currentRandomRelease: state.randomRelease,
      });

      return {
        ...state,
        selectedYears: action.payload,
        ...computed,
      };
    }

    case FiltersActionTypes.ClearFormats: {
      const computed = computeFilteredState({
        allReleases: state.allReleases,
        selectedStyles: state.selectedStyles,
        selectedYears: state.selectedYears,
        selectedFormats: [],
        searchQuery: state.searchQuery,
        selectedSort: state.selectedSort,
        styleOperator: state.styleOperator,
        isRandomMode: state.isRandomMode,
        currentRandomRelease: state.randomRelease,
      });

      return {
        ...state,
        selectedFormats: [],
        ...computed,
      };
    }

    case FiltersActionTypes.SetFormats: {
      const computed = computeFilteredState({
        allReleases: state.allReleases,
        selectedStyles: state.selectedStyles,
        selectedYears: state.selectedYears,
        selectedFormats: action.payload,
        searchQuery: state.searchQuery,
        selectedSort: state.selectedSort,
        styleOperator: state.styleOperator,
        isRandomMode: state.isRandomMode,
        currentRandomRelease: state.randomRelease,
      });

      return {
        ...state,
        selectedFormats: action.payload,
        ...computed,
      };
    }

    case FiltersActionTypes.ToggleRandomMode: {
      const newIsRandomMode = !state.isRandomMode;
      let newFilteredReleases = state.filteredReleases;
      let newRandomRelease = state.randomRelease;

      if (newIsRandomMode) {
        // Entering random mode - get a random release from the FILTERED collection
        newRandomRelease = getRandomRelease({
          releases: state.filteredReleases,
        });
        newFilteredReleases = newRandomRelease ? [newRandomRelease] : [];
      } else {
        // Exiting random mode - restore all filtered releases
        newFilteredReleases = filterReleases({
          releases: state.allReleases,
          selectedStyles: state.selectedStyles,
          selectedYears: state.selectedYears,
          selectedFormats: state.selectedFormats,
          searchQuery: state.searchQuery,
          styleOperator: state.styleOperator,
        });
        newRandomRelease = null;
      }

      const availableStyles = getAvailableStyles(state.allReleases);
      const availableYears = getAvailableYears(state.allReleases);
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

      const availableStyles = getAvailableStyles(state.allReleases);
      const availableYears = getAvailableYears(state.allReleases);
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
      const newFilteredReleases = filterReleases({
        releases: state.allReleases,
        selectedStyles: [],
        selectedYears: [],
        selectedFormats: [],
        searchQuery: "",
        styleOperator: state.styleOperator,
      });
      const sortedReleases = sortReleases(
        newFilteredReleases,
        state.selectedSort,
      );

      const availableStyles = getAvailableStyles(state.allReleases);
      const availableYears = getAvailableYears(state.allReleases);
      const availableFormats = getAvailableFormats(sortedReleases);
      return {
        ...state,
        selectedStyles: [],
        selectedYears: [],
        selectedFormats: [],
        searchQuery: "",
        filteredReleases: sortedReleases,
        availableStyles,
        availableYears,
        availableFormats,
        isRandomMode: false,
        randomRelease: null,
      };
    }

    case FiltersActionTypes.SetSearchQuery: {
      const computed = computeFilteredState({
        allReleases: state.allReleases,
        selectedStyles: state.selectedStyles,
        selectedYears: state.selectedYears,
        selectedFormats: state.selectedFormats,
        searchQuery: action.payload,
        selectedSort: state.selectedSort,
        styleOperator: state.styleOperator,
        isRandomMode: state.isRandomMode,
        currentRandomRelease: state.randomRelease,
      });

      return {
        ...state,
        searchQuery: action.payload,
        isSearching: false,
        ...computed,
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
  styleOperator: "OR",
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
    styleOperator,
  } = state;

  const filteredReleases = useMemo(() => {
    const filtered = filterReleases({
      releases: allReleases,
      selectedStyles,
      selectedYears,
      selectedFormats,
      searchQuery,
      styleOperator,
    });
    return sortReleases(filtered, selectedSort);
  }, [
    allReleases,
    selectedStyles,
    selectedYears,
    selectedFormats,
    searchQuery,
    selectedSort,
    styleOperator,
  ]);

  return filteredReleases;
};
