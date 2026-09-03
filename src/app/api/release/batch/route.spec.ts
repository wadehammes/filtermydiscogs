import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { POST } from "src/app/api/release/batch/route";
import { DISCOGS_SESSION_COOKIE } from "src/lib/auth-request";
import { discogsOAuthService } from "src/services/discogs-oauth.service";
import { discogsIdentityFactory } from "src/tests/factories/DiscogsIdentity.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";

const RELEASE_ID = "249504";
const OTHER_RELEASE_ID = "123456";
const accessToken = "access-token";
const accessTokenSecret = "access-secret";

const releaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
  id: Number(RELEASE_ID),
});
const otherReleaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
  id: Number(OTHER_RELEASE_ID),
});

const createPostRequest = (
  body: unknown,
  cookies: Record<string, string> = {},
) =>
  new NextRequest("http://localhost/api/release/batch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join("; "),
    },
    body: JSON.stringify(body),
  });

const authenticatedCookies = {
  [DISCOGS_SESSION_COOKIE]: "1",
  discogs_access_token: accessToken,
  discogs_access_token_secret: accessTokenSecret,
};

describe("POST /api/release/batch", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      const headers = new Headers(init?.headers);

      return {
        status: init?.status ?? 200,
        headers,
        json: async () => body,
      } as NextResponse;
    });
  });

  it("returns 400 when ids are missing", async () => {
    const response = await POST(createPostRequest({ ids: [] }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "At least one release id is required",
    });
  });

  it("returns release details keyed by id for signed-in users", async () => {
    jest
      .spyOn(discogsOAuthService, "getIdentity")
      .mockResolvedValue(
        discogsIdentityFactory.forUser({ id: 42, username: "crate-digger" }),
      );
    jest
      .spyOn(discogsOAuthService, "makeAuthenticatedRequest")
      .mockImplementation(async (url) => {
        if (url.endsWith(`/${RELEASE_ID}`)) {
          return releaseDetail;
        }

        if (url.endsWith(`/${OTHER_RELEASE_ID}`)) {
          return otherReleaseDetail;
        }

        throw new Error("Unexpected release id");
      });

    const response = await POST(
      createPostRequest(
        { ids: [RELEASE_ID, OTHER_RELEASE_ID, RELEASE_ID] },
        authenticatedCookies,
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      releases: {
        [RELEASE_ID]: releaseDetail,
        [OTHER_RELEASE_ID]: otherReleaseDetail,
      },
    });
    expect(discogsOAuthService.makeAuthenticatedRequest).toHaveBeenCalledTimes(
      2,
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "private, max-age=3600, stale-while-revalidate=7200",
    );
  });

  it("omits releases that fail to fetch from Discogs", async () => {
    jest
      .spyOn(discogsOAuthService, "makeConsumerRequest")
      .mockImplementation(async (url) => {
        if (url.endsWith(`/${RELEASE_ID}`)) {
          return releaseDetail;
        }

        throw new Error("Discogs unavailable");
      });

    const response = await POST(
      createPostRequest({ ids: [RELEASE_ID, OTHER_RELEASE_ID] }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      releases: {
        [RELEASE_ID]: releaseDetail,
      },
    });
    expect(discogsOAuthService.makeConsumerRequest).toHaveBeenCalledTimes(2);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=3600, stale-while-revalidate=7200",
    );
  });
});
