import { describe, expect, it } from "@jest/globals";
import { buildCollectionRecapShareText } from "src/utils/collectionRecapShare";

describe("buildCollectionRecapShareText", () => {
  it("when summary exists, includes owner, window, and genre highlight", () => {
    const text = buildCollectionRecapShareText({
      username: "waxhead",
      totalReleases: 120,
      periodEyebrow: "Rolling 12 months",
      compareLabel: "vs prior year",
      recentPeriodLabel: "This year",
      summary: {
        recentPeriodAdds: 10,
        priorPeriodAdds: 5,
        addsChangePercent: 100,
        topNewArtists: [{ label: "Aphex Twin", count: 3 }],
        genreDrift: [
          {
            label: "Electronic",
            recentCount: 4,
            priorCount: 1,
            recentShare: 40,
            priorShare: 20,
            changePoints: 20,
          },
        ],
      },
    });

    expect(text).toContain("waxhead");
    expect(text).toContain("10 records");
    expect(text).toContain("Electronic");
    expect(text.split("\n").at(-1)).toBeTruthy();
  });
});
