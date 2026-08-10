import { describe, expect, it } from "@jest/globals";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  calculateAcquisitionStreaks,
  calculateYearInReview,
} from "src/utils/collectionRhythm";

const referenceDate = new Date("2025-08-07T12:00:00.000Z");

describe("calculateYearInReview", () => {
  it("compares rolling year windows and surfaces new artists and genre drift", () => {
    const releases = [
      releaseFactory.build({
        date_added: "2024-09-01T12:00:00.000Z",
        basic_information: basicInformationFactory.build({
          genres: ["Electronic"],
          artists: [{ name: "New Artist" }],
        }),
      }),
      releaseFactory.build({
        date_added: "2025-01-15T12:00:00.000Z",
        basic_information: basicInformationFactory.build({
          genres: ["Electronic"],
          artists: [{ name: "New Artist" }],
        }),
      }),
      releaseFactory.build({
        date_added: "2025-03-01T12:00:00.000Z",
        basic_information: basicInformationFactory.build({
          genres: ["Rock"],
          artists: [{ name: "Legacy Artist" }],
        }),
      }),
      releaseFactory.build({
        date_added: "2023-05-01T12:00:00.000Z",
        basic_information: basicInformationFactory.build({
          genres: ["Electronic"],
          artists: [{ name: "Legacy Artist" }],
        }),
      }),
      releaseFactory.build({
        date_added: "2023-10-01T12:00:00.000Z",
        basic_information: basicInformationFactory.build({
          genres: ["Rock"],
          artists: [{ name: "Legacy Artist" }],
        }),
      }),
    ];

    const result = calculateYearInReview(releases, referenceDate, "year");

    expect(result).toMatchObject({
      recentPeriodAdds: 3,
      priorPeriodAdds: 1,
      addsChangePercent: 200,
      topNewArtists: [{ label: "New Artist", count: 2 }],
    });
    expect(result?.genreDrift).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Electronic",
        }),
        expect.objectContaining({
          label: "Rock",
        }),
      ]),
    );
  });

  it("returns null for an empty collection", () => {
    expect(calculateYearInReview([], referenceDate)).toBeNull();
  });

  it("compares rolling week windows", () => {
    const releases = [
      releaseFactory.build({
        date_added: "2025-08-01T12:00:00.000Z",
      }),
      releaseFactory.build({
        date_added: "2025-08-05T12:00:00.000Z",
      }),
      releaseFactory.build({
        date_added: "2025-07-25T12:00:00.000Z",
      }),
    ];

    const result = calculateYearInReview(releases, referenceDate, "week");

    expect(result).toMatchObject({
      recentPeriodAdds: 2,
      priorPeriodAdds: 1,
      addsChangePercent: 100,
    });
  });
});

describe("calculateAcquisitionStreaks", () => {
  it("finds the longest gap between add days and the busiest quarter", () => {
    const releases = [
      releaseFactory.build({ date_added: "2024-01-10T12:00:00.000Z" }),
      releaseFactory.build({ date_added: "2024-01-10T18:00:00.000Z" }),
      releaseFactory.build({ date_added: "2024-04-20T12:00:00.000Z" }),
      releaseFactory.build({ date_added: "2024-04-21T12:00:00.000Z" }),
      releaseFactory.build({ date_added: "2024-04-22T12:00:00.000Z" }),
      releaseFactory.build({ date_added: "2024-05-01T12:00:00.000Z" }),
    ];

    const result = calculateAcquisitionStreaks(releases);

    expect(result).toMatchObject({
      longestGapDays: 100,
      longestGapStart: "Jan 2024",
      longestGapEnd: "Apr 2024",
      busiestDay: { label: "Jan 10, 2024", count: 2 },
      busiestMonth: { label: "Apr 2024", count: 3 },
      busiestQuarter: { label: "Q2 2024", count: 4 },
      leastBusyQuarter: { label: "Q1 2024", count: 2 },
    });
  });

  it("returns null for an empty collection", () => {
    expect(calculateAcquisitionStreaks([])).toBeNull();
  });
});
