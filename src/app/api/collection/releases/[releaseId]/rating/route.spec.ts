import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";

jest.mock("src/lib/auth-request", () => ({
  requireAuthenticatedDiscogsUser: jest.fn(),
}));

jest.mock("src/services/discogs-oauth.service", () => ({
  discogsOAuthService: {
    updateReleaseRating: jest.fn(),
    deleteReleaseRating: jest.fn(),
  },
}));

type RouteModule =
  typeof import("src/app/api/collection/releases/[releaseId]/rating/route");
type AuthRequestModule = typeof import("src/lib/auth-request");
type DiscogsOAuthModule = typeof import("src/services/discogs-oauth.service");

let PUT: RouteModule["PUT"];
let DELETE: RouteModule["DELETE"];
let mockRequireAuthenticatedDiscogsUser: jest.MockedFunction<
  AuthRequestModule["requireAuthenticatedDiscogsUser"]
>;
let mockUpdateReleaseRating: jest.MockedFunction<
  DiscogsOAuthModule["discogsOAuthService"]["updateReleaseRating"]
>;
let mockDeleteReleaseRating: jest.MockedFunction<
  DiscogsOAuthModule["discogsOAuthService"]["deleteReleaseRating"]
>;

const USERNAME = "crate-digger";
const RELEASE_ID = "249504";

const authenticatedSession = {
  user: { userId: 42, username: USERNAME },
  accessToken: "access-token",
  accessTokenSecret: "access-token-secret",
};

beforeAll(async () => {
  const [routeModule, authRequest, discogsOAuth] = await Promise.all([
    import("src/app/api/collection/releases/[releaseId]/rating/route"),
    import("src/lib/auth-request"),
    import("src/services/discogs-oauth.service"),
  ]);

  PUT = routeModule.PUT;
  DELETE = routeModule.DELETE;
  mockRequireAuthenticatedDiscogsUser = jest.mocked(
    authRequest.requireAuthenticatedDiscogsUser,
  );
  mockUpdateReleaseRating = jest.mocked(
    discogsOAuth.discogsOAuthService.updateReleaseRating,
  );
  mockDeleteReleaseRating = jest.mocked(
    discogsOAuth.discogsOAuthService.deleteReleaseRating,
  );
});

describe("/api/collection/releases/[releaseId]/rating", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
  });

  it("updates a release rating for an authenticated user", async () => {
    mockRequireAuthenticatedDiscogsUser.mockResolvedValue(authenticatedSession);
    mockUpdateReleaseRating.mockResolvedValue({
      username: USERNAME,
      release_id: Number(RELEASE_ID),
      rating: 4,
    });

    const request = new NextRequest(
      `http://localhost/api/collection/releases/${RELEASE_ID}/rating`,
      {
        method: "PUT",
        body: JSON.stringify({ username: USERNAME, rating: 4 }),
      },
    );

    const response = await PUT(request, {
      params: Promise.resolve({ releaseId: RELEASE_ID }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      username: USERNAME,
      release_id: Number(RELEASE_ID),
      rating: 4,
    });
    expect(mockUpdateReleaseRating).toHaveBeenCalledWith({
      releaseId: Number(RELEASE_ID),
      username: USERNAME,
      rating: 4,
      oauthToken: authenticatedSession.accessToken,
      oauthTokenSecret: authenticatedSession.accessTokenSecret,
    });
  });

  it("rejects invalid ratings", async () => {
    const request = new NextRequest(
      `http://localhost/api/collection/releases/${RELEASE_ID}/rating`,
      {
        method: "PUT",
        body: JSON.stringify({ username: USERNAME, rating: 6 }),
      },
    );

    const response = await PUT(request, {
      params: Promise.resolve({ releaseId: RELEASE_ID }),
    });

    expect(response.status).toBe(400);
    expect(mockRequireAuthenticatedDiscogsUser).not.toHaveBeenCalled();
  });

  it("returns 403 when the requested username does not match the session", async () => {
    mockRequireAuthenticatedDiscogsUser.mockResolvedValue({
      error: NextResponse.json({ error: "Unauthorized" }, { status: 403 }),
    });

    const request = new NextRequest(
      `http://localhost/api/collection/releases/${RELEASE_ID}/rating`,
      {
        method: "PUT",
        body: JSON.stringify({ username: "someone-else", rating: 4 }),
      },
    );

    const response = await PUT(request, {
      params: Promise.resolve({ releaseId: RELEASE_ID }),
    });

    expect(response.status).toBe(403);
    expect(mockUpdateReleaseRating).not.toHaveBeenCalled();
  });

  it("clears a release rating for an authenticated user", async () => {
    mockRequireAuthenticatedDiscogsUser.mockResolvedValue(authenticatedSession);
    mockDeleteReleaseRating.mockResolvedValue(undefined);

    const request = new NextRequest(
      `http://localhost/api/collection/releases/${RELEASE_ID}/rating?username=${USERNAME}`,
      { method: "DELETE" },
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ releaseId: RELEASE_ID }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockDeleteReleaseRating).toHaveBeenCalledWith({
      releaseId: Number(RELEASE_ID),
      username: USERNAME,
      oauthToken: authenticatedSession.accessToken,
      oauthTokenSecret: authenticatedSession.accessTokenSecret,
    });
  });
});
