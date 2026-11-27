import { describe, expect, it } from "@jest/globals";
import {
  COLLECTION_COMMAND_EXAMPLE_PROMPT_MAX_LENGTH,
  COLLECTION_COMMAND_EXAMPLE_PROMPTS_FALLBACK,
} from "src/constants/collectionCommand.constants";
import { SortSecondaryValues, SortValues } from "src/constants/sortValues";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type {
  FacetOptions,
  PersistedFiltersJson,
} from "src/types/filters.types";
import {
  buildCollectionCommandExamplePrompts,
  sampleDistinctFacetStyles,
} from "src/utils/collectionCommandExamplePrompts";

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
    expect(prompts.some((prompt) => /Save a view named/i.test(prompt))).toBe(
      true,
    );
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
    expect(prompts[0]).toMatch(/Show me .+ AND .+ releases from the \d{4}s/i);
    expect(prompts[1]).toMatch(/Save a view for/i);
    expect(prompts[2]).toMatch(/Create a crate from|Crate /i);
    for (const prompt of prompts) {
      expect(prompt.length).toBeLessThanOrEqual(
        COLLECTION_COMMAND_EXAMPLE_PROMPT_MAX_LENGTH,
      );
    }
    expect(new Set(prompts).size).toBe(3);
  });

  it("varies idle examples when shuffleSeed changes", () => {
    const facetOptions = {
      availableStyles: ["Jazz", "Soul", "Funk", "Disco"],
      availableYears: [1985, 1987, 1988, 1992],
      availableFormats: ["Vinyl", "CD"],
    };

    const first = buildCollectionCommandExamplePrompts({
      filters: baseFilters(),
      facetOptions,
      shuffleSeed: 1,
    });
    const second = buildCollectionCommandExamplePrompts({
      filters: baseFilters(),
      facetOptions,
      shuffleSeed: 42,
    });

    expect(first.join("|||")).not.toBe(second.join("|||"));
  });

  it("uses a different style in each idle example when the collection supports it", () => {
    const releases = [
      releaseFactory.build({
        basic_information: {
          styles: ["House"],
          formats: [{ name: "Vinyl", qty: "1" }],
        },
      }),
      releaseFactory.build({
        basic_information: {
          styles: ["Techno"],
          formats: [{ name: "Vinyl", qty: "1" }],
        },
      }),
      releaseFactory.build({
        basic_information: {
          styles: ["Deep House"],
          year: 2019,
          formats: [{ name: "Vinyl", qty: "1" }],
        },
      }),
    ];

    const prompts = buildCollectionCommandExamplePrompts({
      filters: baseFilters(),
      facetOptions: {
        availableStyles: ["House", "Techno", "Deep House", "Ambient"],
        availableYears: [2018, 2019, 2020],
        availableFormats: ["Vinyl"],
      },
      releases,
      shuffleSeed: 5,
    });

    const mentionedStyles = ["House", "Techno", "Deep House", "Ambient"].filter(
      (style) => prompts.some((prompt) => prompt.includes(style)),
    );

    expect(mentionedStyles.length).toBeGreaterThanOrEqual(3);
    expect(prompts[0]).toMatch(
      /Show me .+ AND .+ releases from the 20(10|18|19|20)s/i,
    );
    expect(new Set(prompts).size).toBe(3);
  });

  it("foregrounds different styles across idle examples when facets allow", () => {
    const facetOptions = {
      availableStyles: ["Abstract", "Acid", "Techno", "House"],
      availableYears: [2012, 2014, 2013],
      availableFormats: ["Vinyl"],
    };

    const prompts = buildCollectionCommandExamplePrompts({
      filters: baseFilters(),
      facetOptions,
    });

    const stylesInPrompts = facetOptions.availableStyles.filter((style) =>
      prompts.some((prompt) => prompt.includes(style)),
    );

    expect(stylesInPrompts.length).toBeGreaterThanOrEqual(3);
    expect(sampleDistinctFacetStyles(facetOptions.availableStyles, 3)).toEqual(
      sampleDistinctFacetStyles(facetOptions.availableStyles, 3),
    );
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

    expect(prompts[0]).toMatch(/"morning"/i);
  });

  it("keeps decade phrasing in refine examples when filters omit years", () => {
    const prompts = buildCollectionCommandExamplePrompts({
      filters: {
        ...baseFilters(),
        selectedStyles: ["Electronic"],
        selectedFormats: ["Vinyl"],
      },
      facetOptions: {
        availableStyles: ["Electronic"],
        availableYears: [2012, 2014, 2013],
        availableFormats: ["Vinyl"],
      },
    });

    expect(prompts[0]).toMatch(/limit to the 2010s/i);
    expect(prompts[0]).not.toMatch(/\bthe 10s\b/i);
  });

  it("prefers styles that match the loaded collection when releases are provided", () => {
    const releases = [
      releaseFactory.build({
        basic_information: {
          styles: ["Techno"],
          formats: [{ name: "Vinyl", qty: "1" }],
        },
      }),
    ];

    const prompts = buildCollectionCommandExamplePrompts({
      filters: baseFilters(),
      facetOptions: {
        availableStyles: ["Abstract", "Techno"],
        availableYears: [2012],
        availableFormats: ["Vinyl"],
      },
      releases,
    });

    expect(prompts.every((prompt) => !/Abstract/i.test(prompt))).toBe(true);
    expect(prompts.some((prompt) => /Techno/i.test(prompt))).toBe(true);
  });

  it("falls back when facets and filters are empty", () => {
    const prompts = buildCollectionCommandExamplePrompts({
      filters: baseFilters(),
      facetOptions: emptyFacets(),
    });

    expect(prompts).toEqual([...COLLECTION_COMMAND_EXAMPLE_PROMPTS_FALLBACK]);
  });
});
