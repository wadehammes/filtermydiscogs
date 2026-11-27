import { describe, expect, it } from "@jest/globals";
import { SortSecondaryValues, SortValues } from "src/constants/sortValues";
import type { CollectionCommandIntent } from "src/lib/validation/collectionCommand.schemas";
import {
  collectionCommandIntentToFilters,
  expandYearsFromInclusiveBounds,
  sanitizeCollectionCommandIntent,
} from "src/utils/collectionCommandIntent";

const baseIntent: CollectionCommandIntent = {
  searchQuery: "aphex",
  selectedStyles: ["Techno", "NotInCollection"],
  selectedYears: [1999, 1888],
  selectedFormats: ["Vinyl"],
  styleOperator: "OR",
  formatOperator: "OR",
  yearOperator: "OR",
  selectedSort: SortValues.DateAddedNew,
  selectedSortSecondary: SortSecondaryValues.None,
  yearStartInclusive: 0,
  yearEndExclusive: 0,
};

describe("expandYearsFromInclusiveBounds", () => {
  it("returns every available year strictly before yearEndExclusive", () => {
    expect(
      expandYearsFromInclusiveBounds([1985, 1999, 2010, 2018, 2019], 0, 2019),
    ).toEqual([1985, 1999, 2010, 2018]);
  });
});

describe("sanitizeCollectionCommandIntent", () => {
  it("drops facet tags that are not in the collection", () => {
    const result = sanitizeCollectionCommandIntent(baseIntent, {
      availableStyles: ["Techno"],
      availableYears: [1999],
      availableFormats: ["Vinyl"],
    });

    expect(result.filters.selectedStyles).toEqual(["Techno"]);
    expect(result.filters.selectedYears).toEqual([1999]);
    expect(result.droppedStyles).toEqual(["NotInCollection"]);
    expect(result.droppedYears).toEqual([1888]);
  });

  it("prefers year bounds over a single LLM year tag", () => {
    const result = sanitizeCollectionCommandIntent(
      {
        ...baseIntent,
        searchQuery: "",
        selectedStyles: ["Tech House"],
        selectedYears: [2018],
        yearEndExclusive: 2019,
      },
      {
        availableStyles: ["Tech House"],
        availableYears: [1990, 2005, 2010, 2018],
        availableFormats: [],
      },
    );

    expect(result.filters.selectedYears).toEqual([1990, 2005, 2010, 2018]);
    expect(result.filters.yearOperator).toBe("OR");
  });

  it("defaults sort to release year newest when year bounds are set and sort is unchanged", () => {
    const result = sanitizeCollectionCommandIntent(
      {
        ...baseIntent,
        searchQuery: "",
        selectedStyles: ["Tech House"],
        selectedYears: [],
        yearEndExclusive: 2019,
        selectedSort: SortValues.DateAddedNew,
        selectedSortSecondary: SortSecondaryValues.None,
      },
      {
        availableStyles: ["Tech House"],
        availableYears: [2010, 2018],
        availableFormats: [],
      },
    );

    expect(result.filters.selectedSort).toBe(SortValues.AlbumYearNew);
  });
});

describe("collectionCommandIntentToFilters", () => {
  it("maps intent into persisted filter shape", () => {
    const filters = collectionCommandIntentToFilters(baseIntent);

    expect(filters.searchQuery).toBe("aphex");
    expect(filters.selectedSort).toBe(SortValues.DateAddedNew);
  });
});
