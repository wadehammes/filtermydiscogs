import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { CollectionAnalytics } from "src/types/dashboard.types";
import { buildDashboardStory } from "src/utils/dashboardStory";

const baseAnalytics = (): CollectionAnalytics => ({
  stats: {
    totalReleases: 120,
    uniqueArtists: 80,
    uniqueLabels: 40,
    averageRating: 4.2,
    totalStyles: 12,
    totalGenres: 8,
  },
  growth: [
    { date: "2024-01", count: 5, cumulative: 5 },
    { date: "2024-03", count: 12, cumulative: 17 },
  ],
  health: {
    duplicateCount: 0,
    potentialDuplicates: 0,
    releasesWithoutRating: 0,
    duplicateGroups: [],
  },
  yearInReview: {
    recentPeriodAdds: 12,
    priorPeriodAdds: 10,
    addsChangePercent: 20,
    topNewArtists: [{ label: "Aphex Twin", count: 3 }],
    genreDrift: [
      {
        label: "Electronic",
        recentCount: 8,
        priorCount: 6,
        recentShare: 66.7,
        priorShare: 60,
        changePoints: 6.7,
      },
    ],
  },
  acquisitionStreaks: {
    longestGapDays: 90,
    longestGapStart: "Jan 2023",
    longestGapEnd: "Apr 2023",
    busiestDay: { label: "Aug 1, 2024", count: 5 },
    busiestMonth: { label: "Aug 2024", count: 12 },
    busiestQuarter: { label: "Q2 2024", count: 8 },
    leastBusyQuarter: { label: "Q1 2024", count: 2 },
  },
  styleDistribution: [
    { label: "House", value: 30, count: 30 },
    { label: "Techno", value: 20, count: 20 },
  ],
  genreDistribution: [{ label: "Electronic", value: 50, count: 50 }],
  decadeDistribution: [{ label: "1990s", value: 40, count: 40 }],
  mediaTypeDistribution: [{ label: "Vinyl", value: 90, count: 90 }],
  formatTagDistribution: [{ label: "LP", value: 70, count: 70 }],
  formatMix: {
    topMediaType: "Vinyl",
    topMediaTypePercent: 75,
    topTags: [{ label: "LP", count: 70 }],
  },
  artistDistribution: [{ label: "Aphex Twin", value: 8, count: 8 }],
  labelDistribution: [{ label: "Warp", value: 6, count: 6 }],
  milestones: [],
  styleEvolution: [],
});

describe("buildDashboardStory", () => {
  it("builds a personalized hero and section ledes from analytics", () => {
    const releases = [
      releaseFactory.build({
        date_added: "2018-08-07T12:00:00",
      }),
      releaseFactory.build({
        date_added: "2020-08-07T12:00:00",
      }),
      releaseFactory.build({
        date_added: new Date().toISOString(),
      }),
    ];

    const story = buildDashboardStory({
      analytics: baseAnalytics(),
      releases,
      username: "waxhead",
    });

    expect(story.heroEyebrow).toBe("Your shelf");
    expect(story.heroTitle).toBe("waxhead's collection");
    expect(story.heroCount).toBe("120");
    expect(story.heroTagline).toContain("Mostly vinyl");
    expect(story.heroTagline).toContain("House & Techno");
    expect(story.heroTagline).toContain("years collecting");
    expect(story.sections.today.lede).toContain("August 7");
    expect(story.sections.today.title).toBe("On this day");
    expect(story.sections.names.lede).toContain("Aphex Twin");
    expect(story.sections.names.title).toBe("Who repeats");
    expect(story.sections.sound.title).toBe("What you collect");
    expect(story.sections.styleEvolution.title).toBe("Taste over time");
  });

  it("uses a fallback message for empty collections", () => {
    const analytics = baseAnalytics();
    analytics.stats.totalReleases = 0;

    const story = buildDashboardStory({
      analytics,
      releases: [],
      username: null,
    });

    expect(story.heroTitle).toBe("Your collection");
    expect(story.heroTagline).toBeNull();
    expect(story.heroFallback).toContain("Add records");
  });
});
