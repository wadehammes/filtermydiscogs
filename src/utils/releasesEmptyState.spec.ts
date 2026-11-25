import { describe, expect, it } from "@jest/globals";
import { resolveReleasesEmptyState } from "src/utils/releasesEmptyState";

describe("resolveReleasesEmptyState", () => {
  it("describes an empty Discogs collection", () => {
    expect(
      resolveReleasesEmptyState({
        allReleaseCount: 0,
        hasActiveFilters: false,
        isRandomMode: false,
      }),
    ).toEqual({
      title: "No releases in your collection",
      description:
        "When you add releases on Discogs, they will appear here after the next sync.",
    });
  });

  it("describes over-filtering when releases exist", () => {
    expect(
      resolveReleasesEmptyState({
        allReleaseCount: 12,
        hasActiveFilters: true,
        isRandomMode: false,
      }),
    ).toEqual({
      title: "No releases found",
      description: "Try adjusting your filters to see more results.",
    });
  });

  it("treats random mode with no match like a filtered empty grid", () => {
    expect(
      resolveReleasesEmptyState({
        allReleaseCount: 8,
        hasActiveFilters: false,
        isRandomMode: true,
      }),
    ).toEqual({
      title: "No releases found",
      description: "Try adjusting your filters to see more results.",
    });
  });
});
