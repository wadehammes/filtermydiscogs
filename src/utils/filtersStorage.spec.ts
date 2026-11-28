import { beforeEach, describe, expect, it } from "@jest/globals";
import { SortSecondaryValues, SortValues } from "src/constants/sortValues";
import { persistedFiltersFactory } from "src/tests/factories/UserPreferences.factory";
import {
  clearPersistedFilters,
  FILTERS_STORAGE_KEY,
  parsePersistedFilters,
  persistedFiltersEqual,
} from "./filtersStorage";

describe("filtersStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns defaults when storage is empty", () => {
    expect(parsePersistedFilters(null)).toEqual(
      persistedFiltersFactory.empty(),
    );
  });

  it("writes and reads persisted filter state", () => {
    const saved = persistedFiltersFactory.withDefaults({
      selectedStyles: ["Jazz"],
      excludedStyles: ["Techno"],
      selectedYears: [1970],
      selectedFormats: ["LP"],
      selectedSort: SortValues.AZTitle,
      selectedSortSecondary: SortSecondaryValues.None,
      styleOperator: "AND",
      formatOperator: "NONE",
      yearOperator: "OR",
      searchQuery: "blue note",
    });

    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(saved));

    expect(
      parsePersistedFilters(localStorage.getItem(FILTERS_STORAGE_KEY)),
    ).toEqual(saved);
  });

  it("defaults formatOperator and yearOperator when missing from stored filters", () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        selectedStyles: ["Jazz"],
        selectedYears: [1970],
        selectedFormats: ["LP"],
        selectedSort: "AZTitle",
        styleOperator: "AND",
        searchQuery: "blue note",
      }),
    );

    expect(
      parsePersistedFilters(localStorage.getItem(FILTERS_STORAGE_KEY)),
    ).toEqual(
      persistedFiltersFactory.withDefaults({
        selectedStyles: ["Jazz"],
        selectedYears: [1970],
        selectedFormats: ["LP"],
        selectedSort: SortValues.AZTitle,
        styleOperator: "AND",
        searchQuery: "blue note",
      }),
    );
  });

  it("defaults yearOperator when missing from stored filters", () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        selectedStyles: ["Jazz"],
        selectedYears: [1970],
        selectedFormats: ["LP"],
        selectedSort: "AZTitle",
        styleOperator: "AND",
        formatOperator: "OR",
        searchQuery: "blue note",
      }),
    );

    expect(
      parsePersistedFilters(localStorage.getItem(FILTERS_STORAGE_KEY)),
    ).toEqual(
      persistedFiltersFactory.withDefaults({
        selectedStyles: ["Jazz"],
        selectedYears: [1970],
        selectedFormats: ["LP"],
        selectedSort: SortValues.AZTitle,
        styleOperator: "AND",
        formatOperator: "OR",
        searchQuery: "blue note",
      }),
    );
  });

  it("defaults excludedStyles when missing from stored filters", () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        selectedStyles: ["Jazz"],
        selectedYears: [1970],
        selectedFormats: ["LP"],
        selectedSort: "AZTitle",
        styleOperator: "AND",
        searchQuery: "blue note",
      }),
    );

    expect(
      parsePersistedFilters(localStorage.getItem(FILTERS_STORAGE_KEY))
        .excludedStyles,
    ).toEqual([]);
  });

  it("clears excludedYears when stored filters include both included and excluded years", () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        selectedStyles: [],
        selectedYears: [2018],
        excludedYears: [2019],
        selectedFormats: [],
        selectedSort: SortValues.DateAddedNew,
        styleOperator: "OR",
        searchQuery: "",
      }),
    );

    const parsed = parsePersistedFilters(
      localStorage.getItem(FILTERS_STORAGE_KEY),
    );
    expect(parsed.selectedYears).toEqual([2018]);
    expect(parsed.excludedYears).toEqual([]);
  });

  it("defaults excludedYears and excludedFormats when missing from stored filters", () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        selectedStyles: ["Jazz"],
        excludedStyles: ["Techno"],
        selectedYears: [1970],
        selectedFormats: ["LP"],
        selectedSort: SortValues.AZTitle,
        styleOperator: "AND",
        searchQuery: "blue note",
      }),
    );

    const parsed = parsePersistedFilters(
      localStorage.getItem(FILTERS_STORAGE_KEY),
    );
    expect(parsed.excludedYears).toEqual([]);
    expect(parsed.excludedFormats).toEqual([]);
  });

  it("returns defaults for invalid JSON and clears corrupt storage", () => {
    localStorage.setItem(FILTERS_STORAGE_KEY, "{ invalid");

    expect(
      parsePersistedFilters(localStorage.getItem(FILTERS_STORAGE_KEY)),
    ).toEqual(persistedFiltersFactory.empty());
    expect(localStorage.getItem(FILTERS_STORAGE_KEY)).toBeNull();
  });

  it("returns defaults for invalid filter shapes and clears corrupt storage", () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        selectedStyles: "Jazz",
        selectedYears: [],
        selectedFormats: [],
        selectedSort: "DateAddedNew",
        styleOperator: "OR",
        searchQuery: "",
      }),
    );

    expect(
      parsePersistedFilters(localStorage.getItem(FILTERS_STORAGE_KEY)),
    ).toEqual(persistedFiltersFactory.empty());
    expect(localStorage.getItem(FILTERS_STORAGE_KEY)).toBeNull();
  });

  it("migrates deprecated community rating sort to date added", () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        ...persistedFiltersFactory.empty(),
        selectedSort: "CommunityRatingHigh",
      }),
    );

    expect(
      parsePersistedFilters(localStorage.getItem(FILTERS_STORAGE_KEY)),
    ).toEqual(persistedFiltersFactory.empty());
  });

  it("clears Then by when it conflicts with the primary sort field on read", () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        ...persistedFiltersFactory.empty(),
        selectedSort: SortValues.DateAddedNew,
        selectedSortSecondary: SortValues.DateAddedOld,
      }),
    );

    expect(
      parsePersistedFilters(localStorage.getItem(FILTERS_STORAGE_KEY)),
    ).toMatchObject({
      selectedSort: SortValues.DateAddedNew,
      selectedSortSecondary: SortSecondaryValues.None,
    });
  });

  it("returns defaults for invalid sort and style operator values", () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        ...persistedFiltersFactory.empty(),
        selectedSort: "InvalidSort",
        styleOperator: "XOR",
        formatOperator: "XOR",
      }),
    );

    expect(
      parsePersistedFilters(localStorage.getItem(FILTERS_STORAGE_KEY)),
    ).toEqual(persistedFiltersFactory.empty());
  });

  it("clears persisted filter state", () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify(persistedFiltersFactory.empty()),
    );

    clearPersistedFilters();

    expect(localStorage.getItem(FILTERS_STORAGE_KEY)).toBeNull();
  });

  it("compares persisted filters independent of multi-select order", () => {
    const left = persistedFiltersFactory.withDefaults({
      selectedStyles: ["Acid", "Deep House"],
      selectedYears: [1999, 1988],
      selectedFormats: ["Vinyl", "CD"],
    });
    const right = persistedFiltersFactory.withDefaults({
      selectedStyles: ["Deep House", "Acid"],
      selectedYears: [1988, 1999],
      selectedFormats: ["CD", "Vinyl"],
    });

    expect(persistedFiltersEqual(left, right)).toBe(true);
  });

  it("compares persisted filters independent of object key order", () => {
    const left = persistedFiltersFactory.withDefaults({
      selectedStyles: ["Acid"],
    });
    const right = {
      searchQuery: left.searchQuery,
      yearOperator: left.yearOperator,
      formatOperator: left.formatOperator,
      styleOperator: left.styleOperator,
      selectedSort: left.selectedSort,
      selectedSortSecondary: left.selectedSortSecondary,
      selectedFormats: left.selectedFormats,
      excludedStyles: left.excludedStyles,
      excludedFormats: left.excludedFormats,
      selectedYears: left.selectedYears,
      excludedYears: left.excludedYears,
      selectedStyles: left.selectedStyles,
    };

    expect(persistedFiltersEqual(left, right)).toBe(true);
  });
});
