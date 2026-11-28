import { describe, expect, it } from "@jest/globals";
import { SortSecondaryValues, SortValues } from "src/constants/sortValues";
import { persistedFiltersFactory } from "src/tests/factories/UserPreferences.factory";
import {
  formatCollectionCommandPreviewDetails,
  formatCollectionCommandPreviewTail,
} from "src/utils/collectionCommandPreview";

describe("formatCollectionCommandPreviewDetails", () => {
  it("compresses long year lists into a range", () => {
    const facts = formatCollectionCommandPreviewDetails(
      persistedFiltersFactory.withDefaults({
        selectedStyles: ["Tech House"],
        selectedYears: [2018, 2017, 2016, 2015, 2014, 2012, 2003, 2001, 1999],
        selectedSort: SortValues.AlbumYearOld,
        selectedSortSecondary: SortSecondaryValues.None,
      }),
    );

    expect(facts.find((fact) => fact.label === "Style")?.value).toBe(
      "Tech House",
    );
    expect(facts.find((fact) => fact.label === "Years")?.value).toMatch(
      /1999–2018 · 9 years/,
    );
    expect(facts.find((fact) => fact.label === "Sort")?.value).toContain(
      "Release Year",
    );
  });

  it("labels excluded styles in the preview tail", () => {
    const facts = formatCollectionCommandPreviewDetails(
      persistedFiltersFactory.withDefaults({
        selectedStyles: ["Deep House"],
        excludedStyles: ["House"],
        selectedYears: [2018],
      }),
    );

    expect(formatCollectionCommandPreviewTail(facts)).toBe(
      "Deep House · excluding House · 2018",
    );
  });
});
