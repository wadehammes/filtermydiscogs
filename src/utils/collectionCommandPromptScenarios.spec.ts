import { describe, expect, it } from "@jest/globals";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { collectionCommandIntentFactory } from "src/tests/factories/CollectionCommandIntent.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { sanitizeCollectionCommandIntent } from "src/utils/collectionCommandIntent";
import { applyCollectionCommandPromptRules } from "src/utils/collectionCommandPromptRules";
import { filterReleases } from "src/utils/filterReleases";

const referenceDate = new Date("2026-11-27T12:00:00.000Z");

const facetOptions = {
  availableStyles: ["Deep House", "House", "Techno", "Ambient"],
  availableYears: [2017, 2018, 2019, 2020],
  availableFormats: ["Vinyl", "CD"],
};

describe("collectionCommandPromptScenarios", () => {
  it("when deep house 2018 exclude house runs end-to-end, keeps only matching releases", () => {
    const prompt = "Show me all Deep House releases from 2018 that arent House";
    const llmIntent = collectionCommandIntentFactory.build({
      selectedStyles: ["Deep House"],
      selectedYears: [],
    });

    const merged = applyCollectionCommandPromptRules(
      llmIntent,
      prompt,
      referenceDate,
    );
    const { filters } = sanitizeCollectionCommandIntent(merged, facetOptions);

    expect(filters).toMatchObject({
      selectedStyles: ["Deep House"],
      excludedStyles: ["House"],
      selectedYears: [2018],
      styleOperator: "OR",
    });

    const deepHouseOnly = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        year: 2018,
        styles: ["Deep House"],
      }),
    });
    const deepHouseAndHouse = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        year: 2018,
        styles: ["Deep House", "House"],
      }),
    });
    const wrongYear = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        year: 2019,
        styles: ["Deep House"],
      }),
    });

    const matched = filterReleases({
      releases: [deepHouseOnly, deepHouseAndHouse, wrongYear],
      ...filters,
    });

    expect(matched).toEqual([deepHouseOnly]);
  });

  const operatorScenarios: Array<{
    name: string;
    filters: Parameters<typeof filterReleases>[0];
    expectedCount: number;
  }> = [
    {
      name: "include techno exclude ambient",
      filters: {
        releases: [
          releaseFactory.build({
            basic_information: basicInformationFactory.build({
              styles: ["Techno"],
            }),
          }),
          releaseFactory.build({
            basic_information: basicInformationFactory.build({
              styles: ["Techno", "Ambient"],
            }),
          }),
        ],
        selectedStyles: ["Techno"],
        excludedStyles: ["Ambient"],
        selectedYears: [],
        selectedFormats: [],
        styleOperator: "OR",
        formatOperator: "OR",
        yearOperator: "OR",
        searchQuery: "",
      },
      expectedCount: 1,
    },
    {
      name: "year 2018 only",
      filters: {
        releases: [
          releaseFactory.build({
            basic_information: basicInformationFactory.build({ year: 2018 }),
          }),
          releaseFactory.build({
            basic_information: basicInformationFactory.build({ year: 2019 }),
          }),
        ],
        selectedStyles: [],
        excludedStyles: [],
        selectedYears: [2018],
        selectedFormats: [],
        styleOperator: "OR",
        formatOperator: "OR",
        yearOperator: "OR",
        searchQuery: "",
      },
      expectedCount: 1,
    },
  ];

  for (const scenario of operatorScenarios) {
    it(`when ${scenario.name}, filters releases as expected`, () => {
      const result = filterReleases(scenario.filters);
      expect(result).toHaveLength(scenario.expectedCount);
    });
  }
});
