import type { CollectionCommandIntent } from "src/lib/validation/collectionCommand.schemas";

export type CollectionCommandPromptScenario = {
  id: string;
  prompt: string;
  llm: Partial<CollectionCommandIntent>;
  expected: Partial<CollectionCommandIntent>;
  category:
    | "year-explicit"
    | "year-relative"
    | "year-span"
    | "year-llm-bounds"
    | "style-include"
    | "style-exclude"
    | "style-combined"
    | "passthrough"
    | "regression";
};

export const COLLECTION_COMMAND_PROMPT_SCENARIO_MATRIX: CollectionCommandPromptScenario[] =
  [
    {
      id: "deep-house-2018-not-house",
      category: "regression",
      prompt: "Show me all Deep House releases from 2018 that arent House",
      llm: { selectedStyles: ["Deep House"], selectedYears: [] },
      expected: {
        selectedStyles: ["Deep House"],
        excludedStyles: ["House"],
        selectedYears: [2018],
        styleOperator: "OR",
      },
    },
    {
      id: "deep-house-2018-arent-apostrophe",
      category: "regression",
      prompt: "Deep House from 2018 that aren't House",
      llm: { selectedStyles: [], selectedYears: [] },
      expected: {
        selectedStyles: ["Deep House"],
        excludedStyles: ["House"],
        selectedYears: [2018],
      },
    },
    {
      id: "llm-none-house-repair",
      category: "regression",
      prompt: "Deep House from 2018 that aren't House",
      llm: {
        selectedStyles: ["House"],
        styleOperator: "NONE",
        selectedYears: [],
      },
      expected: {
        selectedStyles: ["Deep House"],
        excludedStyles: ["House"],
        selectedYears: [2018],
        styleOperator: "OR",
      },
    },
    {
      id: "from-2018",
      category: "year-explicit",
      prompt: "Techno from 2018",
      llm: { selectedStyles: ["Techno"], selectedYears: [1999] },
      expected: { selectedYears: [2018], selectedStyles: ["Techno"] },
    },
    {
      id: "in-2001",
      category: "year-explicit",
      prompt: "show me house releases in 2001",
      llm: { selectedStyles: ["House"], selectedYears: [] },
      expected: { selectedYears: [2001], selectedStyles: ["House"] },
    },
    {
      id: "released-in-2005",
      category: "year-explicit",
      prompt: "Ambient released in 2005",
      llm: { selectedStyles: ["Ambient"], selectedYears: [] },
      expected: { selectedYears: [2005], selectedStyles: ["Ambient"] },
    },
    {
      id: "2012-releases-word",
      category: "year-explicit",
      prompt: "Filter my 2012 releases",
      llm: { selectedYears: [] },
      expected: { selectedYears: [2012] },
    },
    {
      id: "multi-in-years",
      category: "year-explicit",
      prompt: "House in 2018 and 2019",
      llm: { selectedStyles: ["House"], selectedYears: [] },
      expected: { selectedYears: [2018, 2019] },
    },
    {
      id: "between-years",
      category: "year-span",
      prompt: "Disco between 2015 and 2017",
      llm: { selectedYears: [2020], selectedStyles: ["Disco"] },
      expected: {
        selectedYears: [2015, 2016, 2017],
        selectedStyles: ["Disco"],
        yearStartInclusive: 0,
        yearEndExclusive: 0,
      },
    },
    {
      id: "last-two-years",
      category: "year-relative",
      prompt: "All techno from the last two years",
      llm: { selectedYears: [2018, 2019], selectedStyles: ["Techno"] },
      expected: {
        selectedYears: [],
        yearStartInclusive: 2025,
        yearEndExclusive: 2027,
        selectedStyles: ["Techno"],
      },
    },
    {
      id: "past-3-years",
      category: "year-relative",
      prompt: "vinyl from the past 3 years",
      llm: { selectedYears: [2020], selectedFormats: ["Vinyl"] },
      expected: {
        selectedYears: [],
        yearStartInclusive: 2024,
        yearEndExclusive: 2027,
        selectedFormats: ["Vinyl"],
      },
    },
    {
      id: "this-year",
      category: "year-relative",
      prompt: "new arrivals this year",
      llm: { selectedYears: [2019] },
      expected: {
        selectedYears: [],
        yearStartInclusive: 2026,
        yearEndExclusive: 2027,
      },
    },
    {
      id: "last-year",
      category: "year-relative",
      prompt: "everything I added last year",
      llm: { selectedYears: [2018] },
      expected: {
        selectedYears: [],
        yearStartInclusive: 2025,
        yearEndExclusive: 2026,
      },
    },
    {
      id: "before-year-llm",
      category: "year-llm-bounds",
      prompt: "Techno before 2019",
      llm: {
        selectedStyles: ["Techno"],
        yearEndExclusive: 2019,
        selectedYears: [],
      },
      expected: {
        selectedStyles: ["Techno"],
        yearEndExclusive: 2019,
        selectedYears: [],
      },
    },
    {
      id: "show-me-releases",
      category: "style-include",
      prompt: "Show me all Deep House releases",
      llm: { selectedStyles: [] },
      expected: { selectedStyles: ["Deep House"] },
    },
    {
      id: "find-electro-releases",
      category: "style-include",
      prompt: "Find Electro releases from 2010",
      llm: { selectedStyles: [], selectedYears: [] },
      expected: { selectedStyles: ["Electro"], selectedYears: [2010] },
    },
    {
      id: "and-two-styles",
      category: "style-include",
      prompt: "Electro and Deep House releases from the 90s",
      llm: { selectedStyles: [], styleOperator: "OR" },
      expected: {
        selectedStyles: ["Electro", "Deep House"],
      },
    },
    {
      id: "colon-vinyl-lead",
      category: "style-include",
      prompt: "Vinyl only: Deep House from 2018",
      llm: {
        selectedFormats: ["Vinyl"],
        selectedStyles: [],
        selectedYears: [],
      },
      expected: {
        selectedFormats: ["Vinyl"],
        selectedStyles: ["Deep House"],
        selectedYears: [2018],
      },
    },
    {
      id: "excluding-single",
      category: "style-exclude",
      prompt: "Techno releases excluding Ambient",
      llm: { selectedStyles: ["Techno"], selectedYears: [] },
      expected: {
        selectedStyles: ["Techno"],
        excludedStyles: ["Ambient"],
      },
    },
    {
      id: "without-dub",
      category: "style-exclude",
      prompt: "Jungle without Dub",
      llm: { selectedStyles: ["Jungle"] },
      expected: { selectedStyles: ["Jungle"], excludedStyles: ["Dub"] },
    },
    {
      id: "except-multiple",
      category: "style-exclude",
      prompt: "Drum n Bass except Ambient and Noise",
      llm: { selectedStyles: ["Drum n Bass"] },
      expected: {
        selectedStyles: ["Drum n Bass"],
        excludedStyles: ["Ambient", "Noise"],
      },
    },
    {
      id: "are-not-tail",
      category: "style-exclude",
      prompt: "Garage from 2002 that are not House",
      llm: { selectedStyles: ["Garage", "House"], selectedYears: [] },
      expected: {
        selectedStyles: ["Garage"],
        excludedStyles: ["House"],
        selectedYears: [2002],
      },
    },
    {
      id: "dont-have-style",
      category: "style-exclude",
      prompt: "Minimal releases from 2014 that don't have Techno",
      llm: { selectedStyles: ["Minimal"], selectedYears: [] },
      expected: {
        selectedStyles: ["Minimal"],
        excludedStyles: ["Techno"],
        selectedYears: [2014],
      },
    },
    {
      id: "search-artist-year",
      category: "style-combined",
      prompt: "Moodymann from 2010 that arent Compilations",
      llm: {
        searchQuery: "Moodymann",
        selectedStyles: [],
        selectedYears: [],
      },
      expected: {
        searchQuery: "Moodymann",
        selectedYears: [2010],
        excludedStyles: ["Compilations"],
      },
    },
    {
      id: "wrong-positive-stripped",
      category: "style-combined",
      prompt: "Deep House from 2018 that aren't House",
      llm: {
        selectedStyles: ["Deep House", "House"],
        selectedYears: [2020],
      },
      expected: {
        selectedStyles: ["Deep House"],
        excludedStyles: ["House"],
        selectedYears: [2018],
      },
    },
    {
      id: "and-operator-preserved",
      category: "passthrough",
      prompt: "Rock and Jazz on CD",
      llm: {
        selectedStyles: ["Rock", "Jazz"],
        selectedFormats: ["CD"],
        styleOperator: "AND",
      },
      expected: {
        selectedStyles: ["Rock", "Jazz"],
        selectedFormats: ["CD"],
        styleOperator: "AND",
        excludedStyles: [],
      },
    },
    {
      id: "search-only-preserved",
      category: "passthrough",
      prompt: "blue note pressings",
      llm: { searchQuery: "blue note", selectedStyles: [] },
      expected: { searchQuery: "blue note" },
    },
    {
      id: "sort-llm-only",
      category: "passthrough",
      prompt: "techno sorted by year newest",
      llm: {
        selectedStyles: ["Techno"],
        selectedSort: "AlbumYearNew",
      },
      expected: {
        selectedStyles: ["Techno"],
        selectedSort: "AlbumYearNew",
      },
    },
    {
      id: "format-none-llm",
      category: "passthrough",
      prompt: "not on cassette",
      llm: {
        selectedFormats: ["Cassette"],
        formatOperator: "NONE",
        selectedStyles: [],
      },
      expected: {
        selectedFormats: ["Cassette"],
        formatOperator: "NONE",
      },
    },
    {
      id: "no-releases-word-year-only",
      category: "year-explicit",
      prompt: "everything from 2017",
      llm: { selectedYears: [] },
      expected: { selectedYears: [2017] },
    },
    {
      id: "casual-typing-arent",
      category: "style-exclude",
      prompt: "show me soul releases from 1978 that arent disco",
      llm: { selectedStyles: [], selectedYears: [] },
      expected: {
        selectedStyles: ["soul"],
        excludedStyles: ["disco"],
        selectedYears: [1978],
      },
    },
    {
      id: "filter-to-keyword",
      category: "style-include",
      prompt: "Filter to Acid House releases",
      llm: { selectedStyles: [] },
      expected: { selectedStyles: ["Acid House"] },
    },
    {
      id: "relative-blocks-explicit-year",
      category: "year-relative",
      prompt: "Jazz from the last 5 years only",
      llm: { selectedYears: [2018], selectedStyles: ["Jazz"] },
      expected: {
        selectedYears: [],
        yearStartInclusive: 2022,
        yearEndExclusive: 2027,
        selectedStyles: ["Jazz"],
      },
    },
  ];
