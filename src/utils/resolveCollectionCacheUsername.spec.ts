import { describe, expect, it } from "@jest/globals";
import { resolveCollectionCacheUsername } from "src/utils/resolveCollectionCacheUsername";

describe("resolveCollectionCacheUsername", () => {
  it("prefers the authenticated username", () => {
    expect(
      resolveCollectionCacheUsername({
        isAuthenticated: true,
        username: "active-user",
        reconnectUsername: "saved-user",
        rateLimited: false,
      }),
    ).toBe("active-user");
  });

  it("falls back to reconnect username after soft logout", () => {
    expect(
      resolveCollectionCacheUsername({
        isAuthenticated: false,
        username: null,
        reconnectUsername: "saved-user",
        rateLimited: false,
      }),
    ).toBe("saved-user");
  });

  it("returns null when rate limited", () => {
    expect(
      resolveCollectionCacheUsername({
        isAuthenticated: true,
        username: "active-user",
        reconnectUsername: "saved-user",
        rateLimited: true,
      }),
    ).toBeNull();
  });
});
