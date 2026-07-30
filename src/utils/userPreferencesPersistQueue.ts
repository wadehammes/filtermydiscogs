import type {
  UserPreferences,
  UserPreferencesPatch,
} from "src/types/userPreferences.types";
import {
  type PersistedFiltersState,
  persistedFiltersEqual,
} from "src/utils/filtersStorage";

const FILTER_DEBOUNCE_MS = 400;

export type PersistPreferencesOptions = {
  onSuccess?: (response: { preferences: UserPreferences }) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
};

type PersistMutate = (
  patch: UserPreferencesPatch,
  options?: PersistPreferencesOptions,
) => void;

let pendingPatch: UserPreferencesPatch = {};
let pendingOptions: PersistPreferencesOptions | undefined;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastPersistedFilters: PersistedFiltersState | null = null;

const mergePatches = (
  current: UserPreferencesPatch,
  next: UserPreferencesPatch,
): UserPreferencesPatch => ({
  ...current,
  ...next,
});

const isFiltersOnlyPatch = (patch: UserPreferencesPatch): boolean =>
  patch.filters !== undefined &&
  patch.theme === undefined &&
  patch.view === undefined &&
  patch.persistFilters === undefined &&
  patch.analyticsConsent === undefined;

const hasPendingFields = (patch: UserPreferencesPatch): boolean =>
  patch.persistFilters !== undefined ||
  patch.theme !== undefined ||
  patch.view !== undefined ||
  patch.filters !== undefined ||
  patch.analyticsConsent !== undefined;

const flushPendingPatch = (mutate: PersistMutate) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (!hasPendingFields(pendingPatch)) {
    return;
  }

  const patch = pendingPatch;
  const options = pendingOptions;
  pendingPatch = {};
  pendingOptions = undefined;

  if (
    patch.filters &&
    lastPersistedFilters &&
    persistedFiltersEqual(patch.filters, lastPersistedFilters) &&
    isFiltersOnlyPatch(patch)
  ) {
    options?.onSettled?.();
    return;
  }

  mutate(patch, {
    ...options,
    onSuccess: (response) => {
      if (patch.filters) {
        lastPersistedFilters = patch.filters;
      }
      options?.onSuccess?.(response);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
    onSettled: () => {
      options?.onSettled?.();
    },
  });
};

export const scheduleUserPreferencesPersist = (
  patch: UserPreferencesPatch,
  mutate: PersistMutate,
  options?: PersistPreferencesOptions,
) => {
  if (
    patch.filters &&
    lastPersistedFilters &&
    persistedFiltersEqual(patch.filters, lastPersistedFilters) &&
    isFiltersOnlyPatch(patch)
  ) {
    options?.onSettled?.();
    return;
  }

  pendingPatch = mergePatches(pendingPatch, patch);
  if (options) {
    pendingOptions = options;
  }

  const filtersOnlyPending =
    pendingPatch.filters !== undefined &&
    pendingPatch.theme === undefined &&
    pendingPatch.view === undefined &&
    pendingPatch.persistFilters === undefined &&
    pendingPatch.analyticsConsent === undefined;

  if (filtersOnlyPending) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      flushPendingPatch(mutate);
    }, FILTER_DEBOUNCE_MS);
    return;
  }

  flushPendingPatch(mutate);
};

export const flushUserPreferencesPersist = (mutate: PersistMutate) => {
  flushPendingPatch(mutate);
};

export const resetUserPreferencesPersistQueue = (): void => {
  pendingPatch = {};
  pendingOptions = undefined;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  lastPersistedFilters = null;
};
