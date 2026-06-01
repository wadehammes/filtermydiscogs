import { atom, type Getter, type Setter } from "jotai";
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

const computeSortedFilteredReleases = ({
  allReleases,
  selectedStyles,
  selectedYears,
  selectedFormats,
  searchQuery,
  selectedSort,
  styleOperator,
}: {
  allReleases: DiscogsRelease[];
  selectedStyles: string[];
  selectedYears: number[];
  selectedFormats: string[];
  searchQuery: string;
  selectedSort: SortValues;
  styleOperator: StyleOperator;
}) => {
  const filtered = filterReleasesUtil({
    releases: allReleases,
    selectedStyles,
    selectedYears,
    selectedFormats,
    searchQuery,
    styleOperator,
  });
  return sortReleasesUtil(filtered, selectedSort);
};

const pickRandomReleaseForMode = ({
  isRandomMode,
  sortedFilteredReleases,
  currentRandomRelease,
}: {
  isRandomMode: boolean;
  sortedFilteredReleases: DiscogsRelease[];
  currentRandomRelease: DiscogsRelease | null;
}) => {
  if (isRandomMode && sortedFilteredReleases.length > 0) {
    const newRandomRelease = getRandomRelease({
      releases: sortedFilteredReleases,
    });
    return {
      filteredReleases: newRandomRelease ? [newRandomRelease] : [],
      randomRelease: newRandomRelease,
    };
  }

  return {
    filteredReleases: sortedFilteredReleases,
    randomRelease: currentRandomRelease,
  };
};

export const allReleasesAtom = atom<DiscogsRelease[]>([]);
export const selectedStylesAtom = atom<string[]>([]);
export const selectedYearsAtom = atom<number[]>([]);
export const selectedFormatsAtom = atom<string[]>([]);
export const selectedSortAtom = atom<SortValues>(SortValues.DateAddedNew);
export const styleOperatorAtom = atom<StyleOperator>("OR");
export const isRandomModeAtom = atom(false);
export const randomReleaseAtom = atom<DiscogsRelease | null>(null);
export const searchQueryAtom = atom("");
export const isSearchingAtom = atom(false);

export const availableStylesAtom = atom((get) =>
  getAvailableStyles(get(allReleasesAtom)),
);

export const availableYearsAtom = atom((get) =>
  getAvailableYears(get(allReleasesAtom)),
);

export const availableFormatsAtom = atom((get) =>
  getAvailableFormats(get(allReleasesAtom)),
);

export const sortedFilteredReleasesAtom = atom((get) =>
  computeSortedFilteredReleases({
    allReleases: get(allReleasesAtom),
    selectedStyles: get(selectedStylesAtom),
    selectedYears: get(selectedYearsAtom),
    selectedFormats: get(selectedFormatsAtom),
    searchQuery: get(searchQueryAtom),
    selectedSort: get(selectedSortAtom),
    styleOperator: get(styleOperatorAtom),
  }),
);

export const filteredReleasesAtom = atom((get) => {
  if (get(isRandomModeAtom)) {
    const randomRelease = get(randomReleaseAtom);
    return randomRelease ? [randomRelease] : [];
  }

  return get(sortedFilteredReleasesAtom);
});

export const filtersStateAtom = atom<FiltersState>((get) => ({
  selectedStyles: get(selectedStylesAtom),
  selectedYears: get(selectedYearsAtom),
  selectedFormats: get(selectedFormatsAtom),
  selectedSort: get(selectedSortAtom),
  styleOperator: get(styleOperatorAtom),
  availableStyles: get(availableStylesAtom),
  availableYears: get(availableYearsAtom),
  availableFormats: get(availableFormatsAtom),
  filteredReleases: get(filteredReleasesAtom),
  allReleases: get(allReleasesAtom),
  isRandomMode: get(isRandomModeAtom),
  randomRelease: get(randomReleaseAtom),
  searchQuery: get(searchQueryAtom),
  isSearching: get(isSearchingAtom),
}));

const applyFilterChange = (
  get: Getter,
  set: Setter,
  updates: {
    selectedStyles?: string[];
    selectedYears?: number[];
    selectedFormats?: string[];
    selectedSort?: SortValues;
    styleOperator?: StyleOperator;
    searchQuery?: string;
    clearSearching?: boolean;
  },
) => {
  if (updates.selectedStyles !== undefined) {
    set(selectedStylesAtom, updates.selectedStyles);
  }
  if (updates.selectedYears !== undefined) {
    set(selectedYearsAtom, updates.selectedYears);
  }
  if (updates.selectedFormats !== undefined) {
    set(selectedFormatsAtom, updates.selectedFormats);
  }
  if (updates.selectedSort !== undefined) {
    set(selectedSortAtom, updates.selectedSort);
  }
  if (updates.styleOperator !== undefined) {
    set(styleOperatorAtom, updates.styleOperator);
  }
  if (updates.searchQuery !== undefined) {
    set(searchQueryAtom, updates.searchQuery);
  }
  if (updates.clearSearching) {
    set(isSearchingAtom, false);
  }

  const sortedFilteredReleases = computeSortedFilteredReleases({
    allReleases: get(allReleasesAtom),
    selectedStyles: updates.selectedStyles ?? get(selectedStylesAtom),
    selectedYears: updates.selectedYears ?? get(selectedYearsAtom),
    selectedFormats: updates.selectedFormats ?? get(selectedFormatsAtom),
    searchQuery: updates.searchQuery ?? get(searchQueryAtom),
    selectedSort: updates.selectedSort ?? get(selectedSortAtom),
    styleOperator: updates.styleOperator ?? get(styleOperatorAtom),
  });

  const { randomRelease } = pickRandomReleaseForMode({
    isRandomMode: get(isRandomModeAtom),
    sortedFilteredReleases,
    currentRandomRelease: get(randomReleaseAtom),
  });

  if (get(isRandomModeAtom)) {
    set(randomReleaseAtom, randomRelease);
  }
};

export const filtersDispatchAtom = atom(
  null,
  (get, set, action: FiltersActions) => {
    switch (action.type) {
      case FiltersActionTypes.SetAvailableStyles:
      case FiltersActionTypes.SetAvailableYears:
      case FiltersActionTypes.SetAvailableFormats:
        return;

      case FiltersActionTypes.SetAllReleases: {
        set(allReleasesAtom, action.payload);
        const sortedFilteredReleases = computeSortedFilteredReleases({
          allReleases: action.payload,
          selectedStyles: get(selectedStylesAtom),
          selectedYears: get(selectedYearsAtom),
          selectedFormats: get(selectedFormatsAtom),
          searchQuery: get(searchQueryAtom),
          selectedSort: get(selectedSortAtom),
          styleOperator: get(styleOperatorAtom),
        });
        const { randomRelease } = pickRandomReleaseForMode({
          isRandomMode: get(isRandomModeAtom),
          sortedFilteredReleases,
          currentRandomRelease: get(randomReleaseAtom),
        });
        if (get(isRandomModeAtom)) {
          set(randomReleaseAtom, randomRelease);
        }
        return;
      }

      case FiltersActionTypes.ToggleStyle: {
        const selectedStyles = get(selectedStylesAtom);
        const newSelectedStyles = selectedStyles.includes(action.payload)
          ? selectedStyles.filter((style) => style !== action.payload)
          : [...selectedStyles, action.payload];
        applyFilterChange(get, set, { selectedStyles: newSelectedStyles });
        return;
      }

      case FiltersActionTypes.ToggleYear: {
        const selectedYears = get(selectedYearsAtom);
        const newSelectedYears = selectedYears.includes(action.payload)
          ? selectedYears.filter((year) => year !== action.payload)
          : [...selectedYears, action.payload];
        applyFilterChange(get, set, { selectedYears: newSelectedYears });
        return;
      }

      case FiltersActionTypes.ToggleFormat: {
        const selectedFormats = get(selectedFormatsAtom);
        const newSelectedFormats = selectedFormats.includes(action.payload)
          ? selectedFormats.filter((format) => format !== action.payload)
          : [...selectedFormats, action.payload];
        applyFilterChange(get, set, { selectedFormats: newSelectedFormats });
        return;
      }

      case FiltersActionTypes.SetSort:
        applyFilterChange(get, set, { selectedSort: action.payload });
        return;

      case FiltersActionTypes.ClearStyles:
        applyFilterChange(get, set, { selectedStyles: [] });
        return;

      case FiltersActionTypes.SetStyles:
        applyFilterChange(get, set, { selectedStyles: action.payload });
        return;

      case FiltersActionTypes.SetStyleOperator:
        applyFilterChange(get, set, { styleOperator: action.payload });
        return;

      case FiltersActionTypes.ClearYears:
        applyFilterChange(get, set, { selectedYears: [] });
        return;

      case FiltersActionTypes.SetYears:
        applyFilterChange(get, set, { selectedYears: action.payload });
        return;

      case FiltersActionTypes.ClearFormats:
        applyFilterChange(get, set, { selectedFormats: [] });
        return;

      case FiltersActionTypes.SetFormats:
        applyFilterChange(get, set, { selectedFormats: action.payload });
        return;

      case FiltersActionTypes.ToggleRandomMode: {
        const newIsRandomMode = !get(isRandomModeAtom);
        set(isRandomModeAtom, newIsRandomMode);

        if (newIsRandomMode) {
          const sortedFilteredReleases = get(sortedFilteredReleasesAtom);
          const newRandomRelease = getRandomRelease({
            releases: sortedFilteredReleases,
          });
          set(randomReleaseAtom, newRandomRelease);
        } else {
          set(randomReleaseAtom, null);
        }
        return;
      }

      case FiltersActionTypes.SetRandomRelease:
        set(randomReleaseAtom, action.payload);
        return;

      case FiltersActionTypes.ClearAllFilters: {
        set(selectedStylesAtom, []);
        set(selectedYearsAtom, []);
        set(selectedFormatsAtom, []);
        set(searchQueryAtom, "");
        set(isRandomModeAtom, false);
        set(randomReleaseAtom, null);
        set(isSearchingAtom, false);
        return;
      }

      case FiltersActionTypes.SetSearchQuery:
        applyFilterChange(get, set, {
          searchQuery: action.payload,
          clearSearching: true,
        });
        return;

      case FiltersActionTypes.SetSearching:
        set(isSearchingAtom, action.payload);
        return;

      default:
        return;
    }
  },
);
