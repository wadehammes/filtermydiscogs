import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  getFilterPersistenceEnabled,
  PERSIST_FILTERS_STORAGE_KEY,
  resetFilterPersistenceCache,
  setFilterPersistenceEnabled,
} from "./filterPersistence";

describe("filterPersistence", () => {
  beforeEach(() => {
    localStorage.clear();
    resetFilterPersistenceCache();
  });

  it("defaults to enabled when storage is empty", () => {
    expect(getFilterPersistenceEnabled()).toBe(true);
  });

  it("reads disabled state from localStorage once and caches it", () => {
    localStorage.setItem(PERSIST_FILTERS_STORAGE_KEY, "false");

    expect(getFilterPersistenceEnabled()).toBe(false);
    localStorage.setItem(PERSIST_FILTERS_STORAGE_KEY, "true");
    expect(getFilterPersistenceEnabled()).toBe(false);
  });

  it("updates cache when persistence is toggled", () => {
    setFilterPersistenceEnabled(false);
    expect(getFilterPersistenceEnabled()).toBe(false);

    setFilterPersistenceEnabled(true);
    expect(getFilterPersistenceEnabled()).toBe(true);
  });

  it("resetFilterPersistenceCache re-reads localStorage", () => {
    setFilterPersistenceEnabled(false);
    localStorage.setItem(PERSIST_FILTERS_STORAGE_KEY, "true");
    resetFilterPersistenceCache();

    expect(getFilterPersistenceEnabled()).toBe(true);
  });
});
