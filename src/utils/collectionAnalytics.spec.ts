import { describe, expect, it } from "@jest/globals";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  calculateCollectionStats,
  calculateFormatMixSummary,
  calculateFormatTagDistribution,
  calculateMediaFormatSubtypeBreakdown,
  calculateMediaTypeDistribution,
} from "src/utils/collectionAnalytics";

describe("calculateCollectionStats", () => {
  it("counts genres and reads ratings from the release instance", () => {
    const releases = [
      releaseFactory.build({
        rating: 4,
        basic_information: basicInformationFactory.build({
          genres: ["Electronic", "Rock"],
          styles: ["Techno"],
          artists: [{ name: "Artist One" }],
          labels: [{ name: "Label One" }],
        }),
      }),
      releaseFactory.build({
        rating: 5,
        basic_information: basicInformationFactory.build({
          genres: ["Rock"],
          styles: ["Indie Rock"],
          artists: [{ name: "Artist Two" }],
          labels: [{ name: "Label Two" }],
        }),
      }),
      releaseFactory.build({
        rating: 0,
        basic_information: basicInformationFactory.build({
          genres: [],
          styles: ["Jazz"],
          artists: [{ name: "Artist Three" }],
          labels: [{ name: "Label Three" }],
        }),
      }),
    ];

    expect(calculateCollectionStats(releases)).toEqual({
      totalReleases: 3,
      uniqueArtists: 3,
      uniqueLabels: 3,
      averageRating: 4.5,
      totalStyles: 3,
      totalGenres: 2,
    });
  });
});

describe("calculateMediaTypeDistribution", () => {
  it("counts one primary media type per release", () => {
    const releases = [
      releaseFactory.withNamedFormats(["Vinyl"]),
      releaseFactory.withNamedFormats(["Vinyl"]),
      releaseFactory.withNamedFormats(["CD"]),
    ];

    const result = calculateMediaTypeDistribution(releases);

    expect(result).toEqual([
      { label: "Vinyl", value: 2, count: 2 },
      { label: "CD", value: 1, count: 1 },
    ]);
  });
});

describe("calculateFormatTagDistribution", () => {
  it("counts physical subtype tags once per release and excludes media types", () => {
    const releases = [
      releaseFactory.build({
        basic_information: {
          ...releaseFactory.withDisplayDefaults().basic_information,
          formats: [
            {
              name: "Vinyl",
              descriptions: ["LP", "Album"],
            },
          ],
        },
      }),
      releaseFactory.build({
        basic_information: {
          ...releaseFactory.withDisplayDefaults().basic_information,
          formats: [
            {
              name: "Vinyl",
              descriptions: ["EP"],
            },
          ],
        },
      }),
    ];

    const result = calculateFormatTagDistribution(releases);

    expect(result).toEqual([
      { label: "LP", value: 1, count: 1 },
      { label: "EP", value: 1, count: 1 },
    ]);
  });
});

describe("calculateMediaFormatSubtypeBreakdown", () => {
  it("groups subtype tags by primary media type", () => {
    const releases = [
      releaseFactory.build({
        basic_information: {
          ...releaseFactory.withDisplayDefaults().basic_information,
          formats: [{ name: "Vinyl", descriptions: ["LP", '12"'] }],
        },
      }),
      releaseFactory.build({
        basic_information: {
          ...releaseFactory.withDisplayDefaults().basic_information,
          formats: [{ name: "Vinyl", descriptions: ["EP"] }],
        },
      }),
      releaseFactory.build({
        basic_information: {
          ...releaseFactory.withDisplayDefaults().basic_information,
          formats: [{ name: "CD", descriptions: ["Mini-Album"] }],
        },
      }),
    ];

    const result = calculateMediaFormatSubtypeBreakdown(releases);

    expect(result[0]).toMatchObject({
      mediaType: "Vinyl",
      releaseCount: 2,
    });
    expect(result[0]?.subtypes).toEqual(
      expect.arrayContaining([
        { label: "LP", value: 1, count: 1 },
        { label: '12"', value: 1, count: 1 },
        { label: "EP", value: 1, count: 1 },
      ]),
    );
    expect(result).toEqual([result[0]]);
  });

  it("omits media types with only one subtype", () => {
    const releases = [
      releaseFactory.build({
        basic_information: {
          ...releaseFactory.withDisplayDefaults().basic_information,
          formats: [{ name: "Box Set", descriptions: ["Album"] }],
        },
      }),
      releaseFactory.build({
        basic_information: {
          ...releaseFactory.withDisplayDefaults().basic_information,
          formats: [{ name: "Box Set", descriptions: ["Compilation"] }],
        },
      }),
    ];

    expect(calculateMediaFormatSubtypeBreakdown(releases)).toEqual([]);
  });

  it("counts releases without subtype tags as unspecified", () => {
    const releases = [
      releaseFactory.build({
        basic_information: {
          ...releaseFactory.withDisplayDefaults().basic_information,
          formats: [{ name: "Vinyl", descriptions: ["Album"] }],
        },
      }),
    ];

    const result = calculateMediaFormatSubtypeBreakdown(releases);

    expect(result).toEqual([]);
  });
});

describe("calculateFormatMixSummary", () => {
  it("returns top media type percent and top subtype tags", () => {
    const releases = [
      releaseFactory.build({
        basic_information: {
          ...releaseFactory.withDisplayDefaults().basic_information,
          formats: [{ name: "Vinyl", descriptions: ["LP"] }],
        },
      }),
      releaseFactory.build({
        basic_information: {
          ...releaseFactory.withDisplayDefaults().basic_information,
          formats: [{ name: "Vinyl", descriptions: ["LP"] }],
        },
      }),
      releaseFactory.build({
        basic_information: {
          ...releaseFactory.withDisplayDefaults().basic_information,
          formats: [{ name: "CD" }],
        },
      }),
    ];

    const summary = calculateFormatMixSummary(releases);

    expect(summary).toEqual({
      topMediaType: "Vinyl",
      topMediaTypePercent: 67,
      topTags: [{ label: "LP", count: 2 }],
    });
  });
});
