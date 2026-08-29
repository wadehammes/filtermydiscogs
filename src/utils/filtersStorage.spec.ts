import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  clearPersistedFilters,
  defaultPersistedFilters,
  FILTERS_STORAGE_KEY,
  parsePersistedFilters,
  persistedFiltersEqual,
} from "./filtersStorage";

describe("filtersStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns defaults when storage is empty", () => {
    expect(parsePersistedFilters(null)).toEqual(defaultPersistedFilters);
  });

  it("writes and reads persisted filter state", () => {
    const saved = {
      selectedStyles: ["Jazz"],
      selectedYears: [1970],
      selectedFormats: ["LP"],
      selectedSort: "AZTitle",
      styleOperator: "AND",
      formatOperator: "NONE",
      yearOperator: "OR",
      searchQuery: "blue note",
    };

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
    ).toEqual({
      selectedStyles: ["Jazz"],
      selectedYears: [1970],
      selectedFormats: ["LP"],
      selectedSort: "AZTitle",
      styleOperator: "AND",
      formatOperator: "OR",
      yearOperator: "OR",
      searchQuery: "blue note",
    });
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
    ).toEqual({
      selectedStyles: ["Jazz"],
      selectedYears: [1970],
      selectedFormats: ["LP"],
      selectedSort: "AZTitle",
      styleOperator: "AND",
      formatOperator: "OR",
      yearOperator: "OR",
      searchQuery: "blue note",
    });
  });

  it("returns defaults for invalid JSON and clears corrupt storage", () => {
    localStorage.setItem(FILTERS_STORAGE_KEY, "{ invalid");

    expect(
      parsePersistedFilters(localStorage.getItem(FILTERS_STORAGE_KEY)),
    ).toEqual(defaultPersistedFilters);
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
    ).toEqual(defaultPersistedFilters);
    expect(localStorage.getItem(FILTERS_STORAGE_KEY)).toBeNull();
  });

  it("migrates deprecated community rating sort to date added", () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        ...defaultPersistedFilters,
        selectedSort: "CommunityRatingHigh",
      }),
    );

    expect(
      parsePersistedFilters(localStorage.getItem(FILTERS_STORAGE_KEY)),
    ).toEqual(defaultPersistedFilters);
  });

  it("returns defaults for invalid sort and style operator values", () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        ...defaultPersistedFilters,
        selectedSort: "InvalidSort",
        styleOperator: "XOR",
        formatOperator: "XOR",
      }),
    );

    expect(
      parsePersistedFilters(localStorage.getItem(FILTERS_STORAGE_KEY)),
    ).toEqual(defaultPersistedFilters);
  });

  it("clears persisted filter state", () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify(defaultPersistedFilters),
    );

    clearPersistedFilters();

    expect(localStorage.getItem(FILTERS_STORAGE_KEY)).toBeNull();
  });

  it("compares persisted filters independent of multi-select order", () => {
    const left = {
      ...defaultPersistedFilters,
      selectedStyles: ["Acid", "Deep House"],
      selectedYears: [1999, 1988],
      selectedFormats: ["Vinyl", "CD"],
    };
    const right = {
      ...left,
      selectedStyles: ["Deep House", "Acid"],
      selectedYears: [1988, 1999],
      selectedFormats: ["CD", "Vinyl"],
    };

    expect(persistedFiltersEqual(left, right)).toBe(true);
  });

  it("compares persisted filters independent of object key order", () => {
    const left = {
      ...defaultPersistedFilters,
      selectedStyles: ["Acid"],
    };
    const right = {
      searchQuery: "",
      yearOperator: "OR" as const,
      formatOperator: "OR" as const,
      styleOperator: "OR" as const,
      selectedSort: defaultPersistedFilters.selectedSort,
      selectedFormats: [],
      selectedYears: [],
      selectedStyles: ["Acid"],
    };

    expect(persistedFiltersEqual(left, right)).toBe(true);
  });
});
