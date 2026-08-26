import { atom, type Getter, type Setter } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { SortValues } from "src/constants/sortValues";
import { FILTERS_STORAGE_KEY } from "src/constants/storageKeys";
import type { DiscogsRelease } from "src/types";
import type {
  ReleaseFilterCriteria,
  StyleOperator,
  YearOperator,
} from "src/types/filters.types";
import { computeFilterDerivedState } from "src/utils/computeFilterDerivedState";
import { getFilterPersistenceEnabled } from "src/utils/filterPersistence";
import {
  defaultPersistedFilters,
  inactiveFilterSelectionDefaults,
  type PersistedFiltersState,
  parsePersistedFilters,
} from "src/utils/filtersStorage";
import { syncReleaseSearchIndex } from "src/utils/releaseSearchIndex";
import { sortReleases as sortReleasesUtil } from "src/utils/sortReleases";

export { SortValues } from "src/constants/sortValues";
export type { StyleOperator } from "src/types/filters.types";

export interface FiltersState {
  selectedStyles: string[];
  selectedYears: number[];
  selectedFormats: string[];
  selectedSort: SortValues;
  styleOperator: StyleOperator;
  formatOperator: StyleOperator;
  yearOperator: YearOperator;
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
  SetAllReleases = "SET_ALL_RELEASES",
  ToggleStyle = "TOGGLE_STYLE",
  ToggleYear = "TOGGLE_YEAR",
  ToggleFormat = "TOGGLE_FORMAT",
  SetSort = "SET_SORT",
  ClearStyles = "CLEAR_STYLES",
  SetStyles = "SET_STYLES",
  SetStyleOperator = "SET_STYLE_OPERATOR",
  SetFormatOperator = "SET_FORMAT_OPERATOR",
  SetYearOperator = "SET_YEAR_OPERATOR",
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
      type: FiltersActionTypes.SetFormatOperator;
      payload: StyleOperator;
    }
  | {
      type: FiltersActionTypes.SetYearOperator;
      payload: YearOperator;
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

const filtersStorage = createJSONStorage<PersistedFiltersState>(() => ({
  getItem: (key) => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (typeof window === "undefined") return;
    if (!getFilterPersistenceEnabled()) return;
    localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  },
}));

export const persistedFiltersAtom = atomWithStorage<PersistedFiltersState>(
  FILTERS_STORAGE_KEY,
  defaultPersistedFilters,
  {
    ...filtersStorage,
    getItem: (key, initialValue) => {
      if (typeof window === "undefined") return initialValue;
      if (!getFilterPersistenceEnabled()) {
        return defaultPersistedFilters;
      }
      const stored = localStorage.getItem(key);
      return parsePersistedFilters(stored);
    },
  },
);

export const sessionFiltersAtom = atom<PersistedFiltersState>({
  ...defaultPersistedFilters,
});

export const pendingFiltersRestoreAtom = atom<PersistedFiltersState | null>(
  null,
);

export const pendingFiltersRestoreDismissedAtom = atom(false);

const sessionFieldAtom = <K extends keyof PersistedFiltersState>(key: K) =>
  atom(
    (get) => get(sessionFiltersAtom)[key],
    (get, set, value: PersistedFiltersState[K]) => {
      set(sessionFiltersAtom, {
        ...get(sessionFiltersAtom),
        [key]: value,
      });
    },
  );

const syncPersistedFiltersFromSession = (get: Getter, set: Setter) => {
  set(persistedFiltersAtom, { ...get(sessionFiltersAtom) });
};

export const applyPendingFiltersRestoreAtom = atom(null, (get, set) => {
  const pending = get(pendingFiltersRestoreAtom);
  if (!pending) {
    return;
  }

  set(sessionFiltersAtom, { ...pending });
  set(persistedFiltersAtom, { ...pending });
  set(pendingFiltersRestoreAtom, null);
});

export const dismissPendingFiltersRestoreAtom = atom(null, (_get, set) => {
  set(pendingFiltersRestoreAtom, null);
  set(pendingFiltersRestoreDismissedAtom, true);
});

export const allReleasesAtom = atom<DiscogsRelease[]>([]);
export const collectionFiltersActiveAtom = atom(false);

const getActiveFilterInputs = (get: Getter) => {
  if (!get(collectionFiltersActiveAtom)) {
    return {
      selectedStyles: [...inactiveFilterSelectionDefaults.selectedStyles],
      selectedYears: [...inactiveFilterSelectionDefaults.selectedYears],
      selectedFormats: [...inactiveFilterSelectionDefaults.selectedFormats],
      searchQuery: inactiveFilterSelectionDefaults.searchQuery,
      selectedSort: SortValues.DateAddedNew,
      styleOperator: inactiveFilterSelectionDefaults.styleOperator,
      formatOperator: inactiveFilterSelectionDefaults.formatOperator,
      yearOperator: inactiveFilterSelectionDefaults.yearOperator,
    };
  }

  return {
    selectedStyles: get(selectedStylesAtom),
    selectedYears: get(selectedYearsAtom),
    selectedFormats: get(selectedFormatsAtom),
    searchQuery: get(searchQueryAtom),
    selectedSort: get(selectedSortAtom),
    styleOperator: get(styleOperatorAtom),
    formatOperator: get(formatOperatorAtom),
    yearOperator: get(yearOperatorAtom),
  };
};

export const selectedStylesAtom = sessionFieldAtom("selectedStyles");
export const selectedYearsAtom = sessionFieldAtom("selectedYears");
export const selectedFormatsAtom = sessionFieldAtom("selectedFormats");
export const selectedSortAtom = sessionFieldAtom("selectedSort");
export const styleOperatorAtom = sessionFieldAtom("styleOperator");
export const formatOperatorAtom = sessionFieldAtom("formatOperator");
export const yearOperatorAtom = sessionFieldAtom("yearOperator");
export const searchQueryAtom = sessionFieldAtom("searchQuery");
export const isRandomModeAtom = atom(false);
export const randomReleaseAtom = atom<DiscogsRelease | null>(null);
export const isSearchingAtom = atom(false);
const getFacetFilterInputs = (get: Getter): ReleaseFilterCriteria => {
  const {
    selectedStyles,
    selectedYears,
    selectedFormats,
    searchQuery,
    styleOperator,
    formatOperator,
    yearOperator,
  } = getActiveFilterInputs(get);

  return {
    selectedStyles,
    selectedYears,
    selectedFormats,
    searchQuery,
    styleOperator,
    formatOperator,
    yearOperator,
  };
};

const emptyFacetOptions = {
  availableStyles: [] as string[],
  availableYears: [] as number[],
  availableFormats: [] as string[],
};

const filterDerivedStateAtom = atom((get) => {
  const allReleases = get(allReleasesAtom);

  if (!get(collectionFiltersActiveAtom)) {
    return {
      filteredReleases: allReleases,
      facetOptions: emptyFacetOptions,
    };
  }

  return computeFilterDerivedState({
    releases: allReleases,
    ...getFacetFilterInputs(get),
  });
});

export const facetOptionsAtom = atom(
  (get) => get(filterDerivedStateAtom).facetOptions,
);

export const sortedFilteredReleasesAtom = atom((get) => {
  const { filteredReleases } = get(filterDerivedStateAtom);

  if (!get(collectionFiltersActiveAtom)) {
    return filteredReleases;
  }

  return sortReleasesUtil(filteredReleases, get(selectedSortAtom));
});

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
  formatOperator: get(formatOperatorAtom),
  yearOperator: get(yearOperatorAtom),
  availableStyles: get(facetOptionsAtom).availableStyles,
  availableYears: get(facetOptionsAtom).availableYears,
  availableFormats: get(facetOptionsAtom).availableFormats,
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
    formatOperator?: StyleOperator;
    yearOperator?: YearOperator;
    searchQuery?: string;
    clearSearching?: boolean;
  },
) => {
  set(pendingFiltersRestoreAtom, null);

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
  if (updates.formatOperator !== undefined) {
    set(formatOperatorAtom, updates.formatOperator);
  }
  if (updates.yearOperator !== undefined) {
    set(yearOperatorAtom, updates.yearOperator);
  }
  if (updates.searchQuery !== undefined) {
    set(searchQueryAtom, updates.searchQuery);
  }
  if (updates.clearSearching) {
    set(isSearchingAtom, false);
  }

  syncPersistedFiltersFromSession(get, set);

  if (!get(isRandomModeAtom)) {
    return;
  }

  const { randomRelease } = pickRandomReleaseForMode({
    isRandomMode: true,
    sortedFilteredReleases: get(sortedFilteredReleasesAtom),
    currentRandomRelease: get(randomReleaseAtom),
  });

  set(randomReleaseAtom, randomRelease);
};

const persistedFilterActionTypes = new Set<FiltersActions["type"]>([
  FiltersActionTypes.ToggleStyle,
  FiltersActionTypes.ToggleYear,
  FiltersActionTypes.ToggleFormat,
  FiltersActionTypes.SetSort,
  FiltersActionTypes.ClearStyles,
  FiltersActionTypes.SetStyles,
  FiltersActionTypes.SetStyleOperator,
  FiltersActionTypes.SetFormatOperator,
  FiltersActionTypes.SetYearOperator,
  FiltersActionTypes.ClearYears,
  FiltersActionTypes.SetYears,
  FiltersActionTypes.ClearFormats,
  FiltersActionTypes.SetFormats,
  FiltersActionTypes.ClearAllFilters,
  FiltersActionTypes.SetSearchQuery,
]);

export const isPersistedFiltersAction = (action: FiltersActions): boolean =>
  persistedFilterActionTypes.has(action.type);

export const filtersDispatchAtom = atom(
  null,
  (get, set, action: FiltersActions) => {
    switch (action.type) {
      case FiltersActionTypes.SetAllReleases: {
        const previousReleases = get(allReleasesAtom);
        set(allReleasesAtom, action.payload);
        syncReleaseSearchIndex(previousReleases, action.payload);

        if (get(isRandomModeAtom)) {
          const { randomRelease } = pickRandomReleaseForMode({
            isRandomMode: true,
            sortedFilteredReleases: get(sortedFilteredReleasesAtom),
            currentRandomRelease: get(randomReleaseAtom),
          });
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

      case FiltersActionTypes.SetFormatOperator:
        applyFilterChange(get, set, { formatOperator: action.payload });
        return;

      case FiltersActionTypes.SetYearOperator:
        applyFilterChange(get, set, { yearOperator: action.payload });
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
        set(pendingFiltersRestoreAtom, null);
        set(selectedStylesAtom, []);
        set(selectedYearsAtom, []);
        set(selectedFormatsAtom, []);
        set(searchQueryAtom, "");
        set(isRandomModeAtom, false);
        set(randomReleaseAtom, null);
        set(isSearchingAtom, false);
        syncPersistedFiltersFromSession(get, set);
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
