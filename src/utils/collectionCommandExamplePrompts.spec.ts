import { describe, expect, it } from "@jest/globals";
import { COLLECTION_COMMAND_EXAMPLE_PROMPTS_FALLBACK } from "src/constants/collectionCommand.constants";
import { SortSecondaryValues, SortValues } from "src/constants/sortValues";
import type {
  FacetOptions,
  PersistedFiltersJson,
} from "src/types/filters.types";
import { buildCollectionCommandExamplePrompts } from "src/utils/collectionCommandExamplePrompts";

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

const emptyFacets = (): FacetOptions => ({
  availableStyles: [],
  availableYears: [],
  availableFormats: [],
});

describe("buildCollectionCommandExamplePrompts", () => {
  it("suggests refine, save, and crate prompts from the active filter set", () => {
    const filters = {
      ...baseFilters(),
      selectedStyles: ["Techno"],
      selectedFormats: ["Vinyl"],
      selectedYears: [1992, 1994],
    };
    const prompts = buildCollectionCommandExamplePrompts({
      filters,
      facetOptions: {
        availableStyles: ["Techno", "House"],
        availableYears: [1992, 1994, 1993],
        availableFormats: ["Vinyl", "CD"],
      },
    });

    expect(prompts.length).toBe(3);
    expect(prompts.some((prompt) => /House|Refine|fold in/i.test(prompt))).toBe(
      true,
    );
    expect(
      prompts.some((prompt) => /Save what's on screen/i.test(prompt)),
    ).toBe(true);
    expect(prompts.some((prompt) => /Create a crate/i.test(prompt))).toBe(true);
    expect(new Set(prompts).size).toBe(3);
  });

  it("suggests distinct facet-based prompts when no filters are applied", () => {
    const prompts = buildCollectionCommandExamplePrompts({
      filters: baseFilters(),
      facetOptions: {
        availableStyles: ["Jazz", "Soul"],
        availableYears: [1985, 1987, 1988],
        availableFormats: ["Vinyl", "CD"],
      },
    });

    expect(prompts.length).toBe(3);
    expect(prompts[0]).toMatch(/Jazz and Soul on Vinyl from the 80s/i);
    expect(prompts[1]).toMatch(/Save a view named/i);
    expect(prompts[2]).toMatch(/Make a crate from every Jazz/i);
    expect(new Set(prompts).size).toBe(3);
  });

  it("includes search query in the active refine prompt", () => {
    const prompts = buildCollectionCommandExamplePrompts({
      filters: {
        ...baseFilters(),
        searchQuery: "morning",
      },
      facetOptions: {
        availableStyles: ["Ambient"],
        availableYears: [],
        availableFormats: ["Vinyl"],
      },
    });

    expect(prompts[0]).toMatch(/matching "morning"/i);
  });

  it("uses four-digit decade labels for the 2000s and 2010s", () => {
    const prompts = buildCollectionCommandExamplePrompts({
      filters: baseFilters(),
      facetOptions: {
        availableStyles: ["Electronic"],
        availableYears: [2012, 2014, 2013],
        availableFormats: ["Vinyl"],
      },
    });

    expect(prompts[0]).toMatch(/from the 2010s/i);
    expect(prompts[0]).not.toMatch(/\bthe 10s\b/i);
  });

  it("falls back when facets and filters are empty", () => {
    const prompts = buildCollectionCommandExamplePrompts({
      filters: baseFilters(),
      facetOptions: emptyFacets(),
    });

    expect(prompts).toEqual([...COLLECTION_COMMAND_EXAMPLE_PROMPTS_FALLBACK]);
  });
});
