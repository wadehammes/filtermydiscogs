import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  calculateMilestones,
  getMilestoneSortTimestamp,
  sortMilestonesChronologically,
} from "src/utils/milestones";

describe("milestones", () => {
  it("sorts milestones chronologically by add date", () => {
    const releases = releaseFactory.buildList(100, {}, { artistCount: 1 });

    releases.forEach((release, index) => {
      const year = 2018 + Math.floor(index / 20);
      const month = String((index % 12) + 1).padStart(2, "0");
      release.date_added = `${year}-${month}-15T12:00:00`;
    });

    const sorted = sortMilestonesChronologically(calculateMilestones(releases));
    const timestamps = sorted.map(getMilestoneSortTimestamp);

    for (let index = 1; index < timestamps.length; index += 1) {
      expect(timestamps[index]).toBeGreaterThanOrEqual(
        timestamps[index - 1] ?? 0,
      );
    }
  });

  it("places oldest release by pressing year, not date added", () => {
    const releases = releaseFactory.buildList(1000, {}, { artistCount: 1 });

    releases.forEach((release, index) => {
      const addYear = 2018 + Math.floor(index / 200);
      const month = String((index % 12) + 1).padStart(2, "0");
      release.date_added = `${addYear}-${month}-15T12:00:00`;
      release.basic_information.year = 1980 + (index % 30);
    });

    releases[999] = releaseFactory.build({
      date_added: "2025-09-01T12:00:00",
      basic_information: {
        ...releaseFactory.build().basic_information,
        year: 1973,
      },
    });

    const sorted = sortMilestonesChronologically(calculateMilestones(releases));
    const oldestIndex = sorted.findIndex(
      (milestone) => milestone.label === "Oldest Release",
    );

    expect(oldestIndex).toBeGreaterThanOrEqual(0);
    expect(oldestIndex).toBeLessThan(
      sorted.findIndex(
        (milestone) => milestone.label === "First release added",
      ),
    );
    expect(
      sorted.findIndex((milestone) => milestone.label === "1000th Release"),
    ).toBeGreaterThan(oldestIndex);
  });
});
