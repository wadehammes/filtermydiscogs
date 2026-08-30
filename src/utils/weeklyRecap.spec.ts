import { describe, expect, it } from "@jest/globals";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  buildWeeklyRecapLede,
  calculateWeeklyRecapSummary,
  formatWeeklyRecapChangePercent,
  getWeeklyRecapHighlight,
  getWeeklyRecapReleases,
} from "src/utils/weeklyRecap";

const referenceDate = new Date("2025-08-07T12:00:00.000Z");

describe("weeklyRecap", () => {
  it("lists releases added in the rolling last 7 days", () => {
    const releases = [
      releaseFactory.build({ date_added: "2025-08-01T12:00:00.000Z" }),
      releaseFactory.build({ date_added: "2025-08-05T12:00:00.000Z" }),
      releaseFactory.build({ date_added: "2025-07-25T12:00:00.000Z" }),
    ];

    const recent = getWeeklyRecapReleases(releases, referenceDate);

    expect(recent).toHaveLength(2);
    expect(recent[0]?.date_added).toBe("2025-08-05T12:00:00.000Z");
  });

  it("builds lede copy from weekly summary stats", () => {
    const summary = calculateWeeklyRecapSummary(
      [
        releaseFactory.build({ date_added: "2025-08-01T12:00:00.000Z" }),
        releaseFactory.build({ date_added: "2025-08-05T12:00:00.000Z" }),
        releaseFactory.build({ date_added: "2025-07-25T12:00:00.000Z" }),
      ],
      referenceDate,
    );

    expect(buildWeeklyRecapLede(summary)).toBe(
      "2 records added in the last 7 days. Up 100% vs the prior week.",
    );
  });

  it("formats change percent for display", () => {
    expect(formatWeeklyRecapChangePercent(100)).toBe("+100%");
    expect(formatWeeklyRecapChangePercent(-9.4)).toBe("-9.4%");
    expect(formatWeeklyRecapChangePercent(0)).toBeNull();
  });

  it("surfaces a genre highlight when recent adds exist", () => {
    const summary = calculateWeeklyRecapSummary(
      [
        releaseFactory.build({
          date_added: "2025-08-01T12:00:00.000Z",
          basic_information: basicInformationFactory.build({
            genres: ["Electronic"],
          }),
        }),
      ],
      referenceDate,
    );

    expect(summary).not.toBeNull();
    if (!summary) {
      return;
    }

    expect(getWeeklyRecapHighlight(summary)).toBe("Electronic led your adds");
  });
});
