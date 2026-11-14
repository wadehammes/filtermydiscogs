import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  analyzeGrowthByYear,
  analyzeGrowthFromDates,
} from "src/utils/growthTracker";

describe("growthTracker", () => {
  it("when there are no releases, returns an empty series", () => {
    expect(analyzeGrowthFromDates([])).toEqual([]);
    expect(analyzeGrowthByYear([])).toEqual([]);
  });

  it("groups releases by month with cumulative totals", () => {
    const releases = [
      releaseFactory.withDateAdded("2024-01-10T00:00:00.000Z"),
      releaseFactory.withDateAdded("2024-01-25T00:00:00.000Z"),
      releaseFactory.withDateAdded("2024-02-05T00:00:00.000Z"),
    ];

    expect(analyzeGrowthFromDates(releases)).toEqual([
      { date: "2024-01", count: 2, cumulative: 2 },
      { date: "2024-02", count: 1, cumulative: 3 },
    ]);
  });

  it("skips releases with unparseable dates", () => {
    const releases = [
      releaseFactory.withDateAdded(""),
      releaseFactory.withDateAdded("2024-03-01T12:00:00.000Z"),
    ];

    expect(analyzeGrowthFromDates(releases)).toEqual([
      { date: "2024-03", count: 1, cumulative: 1 },
    ]);
  });

  it("groups releases by year with cumulative totals", () => {
    const releases = [
      releaseFactory.withDateAdded("2023-06-15T12:00:00.000Z"),
      releaseFactory.withDateAdded("2023-12-15T12:00:00.000Z"),
      releaseFactory.withDateAdded("2024-06-15T12:00:00.000Z"),
    ];

    expect(analyzeGrowthByYear(releases)).toEqual([
      { date: "2023", count: 2, cumulative: 2 },
      { date: "2024", count: 1, cumulative: 3 },
    ]);
  });
});