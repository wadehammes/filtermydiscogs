import { describe, expect, it } from "@jest/globals";
import { ApiFetchError } from "src/api/apiFetchError";
import { DashboardHero } from "src/components/Dashboard/DashboardHero.component";
import type { CollectionAnalytics } from "src/types/dashboard.types";
import { buildDashboardStory } from "src/utils/dashboardStory";
import { render, screen } from "test-utils";

jest.mock("src/hooks/useFilterAtoms.hook", () => ({
  useAllReleases: () => [],
}));

const minimalAnalytics = (): CollectionAnalytics => ({
  stats: {
    totalReleases: 3,
    uniqueArtists: 2,
    uniqueLabels: 1,
    averageRating: 4,
    totalStyles: 2,
    totalGenres: 1,
  },
  growth: [],
  health: {
    duplicateCount: 0,
    potentialDuplicates: 0,
    releasesWithoutRating: 0,
    duplicateGroups: [],
  },
  acquisitionStreaks: {
    longestGapDays: 0,
    longestGapStart: "",
    longestGapEnd: "",
    busiestDay: { label: "", count: 0 },
    busiestMonth: { label: "", count: 0 },
    busiestQuarter: { label: "", count: 0 },
    leastBusyQuarter: { label: "", count: 0 },
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

describe("DashboardHero", () => {
  it("when collection value fails, shows segment error copy", () => {
    const story = buildDashboardStory({
      analytics: minimalAnalytics(),
      releases: [],
      username: "testuser",
    });

    render(
      <DashboardHero
        story={story}
        stats={minimalAnalytics().stats}
        collectionValue={undefined}
        isLoadingValue={false}
        valueError={new ApiFetchError(503)}
      />,
    );

    expect(screen.getByText("Estimated value unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(/couldn't load your collection/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Discogs status" })).toBeVisible();
  });
});
