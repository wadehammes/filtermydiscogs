import { describe, expect, it } from "@jest/globals";
import { SortValues } from "src/constants/sortValues";
import {
  persistedFiltersFactory,
  userPreferencesFactory,
} from "src/tests/factories/UserPreferences.factory";
import type { UserPreferencesPatch } from "src/types/userPreferences.types";
import {
  defaultUserPreferences,
  isValidStoredTheme,
  isValidStoredViewPatch,
  isValidUserPreferencesPatch,
  mergeUserPreferences,
  parseUserPreferences,
} from "./user-preferences.server";

describe("user-preferences.server", () => {
  it("returns defaults for missing or invalid stored preferences", () => {
    expect(parseUserPreferences(null)).toEqual(defaultUserPreferences());
    expect(parseUserPreferences([])).toEqual(defaultUserPreferences());
    expect(parseUserPreferences({ persistFilters: "yes" })).toEqual(
      defaultUserPreferences(),
    );
  });

  it("parses stored preference fields", () => {
    const filters = persistedFiltersFactory.build({
      selectedStyles: ["Rock"],
      selectedYears: [1970],
      selectedFormats: ["Vinyl"],
      selectedSort: SortValues.AZArtist,
      styleOperator: "AND",
      searchQuery: "blue",
    });

    expect(
      parseUserPreferences(
        userPreferencesFactory.build({
          persistFilters: false,
          theme: "dark",
          view: { currentView: "list", previousView: "card" },
          filters,
        }),
      ),
    ).toEqual({
      version: 1,
      persistFilters: false,
      theme: "dark",
      view: { currentView: "list", previousView: "card" },
      filters,
    });
  });

  it("merges preference patches", () => {
    const filters = persistedFiltersFactory.build({
      selectedStyles: ["Jazz"],
      selectedYears: [],
      selectedFormats: [],
      selectedSort: SortValues.DateAddedNew,
      styleOperator: "OR",
      searchQuery: "",
    });

    expect(
      mergeUserPreferences(defaultUserPreferences(), {
        persistFilters: false,
        theme: "dark",
        filters,
      }),
    ).toEqual({
      version: 1,
      persistFilters: false,
      theme: "dark",
      view: { currentView: "card", previousView: "card" },
      filters,
    });
  });

  it("validates preference patch fields", () => {
    expect(isValidStoredTheme("dark")).toBe(true);
    expect(isValidStoredTheme("sepia")).toBe(true);
    expect(
      isValidStoredViewPatch({
        currentView: "list",
        previousView: "card",
      }),
    ).toBe(true);
    expect(isValidUserPreferencesPatch({ theme: "sepia" })).toBeNull();
    expect(
      isValidUserPreferencesPatch({
        theme: "table",
      } as unknown as UserPreferencesPatch),
    ).toBe("theme must be a supported theme value");
  });
});
