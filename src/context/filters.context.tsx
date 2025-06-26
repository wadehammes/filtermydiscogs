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
  selectedSort: SortValues;
  availableStyles: string[];
  filteredReleases: DiscogsRelease[];
  allReleases: DiscogsRelease[];
}

export enum FiltersActionTypes {
  SetAvailableStyles = "SET_AVAILABLE_STYLES",
  SetAllReleases = "SET_ALL_RELEASES",
  ToggleStyle = "TOGGLE_STYLE",
  SetSort = "SET_SORT",
  ClearStyles = "CLEAR_STYLES",
  SetStyles = "SET_STYLES",
}

export type FiltersActions =
  | {
      type: FiltersActionTypes.SetAvailableStyles;
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
    };

const filterReleasesByStyles = (
  releases: DiscogsRelease[],
  selectedStyles: string[],
): DiscogsRelease[] => {
  if (selectedStyles.length === 0) {
    return releases;
  }

  const selectedStylesSet = new Set(selectedStyles);
  return releases.filter((release) => {
    const releaseStyles = release.basic_information.styles;
    return releaseStyles.some((style) => selectedStylesSet.has(style));
  });
};

const sortReleases = (
  releases: DiscogsRelease[],
  sort: SortValues,
): DiscogsRelease[] => {
  const releasesCopy = [...releases];

  switch (sort) {
    case SortValues.DateAddedNew:
      return releasesCopy.sort(
        (a, b) =>
          new Date(b.date_added).getTime() - new Date(a.date_added).getTime(),
      );
    case SortValues.DateAddedOld:
      return releasesCopy.sort(
        (a, b) =>
          new Date(a.date_added).getTime() - new Date(b.date_added).getTime(),
      );
    case SortValues.AZLabel:
      return releasesCopy.sort((a, b) =>
        (a.basic_information.labels[0]?.name || "").localeCompare(
          b.basic_information.labels[0]?.name || "",
        ),
      );
    case SortValues.ZALabel:
      return releasesCopy.sort((a, b) =>
        (b.basic_information.labels[0]?.name || "").localeCompare(
          a.basic_information.labels[0]?.name || "",
        ),
      );
    case SortValues.AZArtist:
      return releasesCopy.sort((a, b) =>
        (a.basic_information.artists[0]?.name || "").localeCompare(
          b.basic_information.artists[0]?.name || "",
        ),
      );
    case SortValues.ZAArtist:
      return releasesCopy.sort((a, b) =>
        (b.basic_information.artists[0]?.name || "").localeCompare(
          a.basic_information.artists[0]?.name || "",
        ),
      );
    case SortValues.AZTitle:
      return releasesCopy.sort((a, b) =>
        a.basic_information.title.localeCompare(b.basic_information.title),
      );
    case SortValues.ZATitle:
      return releasesCopy.sort((a, b) =>
        b.basic_information.title.localeCompare(a.basic_information.title),
      );
    case SortValues.AlbumYearNew:
      return releasesCopy.sort(
        (a, b) => b.basic_information.year - a.basic_information.year,
      );
    case SortValues.AlbumYearOld:
      return releasesCopy.sort(
        (a, b) => a.basic_information.year - b.basic_information.year,
      );
    case SortValues.RatingHigh:
      return releasesCopy.sort((a, b) => b.rating - a.rating);
    case SortValues.RatingLow:
      return releasesCopy.sort((a, b) => a.rating - b.rating);
    default:
      return releasesCopy;
  }
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

    case FiltersActionTypes.SetAllReleases: {
      const filteredByStyles = filterReleasesByStyles(
        action.payload,
        state.selectedStyles,
      );
      const sortedReleases = sortReleases(filteredByStyles, state.selectedSort);

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

      const newFilteredByStyles = filterReleasesByStyles(
        state.allReleases,
        newSelectedStyles,
      );
      const newSortedReleases = sortReleases(
        newFilteredByStyles,
        state.selectedSort,
      );

      return {
        ...state,
        selectedStyles: newSelectedStyles,
        filteredReleases: newSortedReleases,
      };
    }

    case FiltersActionTypes.SetSort: {
      const sortedFilteredReleases = sortReleases(
        state.filteredReleases,
        action.payload,
      );

      return {
        ...state,
        selectedSort: action.payload,
        filteredReleases: sortedFilteredReleases,
      };
    }

    case FiltersActionTypes.ClearStyles: {
      const releasesWithoutStyleFilter = sortReleases(
        state.allReleases,
        state.selectedSort,
      );

      return {
        ...state,
        selectedStyles: [],
        filteredReleases: releasesWithoutStyleFilter,
      };
    }

    case FiltersActionTypes.SetStyles: {
      const newFilteredByStyles = filterReleasesByStyles(
        state.allReleases,
        action.payload,
      );
      const newSortedReleases = sortReleases(
        newFilteredByStyles,
        state.selectedSort,
      );

      return {
        ...state,
        selectedStyles: action.payload,
        filteredReleases: newSortedReleases,
      };
    }

    default:
      return state;
  }
};

const initialState: FiltersState = {
  selectedStyles: [],
  selectedSort: SortValues.DateAddedNew,
  availableStyles: [],
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
  const { allReleases, selectedStyles, selectedSort } = state;

  const filteredReleases = useMemo(() => {
    const filtered = filterReleasesByStyles(allReleases, selectedStyles);
    return sortReleases(filtered, selectedSort);
  }, [allReleases, selectedStyles, selectedSort]);

  return filteredReleases;
};
