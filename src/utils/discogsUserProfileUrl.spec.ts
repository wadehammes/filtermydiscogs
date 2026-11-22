import { describe, expect, it } from "@jest/globals";
import { buildDiscogsUserProfileUrl } from "src/utils/discogsUserProfileUrl";

describe("buildDiscogsUserProfileUrl", () => {
  it("builds a encoded Discogs profile URL", () => {
    expect(buildDiscogsUserProfileUrl("crate digger")).toBe(
      "https://www.discogs.com/user/crate%20digger",
    );
  });
});
