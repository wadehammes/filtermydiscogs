import { describe, expect, it } from "@jest/globals";
import { appliedFilterCountInputFrom } from "src/tests/factories/UserPreferences.factory";
import { getAppliedFilterCount } from "./getAppliedFilterCount";

describe("getAppliedFilterCount", () => {
  it("returns 0 when no filters are active", () => {
    expect(getAppliedFilterCount(appliedFilterCountInputFrom())).toBe(0);
  });

  it("counts each active filter dimension once", () => {
    expect(
      getAppliedFilterCount(
        appliedFilterCountInputFrom({
          searchQuery: "  ambient  ",
          selectedStyles: ["Rock", "Jazz"],
          selectedYears: [1999, 2001],
          selectedFormats: ["Vinyl"],
        }),
      ),
    ).toBe(4);
  });

  it("ignores whitespace-only search queries", () => {
    expect(
      getAppliedFilterCount(
        appliedFilterCountInputFrom({
          searchQuery: "   ",
          selectedStyles: ["Rock"],
        }),
      ),
    ).toBe(1);
  });

  it("counts excluded styles as an active genre and style filter", () => {
    expect(
      getAppliedFilterCount(
        appliedFilterCountInputFrom({
          excludedStyles: ["House"],
        }),
      ),
    ).toBe(1);
  });

  it("counts excluded years as an active year filter", () => {
    expect(
      getAppliedFilterCount(
        appliedFilterCountInputFrom({
          excludedYears: [1999],
        }),
      ),
    ).toBe(1);
  });

  it("counts excluded formats as an active format filter", () => {
    expect(
      getAppliedFilterCount(
        appliedFilterCountInputFrom({
          excludedFormats: ["CD"],
        }),
      ),
    ).toBe(1);
  });
});
