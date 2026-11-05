import { describe, expect, it } from "@jest/globals";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  buildCollectionAnalytics,
  buildCollectionAnalyticsCore,
  emptyCollectionAnalyticsHeavySections,
} from "src/utils/buildCollectionAnalytics";

describe("buildCollectionAnalyticsCore", () => {
  it("returns stats, growth, and acquisition streaks without duplicate detection", () => {
    const releases = [
      releaseFactory.build({
        rating: 4,
        basic_information: basicInformationFactory.build({
          genres: ["Electronic"],
          styles: ["Techno"],
          artists: [{ name: "Artist One" }],
          labels: [{ name: "Label One" }],
        }),
      }),
    ];

    const core = buildCollectionAnalyticsCore(releases);

    expect(core.stats.totalReleases).toBe(1);
    expect(core.growth.length).toBeGreaterThan(0);
    expect(core).toEqual(
      expect.objectContaining({
        stats: expect.any(Object),
        growth: expect.any(Array),
        acquisitionStreaks: expect.anything(),
      }),
    );
    expect(core).not.toHaveProperty("health");
  });
});

describe("emptyCollectionAnalyticsHeavySections", () => {
  it("returns zeroed health and empty chart inputs", () => {
    expect(emptyCollectionAnalyticsHeavySections()).toEqual({
      health: {
        duplicateCount: 0,
        potentialDuplicates: 0,
        releasesWithoutRating: 0,
        duplicateGroups: [],
      },
      styleDistribution: [],
      genreDistribution: [],
      decadeDistribution: [],
      mediaTypeDistribution: [],
      formatTagDistribution: [],
      formatMix: null,
      artistDistribution: [],
      labelDistribution: [],
      milestones: [],
      styleEvolution: [],
    });
  });
});

describe("buildCollectionAnalytics", () => {
  it("merges core metrics with heavy distribution and health sections", () => {
    const releases = [
      releaseFactory.withNamedFormats(["Vinyl"]),
      releaseFactory.withNamedFormats(["CD"]),
    ];

    const analytics = buildCollectionAnalytics(releases);

    expect(analytics.stats.totalReleases).toBe(2);
    expect(analytics.mediaTypeDistribution.length).toBeGreaterThan(0);
    expect(analytics.health.duplicateGroups).toEqual(expect.any(Array));
  });
});
