import { describe, expect, it } from "@jest/globals";
import { getAppliedFilterCount } from "./getAppliedFilterCount";

describe("getAppliedFilterCount", () => {
  it("returns 0 when no filters are active", () => {
    expect(
      getAppliedFilterCount({
        searchQuery: "",
        selectedStyles: [],
        selectedYears: [],
        selectedFormats: [],
      }),
    ).toBe(0);
  });

  it("counts each active filter dimension once", () => {
    expect(
      getAppliedFilterCount({
        searchQuery: "  ambient  ",
        selectedStyles: ["Rock", "Jazz"],
        selectedYears: [1999, 2001],
        selectedFormats: ["Vinyl"],
      }),
    ).toBe(4);
  });

  it("ignores whitespace-only search queries", () => {
    expect(
      getAppliedFilterCount({
        searchQuery: "   ",
        selectedStyles: ["Rock"],
        selectedYears: [],
        selectedFormats: [],
      }),
    ).toBe(1);
  });
});
