import { describe, expect, it } from "@jest/globals";
import { getDiscogsReleaseVideosUpdateUrl } from "src/utils/discogsReleaseUrls";

describe("discogsReleaseUrls", () => {
  it("getDiscogsReleaseVideosUpdateUrl points at the Discogs release video upload page", () => {
    expect(getDiscogsReleaseVideosUpdateUrl(249504)).toBe(
      "https://www.discogs.com/release/249504/videos/update",
    );
  });
});
