import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { discogsOAuthService } from "src/services/discogs-oauth.service";
import { discogsIdentityFactory } from "src/tests/factories/DiscogsIdentity.factory";
import { verifiedDiscogsUserFactory } from "src/tests/factories/VerifiedDiscogsUser.factory";
import {
  DISCOGS_SESSION_COOKIE,
  getDisplayIdentityFromCookies,
  getStoredReconnectUsername,
  getVerifiedUserFromRequest,
  requireAuthenticatedDiscogsUser,
} from "./auth-request";
import {
  clearCachedIdentity,
  getCachedIdentity,
  getIdentityCacheKey,
  setCachedIdentity,
} from "./identity-cache";

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
    it("returns identity when session and display cookies are present", () => {
      const request = createRequest({
        [DISCOGS_SESSION_COOKIE]: "1",
        discogs_user_id: "42",
        discogs_username: "crate-digger",
      });

      expect(getDisplayIdentityFromCookies(request)).toEqual(
        verifiedDiscogsUserFactory.build({
          userId: 42,
          username: "crate-digger",
        }),
      );
    });

    it("returns null when cookies are missing", () => {
      const request = createRequest({});

      expect(getDisplayIdentityFromCookies(request)).toBeNull();
    });
  });

  describe("getStoredReconnectUsername", () => {
    it("returns username when stored tokens and reconnect cookie exist", () => {
      const request = createRequest({
        discogs_access_token: accessToken,
        discogs_access_token_secret: accessTokenSecret,
        discogs_reconnect_username: "crate-digger",
      });

      expect(getStoredReconnectUsername(request)).toBe("crate-digger");
    });

    it("returns null when reconnect cookie is missing", () => {
      const request = createRequest({
        discogs_access_token: accessToken,
        discogs_access_token_secret: accessTokenSecret,
      });

      expect(getStoredReconnectUsername(request)).toBeNull();
    });
  });

  describe("getVerifiedUserFromRequest", () => {
    it("returns verified identity from Discogs", async () => {
      jest
        .spyOn(discogsOAuthService, "getIdentity")
        .mockResolvedValue(
          discogsIdentityFactory.forUser({ id: 99, username: "verified-user" }),
        );

      const request = createRequest({
        [DISCOGS_SESSION_COOKIE]: "1",
        discogs_access_token: accessToken,
        discogs_access_token_secret: accessTokenSecret,
      });

      const result = await getVerifiedUserFromRequest(request);

      expect(result).toEqual(
        verifiedDiscogsUserFactory.asVerifiedResult({
          userId: 99,
          username: "verified-user",
        }),
      );
    });

    it("returns unauthorized when the app session cookie is missing", async () => {
      const request = createRequest({
        discogs_access_token: accessToken,
        discogs_access_token_secret: accessTokenSecret,
      });

      const result = await getVerifiedUserFromRequest(request);

      expect("error" in result).toBe(true);
      expect("user" in result).toBe(false);
    });

    it("does not fall back to cookies when Discogs returns 429", async () => {
      jest
        .spyOn(discogsOAuthService, "getIdentity")
        .mockRejectedValue(
          Object.assign(new Error("Too many requests"), { status: 429 }),
        );

      const request = createRequest({
        [DISCOGS_SESSION_COOKIE]: "1",
        discogs_access_token: accessToken,
        discogs_access_token_secret: accessTokenSecret,
        discogs_user_id: "42",
        discogs_username: "stale-user",
      });

      const result = await getVerifiedUserFromRequest(request);

      expect("error" in result).toBe(true);
      expect("user" in result).toBe(false);
    });

    it("reuses stale verified identity for read-only routes without calling Discogs", async () => {
      const getIdentity = jest.spyOn(discogsOAuthService, "getIdentity");
      const entry = setCachedIdentity(cacheKey, {
        userId: 42,
        username: "cached-user",
      });
      entry.verifiedAt = Date.now() - 400_000;

      const request = createRequest({
        [DISCOGS_SESSION_COOKIE]: "1",
        discogs_access_token: accessToken,
        discogs_access_token_secret: accessTokenSecret,
      });

      const result = await getVerifiedUserFromRequest(request, {
        allowStale: true,
      });

      expect(result).toEqual(
        verifiedDiscogsUserFactory.asVerifiedResult({
          userId: 42,
          username: "cached-user",
        }),
      );
      expect(getIdentity).not.toHaveBeenCalled();
    });

    it("uses session cookies on read-only routes when identity cache is cold", async () => {
      const getIdentity = jest.spyOn(discogsOAuthService, "getIdentity");

      const request = createRequest({
        [DISCOGS_SESSION_COOKIE]: "1",
        discogs_access_token: accessToken,
        discogs_access_token_secret: accessTokenSecret,
        discogs_user_id: "42",
        discogs_username: "crate-digger",
      });

      const result = await getVerifiedUserFromRequest(request, {
        allowStale: true,
      });

      expect(result).toEqual(
        verifiedDiscogsUserFactory.asVerifiedResult({
          userId: 42,
          username: "crate-digger",
        }),
      );
      expect(getIdentity).not.toHaveBeenCalled();
    });

    it("does not cache cookie fallback identity under the OAuth token key", async () => {
      jest.spyOn(discogsOAuthService, "getIdentity");

      const request = createRequest({
        [DISCOGS_SESSION_COOKIE]: "1",
        discogs_access_token: accessToken,
        discogs_access_token_secret: accessTokenSecret,
        discogs_user_id: "42",
        discogs_username: "crate-digger",
      });

      await getVerifiedUserFromRequest(request, { allowStale: true });

      expect(getCachedIdentity(cacheKey, true)).toBeNull();
    });

    it("still calls Discogs identity for write routes when cache is cold", async () => {
      jest
        .spyOn(discogsOAuthService, "getIdentity")
        .mockResolvedValue(
          discogsIdentityFactory.forUser({ id: 99, username: "verified-user" }),
        );

      const request = createRequest({
        [DISCOGS_SESSION_COOKIE]: "1",
        discogs_access_token: accessToken,
        discogs_access_token_secret: accessTokenSecret,
        discogs_user_id: "42",
        discogs_username: "crate-digger",
      });

      const result = await getVerifiedUserFromRequest(request);

      expect(result).toEqual(
        verifiedDiscogsUserFactory.asVerifiedResult({
          userId: 99,
          username: "verified-user",
        }),
      );
    });
  });

  describe("requireAuthenticatedDiscogsUser", () => {
    it("returns 403 when the requested username does not match verified identity", async () => {
      jest
        .spyOn(discogsOAuthService, "getIdentity")
        .mockResolvedValue(
          discogsIdentityFactory.forUser({ id: 99, username: "alice" }),
        );

      const request = createRequest({
        [DISCOGS_SESSION_COOKIE]: "1",
        discogs_access_token: accessToken,
        discogs_access_token_secret: accessTokenSecret,
      });

      const result = await requireAuthenticatedDiscogsUser(request, "bob");

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error.status).toBe(403);
      }
    });
  });
});
