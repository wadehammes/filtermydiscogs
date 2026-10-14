import { buildVercelFlagEntitiesFromDiscogsCookies } from "src/lib/vercelFlagIdentify.server";

describe("vercelFlagIdentify.server", () => {
  it("returns empty entities when cookies are missing", () => {
    expect(
      buildVercelFlagEntitiesFromDiscogsCookies(undefined, undefined),
    ).toEqual({});
    expect(buildVercelFlagEntitiesFromDiscogsCookies("42", undefined)).toEqual(
      {},
    );
    expect(
      buildVercelFlagEntitiesFromDiscogsCookies(undefined, "crate-digger"),
    ).toEqual({});
  });

  it("returns Discogs user id, discogsUserId, and lowercased username for targeting", () => {
    expect(
      buildVercelFlagEntitiesFromDiscogsCookies("9001", "Crate-Digger"),
    ).toEqual({
      user: {
        id: "9001",
        discogsUserId: "9001",
        username: "crate-digger",
      },
    });
  });
});
