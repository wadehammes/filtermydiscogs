import { describe, expect, it } from "@jest/globals";
import { SortSecondaryValues, SortValues } from "src/constants/sortValues";
import type { CollectionCommandIntent } from "src/lib/validation/collectionCommand.schemas";
import {
  applyPromptYearBoundsToIntent,
  extractYearBoundsFromCollectionCommandPrompt,
} from "src/utils/collectionCommandPromptYears";

const referenceDate = new Date("2026-11-27T12:00:00");

const baseIntent: CollectionCommandIntent = {
  searchQuery: "",
  selectedStyles: ["Deep House", "Electro"],
  selectedYears: [2022, 2023],
  selectedFormats: [],
  styleOperator: "OR",
  formatOperator: "OR",
  yearOperator: "OR",
  selectedSort: SortValues.DateAddedNew,
  selectedSortSecondary: SortSecondaryValues.None,
  yearStartInclusive: 0,
  yearEndExclusive: 0,
};

describe("extractYearBoundsFromCollectionCommandPrompt", () => {
  it("maps last two years to the current and previous calendar years", () => {
    expect(
      extractYearBoundsFromCollectionCommandPrompt(
        "All Deep House and Electro from the last two years",
        referenceDate,
      ),
    ).toEqual({
      yearStartInclusive: 2025,
      yearEndExclusive: 2027,
    });
  });

  it("maps last 3 years using a numeric phrase", () => {
    expect(
      extractYearBoundsFromCollectionCommandPrompt(
        "vinyl from the past 3 years",
        referenceDate,
      ),
    ).toEqual({
      yearStartInclusive: 2024,
      yearEndExclusive: 2027,
    });
  });

  it("maps this year and last year", () => {
    expect(
      extractYearBoundsFromCollectionCommandPrompt(
        "techno this year",
        referenceDate,
      ),
    ).toEqual({
      yearStartInclusive: 2026,
      yearEndExclusive: 2027,
    });

    expect(
      extractYearBoundsFromCollectionCommandPrompt(
        "techno last year",
        referenceDate,
      ),
    ).toEqual({
      yearStartInclusive: 2025,
      yearEndExclusive: 2026,
    });
  });

  it("returns null when no relative year phrase is present", () => {
    expect(
      extractYearBoundsFromCollectionCommandPrompt(
        "All tech house before 2019",
        referenceDate,
      ),
    ).toBeNull();
  });
});

describe("applyPromptYearBoundsToIntent", () => {
  it("overrides wrong LLM years when the prompt uses a relative year phrase", () => {
    const intent = applyPromptYearBoundsToIntent(
      baseIntent,
      "All Deep House and Electro from the last two years",
      referenceDate,
    );

    expect(intent.selectedYears).toEqual([]);
    expect(intent.yearStartInclusive).toBe(2025);
    expect(intent.yearEndExclusive).toBe(2027);
    expect(intent.selectedStyles).toEqual(["Deep House", "Electro"]);
  });
});
