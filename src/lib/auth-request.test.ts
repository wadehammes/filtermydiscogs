import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { discogsOAuthService } from "src/services/discogs-oauth.service";
import {
  getDisplayIdentityFromCookies,
  getVerifiedUserFromRequest,
} from "./auth-request";
import { clearCachedIdentity, getIdentityCacheKey } from "./identity-cache";

function createRequest(cookies: Record<string, string>): NextRequest {
  return new NextRequest("http://localhost/api/crates", {
    headers: {
      cookie: Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join("; "),
    },
  });
}

describe("auth-request", () => {
  const accessToken = "access-token";
  const accessTokenSecret = "access-secret";
  const cacheKey = getIdentityCacheKey(accessToken, accessTokenSecret);

  beforeEach(() => {
    jest.restoreAllMocks();
    clearCachedIdentity(cacheKey);
    jest.spyOn(NextResponse, "json").mockImplementation(
      (_body, init) =>
        ({
          status: init?.status ?? 200,
        }) as NextResponse,
    );
  });

  describe("getDisplayIdentityFromCookies", () => {
    it("returns identity when both session cookies are present", () => {
      const request = createRequest({
        discogs_user_id: "42",
        discogs_username: "crate-digger",
      });

      expect(getDisplayIdentityFromCookies(request)).toEqual({
        userId: 42,
        username: "crate-digger",
      });
    });

    it("returns null when cookies are missing", () => {
      const request = createRequest({});

      expect(getDisplayIdentityFromCookies(request)).toBeNull();
    });
  });

  describe("getVerifiedUserFromRequest", () => {
    it("returns verified identity from Discogs", async () => {
      jest.spyOn(discogsOAuthService, "getIdentity").mockResolvedValue({
        id: 99,
        username: "verified-user",
        resource_url: "https://api.discogs.com/users/verified-user",
        consumer_name: "FilterMyDisco.gs",
      });

      const request = createRequest({
        discogs_access_token: accessToken,
        discogs_access_token_secret: accessTokenSecret,
      });

      const result = await getVerifiedUserFromRequest(request);

      expect(result).toEqual({
        user: { userId: 99, username: "verified-user" },
      });
    });

    it("does not fall back to cookies when Discogs returns 429", async () => {
      jest
        .spyOn(discogsOAuthService, "getIdentity")
        .mockRejectedValue(
          Object.assign(new Error("Too many requests"), { status: 429 }),
        );

      const request = createRequest({
        discogs_access_token: accessToken,
        discogs_access_token_secret: accessTokenSecret,
        discogs_user_id: "42",
        discogs_username: "stale-user",
      });

      const result = await getVerifiedUserFromRequest(request);

      expect("error" in result).toBe(true);
      expect("user" in result).toBe(false);
    });
  });
});
