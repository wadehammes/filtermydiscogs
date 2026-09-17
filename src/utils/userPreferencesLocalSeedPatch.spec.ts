import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  FILTERS_STORAGE_KEY,
  VIEW_STATE_STORAGE_KEY,
} from "src/constants/storageKeys";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { buildLocalPreferencesSeedPatch } from "src/utils/userPreferencesLocalSeedPatch";
import { defaultPersistedFilters } from "src/utils/filtersStorage";

describe("buildLocalPreferencesSeedPatch", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("seeds local palette theme when server preferences are still system", () => {
    const preferences = userPreferencesFactory.build({ theme: "system" });

    expect(
      buildLocalPreferencesSeedPatch({
        preferences,
        localTheme: "amber",
      }),
    ).toEqual({ theme: "amber" });
  });

  it("seeds non-default local filters when server filters are default", () => {
    const localFilters = {
      ...defaultPersistedFilters,
      searchQuery: "miles",
    };
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(localFilters));

    const preferences = userPreferencesFactory.build({
      persistFilters: true,
      filters: defaultPersistedFilters,
    });

    expect(
      buildLocalPreferencesSeedPatch({
        preferences,
        localTheme: "system",
      }),
    ).toEqual({ filters: localFilters });
  });

  it("returns an empty patch when local state already matches server", () => {
    const preferences = userPreferencesFactory.build({ theme: "dark" });
    localStorage.setItem(
      VIEW_STATE_STORAGE_KEY,
      JSON.stringify(preferences.view),
    );

    expect(
      buildLocalPreferencesSeedPatch({
        preferences,
        localTheme: "dark",
      }),
    ).toEqual({});
  });
});
