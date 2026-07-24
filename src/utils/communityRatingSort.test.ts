import { describe, expect, it } from "@jest/globals";
import { SortValues } from "src/context/filters.context";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  getCommunityRatingSortValue,
  isCommunityRatingSort,
  parseCommunityRatingAverage,
} from "src/utils/communityRatingSort";

describe("isCommunityRatingSort", () => {
  it("returns true for community rating sort values", () => {
    expect(isCommunityRatingSort(SortValues.CommunityRatingHigh)).toBe(true);
    expect(isCommunityRatingSort(SortValues.CommunityRatingLow)).toBe(true);
  });

  it("returns false for personal rating sort values", () => {
    expect(isCommunityRatingSort(SortValues.RatingHigh)).toBe(false);
  });
});

describe("parseCommunityRatingAverage", () => {
  it("returns the average when count is present", () => {
    expect(
      parseCommunityRatingAverage({
        rating: {
          average: 4.19,
          count: 47,
        },
      }),
    ).toBe(4.19);
  });

  it("returns null when there are no ratings", () => {
    expect(
      parseCommunityRatingAverage({
        rating: {
          average: 0,
          count: 0,
        },
      }),
    ).toBeNull();
  });
});

describe("getCommunityRatingSortValue", () => {
  it("uses cached averages when present", () => {
    const release = releaseFactory.build({
      basic_information: {
        ...releaseFactory.build().basic_information,
        id: 123,
      },
    });

    expect(
      getCommunityRatingSortValue({
        release,
        communityRatingsByReleaseId: {
          "123": 4.5,
        },
        sort: SortValues.CommunityRatingHigh,
      }),
    ).toBe(4.5);
  });

  it("sorts unknown releases last for high-to-low community sorting", () => {
    const release = releaseFactory.build({
      basic_information: {
        ...releaseFactory.build().basic_information,
        id: 123,
      },
    });

    expect(
      getCommunityRatingSortValue({
        release,
        communityRatingsByReleaseId: {},
        sort: SortValues.CommunityRatingHigh,
      }),
    ).toBe(Number.NEGATIVE_INFINITY);
  });
});
