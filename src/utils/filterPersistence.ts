export const PERSIST_FILTERS_STORAGE_KEY = "filtermydiscogs_persist_filters";

let cachedEnabled: boolean | null = null;

export const resetFilterPersistenceCache = (): void => {
  cachedEnabled = null;
};

export const getFilterPersistenceEnabled = (): boolean => {
  if (cachedEnabled !== null) {
    return cachedEnabled;
  }

  if (typeof window === "undefined") {
    return true;
  }

  cachedEnabled = localStorage.getItem(PERSIST_FILTERS_STORAGE_KEY) !== "false";
  return cachedEnabled;
};

export const setFilterPersistenceEnabled = (enabled: boolean): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(PERSIST_FILTERS_STORAGE_KEY, enabled ? "true" : "false");
  cachedEnabled = enabled;
};
