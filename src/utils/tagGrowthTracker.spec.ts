import { describe, expect, it } from "@jest/globals";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  analyzeTagGrowthFromDates,
  collectArtistOptions,
  collectGenreOptions,
  collectMediaTypeOptions,
  collectStyleOptions,
  collectStyleOptionsForGenre,
  mergeDualCumulativeSeries,
  mergeDualMonthlyShareSeries,
  mergeStyleWithinGenreShareSeries,
  releaseHasArtist,
  releaseHasGenre,
  releaseHasGenreAndStyle,
  releaseHasMediaType,
  releaseHasStyle,
} from "src/utils/tagGrowthTracker";

describe("tagGrowthTracker", () => {
  const releases = [
    releaseFactory.build({
      date_added: "2024-01-15T12:00:00",
      basic_information: basicInformationFactory.build({
        styles: ["Techno", "House"],
        genres: ["Electronic"],
        artists: [{ name: "Artist A" }],
        formats: [{ name: "Vinyl", descriptions: ["LP"] }],
      }),
    }),
    releaseFactory.build({
      date_added: "2024-01-20T12:00:00",
      basic_information: basicInformationFactory.build({
        styles: ["Techno"],
        genres: ["Electronic", "Rock"],
        artists: [{ name: "Artist B" }],
        formats: [{ name: "CD", descriptions: ["Album"] }],
      }),
    }),
    releaseFactory.build({
      date_added: "2024-03-10T12:00:00",
      basic_information: basicInformationFactory.build({
        styles: ["House"],
        genres: ["Rock"],
        artists: [{ name: "Artist A" }],
        formats: [{ name: "Vinyl", descriptions: ["LP"] }],
      }),
    }),
  ];

  it("matches styles, genres, artists, and formats", () => {
    expect(releaseHasStyle(releases[0]!, "techno")).toBe(true);
    expect(releaseHasGenre(releases[0]!, "Electronic")).toBe(true);
    expect(releaseHasArtist(releases[0]!, "Artist A")).toBe(true);
    expect(releaseHasMediaType(releases[0]!, "Vinyl")).toBe(true);
    expect(releaseHasGenre(releases[2]!, "Electronic")).toBe(false);
  });

  it("collects tag options sorted by count", () => {
    expect(collectStyleOptions(releases).map((option) => option.value)).toEqual(
      ["house", "techno"],
    );
    expect(collectGenreOptions(releases).map((option) => option.value)).toEqual(
      ["Electronic", "Rock"],
    );
    expect(
      collectArtistOptions(releases).map((option) => option.value),
    ).toEqual(["Artist A", "Artist B"]);
    expect(
      collectMediaTypeOptions(releases).map((option) => option.value),
    ).toEqual(["Vinyl", "CD"]);
  });

  it("builds cumulative growth for a selected tag", () => {
    const growth = analyzeTagGrowthFromDates(releases, (release) =>
      releaseHasStyle(release, "techno"),
    );

    expect(growth).toEqual([{ date: "2024-01", count: 2, cumulative: 2 }]);
  });

  it("merges cumulative series on a shared month timeline", () => {
    const styleGrowth = analyzeTagGrowthFromDates(releases, (release) =>
      releaseHasStyle(release, "house"),
    );
    const genreGrowth = analyzeTagGrowthFromDates(releases, (release) =>
      releaseHasGenre(release, "Rock"),
    );

    expect(mergeDualCumulativeSeries(styleGrowth, genreGrowth)).toEqual([
      { date: "2024-01", primaryValue: 1, secondaryValue: 1 },
      { date: "2024-02", primaryValue: 1, secondaryValue: 1 },
      { date: "2024-03", primaryValue: 2, secondaryValue: 2 },
    ]);
  });

  it("relates styles to a parent genre from co-tagged releases", () => {
    expect(releaseHasGenreAndStyle(releases[0]!, "Electronic", "techno")).toBe(
      true,
    );
    expect(releaseHasGenre(releases[1]!, "Rock")).toBe(true);
    expect(
      collectStyleOptionsForGenre(releases, "Electronic").map(
        (option) => option.value,
      ),
    ).toEqual(["techno", "house"]);
    expect(
      collectStyleOptionsForGenre(releases, "Rock").map(
        (option) => option.value,
      ),
    ).toEqual(["house", "techno"]);
  });

  it("computes style share within a genre", () => {
    expect(
      mergeStyleWithinGenreShareSeries(releases, "Electronic", "techno"),
    ).toEqual([
      { date: "2024-01", primaryValue: 100, secondaryValue: 100 },
      { date: "2024-03", primaryValue: 0, secondaryValue: 0 },
    ]);
  });

  it("computes monthly share of adds for two tags", () => {
    expect(
      mergeDualMonthlyShareSeries(
        releases,
        (release) => releaseHasStyle(release, "techno"),
        (release) => releaseHasGenre(release, "Electronic"),
      ),
    ).toEqual([
      { date: "2024-01", primaryValue: 100, secondaryValue: 100 },
      { date: "2024-03", primaryValue: 0, secondaryValue: 0 },
    ]);
  });
});
