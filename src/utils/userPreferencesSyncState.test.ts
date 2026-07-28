import { describe, expect, it } from "@jest/globals";
import { persistedFiltersFactory } from "src/tests/factories/UserPreferences.factory";
import {
  consumePendingFilterPersist,
  markFiltersPendingPersist,
} from "./userPreferencesSyncState";

describe("userPreferencesSyncState", () => {
  it("skips one server hydrate after a local filter persist", () => {
    const filters = persistedFiltersFactory.build({
      selectedStyles: ["Rock"],
    });

    markFiltersPendingPersist(filters);
    expect(consumePendingFilterPersist(filters)).toBe(true);
    expect(consumePendingFilterPersist(filters)).toBe(false);
  });

  it("does not skip hydrate when server filters differ from pending persist", () => {
    const localFilters = persistedFiltersFactory.build({
      selectedStyles: ["Rock"],
    });
    const serverFilters = persistedFiltersFactory.build({
      selectedStyles: ["Jazz"],
    });

    markFiltersPendingPersist(localFilters);
    expect(consumePendingFilterPersist(serverFilters)).toBe(false);
    expect(consumePendingFilterPersist(serverFilters)).toBe(false);
  });
});
