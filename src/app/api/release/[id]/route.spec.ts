import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { GET } from "src/app/api/release/[id]/route";
import { DISCOGS_SESSION_COOKIE } from "src/lib/auth-request";
import {
  clearCachedIdentity,
  getIdentityCacheKey,
} from "src/lib/identity-cache";
import { discogsOAuthService } from "src/services/discogs-oauth.service";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";

const RELEASE_ID = "249504";
const accessToken = "access-token";
const accessTokenSecret = "access-secret";
const cacheKey = getIdentityCacheKey(accessToken, accessTokenSecret);

const releaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
  id: Number(RELEASE_ID),
});

const createRequest = (
  releaseId: string,
  cookies: Record<string, string> = {},
) =>
  new NextRequest(`http://localhost/api/release/${releaseId}`, {
    headers: {
      cookie: Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join("; "),
    },
  });

const authenticatedCookies = {
  [DISCOGS_SESSION_COOKIE]: "1",
  discogs_access_token: accessToken,
  discogs_access_token_secret: accessTokenSecret,
};

describe("GET /api/release/[id]", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    clearCachedIdentity(cacheKey);
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      const headers = new Headers(init?.headers);

      return {
        status: init?.status ?? 200,
        headers,
        json: async () => body,
      } as NextResponse;
    });
  });

  it("returns 400 when release ID is missing", async () => {
    const response = await GET(createRequest(""), {
      params: Promise.resolve({ id: "" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Release ID is required",
    });
  });

  it("returns 400 for invalid release ID format", async () => {
    const response = await GET(createRequest("abc"), {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid release ID format",
    });
  });

  it("returns release detail from Discogs for signed-in users", async () => {
    jest.spyOn(discogsOAuthService, "getIdentity").mockResolvedValue({
      id: 42,
      username: "crate-digger",
      resource_url: "https://api.discogs.com/users/crate-digger",
      consumer_name: "FilterMyDisco.gs",
    });
    jest
      .spyOn(discogsOAuthService, "makeAuthenticatedRequest")
      .mockResolvedValue(releaseDetail);

    const response = await GET(
      createRequest(RELEASE_ID, authenticatedCookies),
      {
        params: Promise.resolve({ id: RELEASE_ID }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(releaseDetail);
    expect(discogsOAuthService.makeAuthenticatedRequest).toHaveBeenCalledWith(
      `https://api.discogs.com/releases/${RELEASE_ID}`,
      "GET",
      accessToken,
      accessTokenSecret,
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "private, max-age=3600, stale-while-revalidate=7200",
    );
  });

  it("returns release detail from Discogs for visitors without OAuth cookies", async () => {
    jest
      .spyOn(discogsOAuthService, "makeConsumerRequest")
      .mockResolvedValue(releaseDetail);

    const response = await GET(createRequest(RELEASE_ID), {
      params: Promise.resolve({ id: RELEASE_ID }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(releaseDetail);
    expect(discogsOAuthService.makeConsumerRequest).toHaveBeenCalledWith(
      `https://api.discogs.com/releases/${RELEASE_ID}`,
      "GET",
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=3600, stale-while-revalidate=7200",
    );
  });

  it("returns 500 when Discogs request fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    jest.spyOn(discogsOAuthService, "getIdentity").mockResolvedValue({
      id: 42,
      username: "crate-digger",
      resource_url: "https://api.discogs.com/users/crate-digger",
      consumer_name: "FilterMyDisco.gs",
    });
    jest
      .spyOn(discogsOAuthService, "makeAuthenticatedRequest")
      .mockRejectedValue(new Error("Discogs unavailable"));

    const response = await GET(
      createRequest(RELEASE_ID, authenticatedCookies),
      {
        params: Promise.resolve({ id: RELEASE_ID }),
      },
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch release",
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
