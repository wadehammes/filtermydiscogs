import { describe, expect, it } from "@jest/globals";
import {
  formatPublicPlaylistShareStatCount,
  formatPublicPlaylistShareStatsLine,
  listPublicPlaylistShareEngagementItems,
} from "src/utils/playlistShareStats";

describe("formatPublicPlaylistShareStatCount", () => {
  it("formats the count with locale grouping", () => {
    expect(formatPublicPlaylistShareStatCount(1200)).toBe("1,200");
  });
});

describe("listPublicPlaylistShareEngagementItems", () => {
  it("returns view and play items when counts are positive", () => {
    expect(
      listPublicPlaylistShareEngagementItems({
        publicViewCount: 3,
        publicPlayCount: 1,
      }),
    ).toEqual([
      { kind: "view", count: 3, ariaLabel: "3 views" },
      { kind: "play", count: 1, ariaLabel: "1 play" },
    ]);
  });
});

describe("formatPublicPlaylistShareStatsLine", () => {
  it("formats views and plays when counts are positive", () => {
    expect(
      formatPublicPlaylistShareStatsLine({
        publicViewCount: 12,
        publicPlayCount: 1,
      }),
    ).toBe("12 views · 1 play");
  });

  it("returns null when both counts are zero", () => {
    expect(
      formatPublicPlaylistShareStatsLine({
        publicViewCount: 0,
        publicPlayCount: 0,
      }),
    ).toBeNull();
  });
});
