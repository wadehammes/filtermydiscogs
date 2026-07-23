import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { GET } from "src/app/api/release/[id]/rating/route";
import {
  clearCachedIdentity,
  getIdentityCacheKey,
} from "src/lib/identity-cache";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

const RELEASE_ID = "249504";
const accessToken = "access-token";
const accessTokenSecret = "access-secret";
const cacheKey = getIdentityCacheKey(accessToken, accessTokenSecret);

const communityRating = {
  release_id: Number(RELEASE_ID),
  rating: {
    average: 4.19,
    count: 47,
  },
};

const createRequest = (
  releaseId: string,
  cookies: Record<string, string> = {},
) =>
  new NextRequest(`http://localhost/api/release/${releaseId}/rating`, {
    headers: {
      cookie: Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join("; "),
    },
  });

const authenticatedCookies = {
  discogs_access_token: accessToken,
  discogs_access_token_secret: accessTokenSecret,
};

describe("GET /api/release/[id]/rating", () => {
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

  it("returns 401 when OAuth cookies are missing", async () => {
    const response = await GET(createRequest(RELEASE_ID), {
      params: Promise.resolve({ id: RELEASE_ID }),
    });

    expect(response.status).toBe(401);
  });

  it("returns community rating from Discogs", async () => {
    jest.spyOn(discogsOAuthService, "getIdentity").mockResolvedValue({
      id: 42,
      username: "crate-digger",
      resource_url: "https://api.discogs.com/users/crate-digger",
      consumer_name: "FilterMyDisco.gs",
    });
    jest
      .spyOn(discogsOAuthService, "makeAuthenticatedRequest")
      .mockResolvedValue(communityRating);

    const response = await GET(
      createRequest(RELEASE_ID, authenticatedCookies),
      {
        params: Promise.resolve({ id: RELEASE_ID }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(communityRating);
    expect(discogsOAuthService.makeAuthenticatedRequest).toHaveBeenCalledWith(
      `https://api.discogs.com/releases/${RELEASE_ID}/rating`,
      "GET",
      accessToken,
      accessTokenSecret,
    );
  });
});
