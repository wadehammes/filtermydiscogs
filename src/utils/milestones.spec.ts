import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease } from "src/types";
import {
  type CollectionMilestone,
  calculateMilestones,
  getMilestoneSortTimestamp,
  sortMilestonesChronologically,
} from "src/utils/milestones";

const buildReleasesByAcquisitionOrder = (count: number): DiscogsRelease[] =>
  releaseFactory
    .buildList(count, {}, { artistCount: 1 })
    .map((release, index) => ({
      ...release,
      instance_id: `release-${String(index).padStart(4, "0")}`,
      date_added: new Date(Date.UTC(2015, 0, 1 + index)).toISOString(),
    }));

const milestoneReleaseId = (
  milestones: CollectionMilestone[],
  label: string,
): string | undefined =>
  milestones.find((milestone) => milestone.label === label)?.release
    ?.instance_id;

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

  it("keeps nth-release milestones stable when instance_id is numeric at runtime", () => {
    const sameDay = "2019-06-15T12:00:00.000Z";
    const releases = releaseFactory.buildList(15, {}, { artistCount: 1 }).map(
      (release, index) =>
        ({
          ...release,
          date_added: sameDay,
          instance_id: 1000 + index,
        }) as unknown as DiscogsRelease,
    );

    const milestones = calculateMilestones([...releases].reverse());

    expect(String(milestoneReleaseId(milestones, "10th Release"))).toBe("1009");
  });

  it("keeps nth-release milestones stable regardless of release array order", () => {
    const sameDay = "2019-06-15T12:00:00.000Z";
    const releases = releaseFactory
      .buildList(50, {}, { artistCount: 1 })
      .map((release, index) => ({
        ...release,
        date_added: sameDay,
        instance_id: `instance-${String(index).padStart(3, "0")}`,
      }));

    const forward = calculateMilestones(releases);
    const backward = calculateMilestones([...releases].reverse());

    expect(milestoneReleaseId(forward, "10th Release")).toBe("instance-009");
    expect(milestoneReleaseId(backward, "10th Release")).toBe("instance-009");
    expect(milestoneReleaseId(forward, "25th Release")).toBe("instance-024");
    expect(milestoneReleaseId(backward, "25th Release")).toBe("instance-024");
  });

  it("keeps acquisition-order milestones when appending newer releases", () => {
    const baseCount = 120;
    const baseReleases = buildReleasesByAcquisitionOrder(baseCount);
    const before = calculateMilestones(baseReleases);

    const appended = [
      ...baseReleases,
      ...buildReleasesByAcquisitionOrder(30).map((release, index) => ({
        ...release,
        instance_id: `appended-${String(index).padStart(4, "0")}`,
        date_added: new Date(Date.UTC(2024, 5, 1 + index)).toISOString(),
      })),
    ];
    const after = calculateMilestones(appended);

    const ordinalLabels = [
      "First release added",
      "10th Release",
      "25th Release",
      "50th Release",
      "100th Release",
    ] as const;

    for (const label of ordinalLabels) {
      const expectedId =
        label === "First release added"
          ? "release-0000"
          : milestoneReleaseId(before, label);
      expect(milestoneReleaseId(after, label)).toBe(expectedId);
    }
  });
});
