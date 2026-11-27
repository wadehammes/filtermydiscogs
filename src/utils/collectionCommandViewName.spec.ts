import { describe, expect, it } from "@jest/globals";
import { SortSecondaryValues, SortValues } from "src/constants/sortValues";
import type { CollectionCommandIntent } from "src/lib/validation/collectionCommand.schemas";
import type { PersistedFiltersJson } from "src/types/filters.types";
import {
  buildCollectionCommandViewName,
  buildCollectionCommandViewNameFromFilters,
} from "src/utils/collectionCommandViewName";

const baseFilters = (): PersistedFiltersJson => ({
  selectedStyles: [],
  selectedYears: [],
  selectedFormats: [],
  selectedSort: SortValues.DateAddedNew,
  selectedSortSecondary: SortSecondaryValues.None,
  styleOperator: "OR",
  formatOperator: "OR",
  yearOperator: "OR",
  searchQuery: "",
});

const baseIntent = (): CollectionCommandIntent => ({
  searchQuery: "",
  selectedStyles: [],
  selectedYears: [],
  selectedFormats: [],
  styleOperator: "OR",
  formatOperator: "OR",
  yearOperator: "OR",
  selectedSort: SortValues.DateAddedNew,
  selectedSortSecondary: SortSecondaryValues.None,
  yearStartInclusive: 0,
  yearEndExclusive: 0,
});

describe("buildCollectionCommandViewName", () => {
  it("prefers the model suggested name when present", () => {
    expect(
      buildCollectionCommandViewName({
        prompt: "all techno before 2019",
        suggestedViewName: "Pre-2019 techno",
      }),
    ).toBe("Pre-2019 techno");
  });

  it("builds a compact title from year and styles instead of the raw prompt", () => {
    expect(
      buildCollectionCommandViewName({
        prompt: "Releases with Electro and Deep House from 2018",
        filters: {
          ...baseFilters(),
          selectedStyles: ["Electro", "Deep House"],
          selectedYears: [2018],
        },
      }),
    ).toBe("2018 Deep House/Electro");
  });

  it("falls back to the prompt when no suggested name and no filter labels", () => {
    expect(
      buildCollectionCommandViewName({
        prompt: "  Deep house from the 90s  ",
      }),
    ).toBe("Deep house from the 90s");
  });

  it("truncates long prompts", () => {
    const prompt = "a".repeat(50);
    expect(
      buildCollectionCommandViewName({
        prompt,
      }),
    ).toBe(`${"a".repeat(39)}…`);
  });
});

describe("buildCollectionCommandViewNameFromFilters", () => {
  it("formats a single-year range from intent bounds", () => {
    expect(
      buildCollectionCommandViewNameFromFilters({
        filters: baseFilters(),
        intent: {
          ...baseIntent(),
          yearStartInclusive: 2018,
          yearEndExclusive: 2019,
        },
      }),
    ).toBe("2018");
  });

  it("uses search query only when no other segments exist", () => {
    expect(
      buildCollectionCommandViewNameFromFilters({
        filters: {
          ...baseFilters(),
          searchQuery: "Boards of Canada",
        },
      }),
    ).toBe("Boards of Canada");
  });
});
