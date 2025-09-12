import {
  createContext,
  type FC,
  type PropsWithChildren,
  useContext,
  useMemo,
  useReducer,
} from "react";
import type { DiscogsRelease } from "src/types";

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
    };

const filterReleases = (
  releases: DiscogsRelease[],
  selectedStyles: string[],
  selectedYears: number[],
): DiscogsRelease[] => {
  // Early return if no filters applied
  if (selectedStyles.length === 0 && selectedYears.length === 0) {
    return releases;
  }

  const selectedStylesSet =
    selectedStyles.length > 0 ? new Set(selectedStyles) : null;
  const selectedYearsSet =
    selectedYears.length > 0 ? new Set(selectedYears) : null;

  return releases.filter((release) => {
    // Check style filter
    if (selectedStylesSet) {
      const releaseStyles = release.basic_information.styles;
      const hasMatchingStyle = releaseStyles.some((style) =>
        selectedStylesSet.has(style),
      );
      if (!hasMatchingStyle) return false;
    }

    // Check year filter
    if (selectedYearsSet) {
      const releaseYear = release.basic_information.year;
      if (!selectedYearsSet.has(releaseYear)) return false;
    }

    return true;
  });
};

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
      );
      const sortedReleases = sortReleases(filteredReleases);

      return {
        ...state,
        allReleases: action.payload,
        filteredReleases: sortedReleases,
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
      );
      const newSortedReleases = sortReleases(newFilteredReleases);

      return {
        ...state,
        selectedStyles: newSelectedStyles,
        filteredReleases: newSortedReleases,
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
      );
      const newSortedReleases = sortReleases(newFilteredReleases);

      return {
        ...state,
        selectedYears: newSelectedYears,
        filteredReleases: newSortedReleases,
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
      );
      const sortedReleases = sortReleases(newFilteredReleases);

      return {
        ...state,
        selectedStyles: [],
        filteredReleases: sortedReleases,
      };
    }

    case FiltersActionTypes.SetStyles: {
      const newFilteredReleases = filterReleases(
        state.allReleases,
        action.payload,
        state.selectedYears,
      );
      const newSortedReleases = sortReleases(newFilteredReleases);

      return {
        ...state,
        selectedStyles: action.payload,
        filteredReleases: newSortedReleases,
      };
    }

    case FiltersActionTypes.ClearYears: {
      const newFilteredReleases = filterReleases(
        state.allReleases,
        state.selectedStyles,
        [],
      );
      const sortedReleases = sortReleases(newFilteredReleases);

      return {
        ...state,
        selectedYears: [],
        filteredReleases: sortedReleases,
      };
    }

    case FiltersActionTypes.SetYears: {
      const newFilteredReleases = filterReleases(
        state.allReleases,
        state.selectedStyles,
        action.payload,
      );
      const newSortedReleases = sortReleases(newFilteredReleases);

      return {
        ...state,
        selectedYears: action.payload,
        filteredReleases: newSortedReleases,
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
  const { allReleases, selectedStyles, selectedYears } = state;

  const filteredReleases = useMemo(() => {
    const filtered = filterReleases(allReleases, selectedStyles, selectedYears);
    return sortReleases(filtered);
  }, [allReleases, selectedStyles, selectedYears]);

  return filteredReleases;
};
