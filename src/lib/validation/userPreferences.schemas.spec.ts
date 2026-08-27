import { describe, expect, it } from "@jest/globals";
import { SortValues } from "src/constants/sortValues";
import {
  getUserPreferencesPatchError,
  userPreferencesPatchSchema,
} from "src/lib/validation/userPreferences.schemas";
import { persistedFiltersFactory } from "src/tests/factories/UserPreferences.factory";
import type { UserPreferencesPatch } from "src/types/userPreferences.types";

describe("userPreferencesPatchSchema", () => {
  it("accepts supported preference fields", () => {
    const filters = persistedFiltersFactory.build({
      selectedStyles: ["Rock"],
      selectedYears: [1970],
      selectedFormats: ["Vinyl"],
      selectedSort: SortValues.AZArtist,
      styleOperator: "AND",
      searchQuery: "blue",
    });

    expect(
      userPreferencesPatchSchema.parse({
        persistFilters: false,
        autoPlayOnQueueAdd: true,
        theme: "dark",
        view: { currentView: "list", previousView: "card" },
        filters,
        analyticsConsent: true,
      }),
    ).toEqual({
      persistFilters: false,
      autoPlayOnQueueAdd: true,
      theme: "dark",
      view: { currentView: "list", previousView: "card" },
      filters,
      analyticsConsent: true,
    });
  });

  it("rejects empty patches", () => {
    expect(getUserPreferencesPatchError({})).toBe(
      "No supported preference fields to update",
    );
  });

  it("rejects invalid themes", () => {
    expect(
      getUserPreferencesPatchError({
        theme: "table",
      } as unknown as UserPreferencesPatch),
    ).toBe("theme must be a supported theme value");
  });

  it("rejects invalid filter payloads", () => {
    expect(
      getUserPreferencesPatchError({
        filters: {
          selectedStyles: "Rock",
        },
      }),
    ).toBe("filters must include valid filter fields");
  });

  it("rejects invalid analyticsConsent values", () => {
    expect(
      getUserPreferencesPatchError({
        analyticsConsent: "yes",
      } as unknown as UserPreferencesPatch),
    ).toBe("analyticsConsent must be a boolean");
  });
});
