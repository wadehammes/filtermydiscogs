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
    getCollectionValue: jest.fn(),
  },
}));

type RouteModule = typeof import("src/app/api/collection/value/route");
type AuthRequestModule = typeof import("src/lib/auth-request");
type DiscogsOAuthModule = typeof import("src/services/discogs-oauth.service");

let GET: RouteModule["GET"];
let mockRequireAuthenticatedDiscogsUser: jest.MockedFunction<
  AuthRequestModule["requireAuthenticatedDiscogsUser"]
>;
let mockGetCollectionValue: jest.MockedFunction<
  DiscogsOAuthModule["discogsOAuthService"]["getCollectionValue"]
>;

const USERNAME = "crate-digger";

const createRequest = (username?: string) => {
  const params = username ? `?username=${username}` : "";

  return new NextRequest(`http://localhost/api/collection/value${params}`);
};

const authenticatedSession = {
  user: { userId: 42, username: USERNAME },
  accessToken: "access-token",
  accessTokenSecret: "access-token-secret",
};

beforeAll(async () => {
  const [routeModule, authRequest, discogsOAuth] = await Promise.all([
    import("src/app/api/collection/value/route"),
    import("src/lib/auth-request"),
    import("src/services/discogs-oauth.service"),
  ]);

  GET = routeModule.GET;
  mockRequireAuthenticatedDiscogsUser = jest.mocked(
    authRequest.requireAuthenticatedDiscogsUser,
  );
  mockGetCollectionValue = jest.mocked(
    discogsOAuth.discogsOAuthService.getCollectionValue,
  );
});

describe("GET /api/collection/value", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
  });

  it("returns collection value for an authenticated user", async () => {
    mockRequireAuthenticatedDiscogsUser.mockResolvedValue(authenticatedSession);
    mockGetCollectionValue.mockResolvedValue({
      minimum: 100,
      median: 500,
      maximum: 1000,
    });

    const response = await GET(createRequest(USERNAME));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      minimum: 100,
      median: 500,
      maximum: 1000,
    });
    expect(mockGetCollectionValue).toHaveBeenCalledWith(
      USERNAME,
      "access-token",
      "access-token-secret",
    );
  });

  it("returns 400 when username is missing", async () => {
    const response = await GET(createRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Username is required",
    });
  });

  it("returns 400 when username format is invalid", async () => {
    const response = await GET(createRequest("bad username!"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid username format",
    });
  });

  it("returns auth error when session verification fails", async () => {
    mockRequireAuthenticatedDiscogsUser.mockResolvedValue({
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    });

    const response = await GET(createRequest(USERNAME));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Not authenticated",
    });
  });

  it("returns 500 when Discogs returns invalid value data", async () => {
    mockRequireAuthenticatedDiscogsUser.mockResolvedValue(authenticatedSession);
    mockGetCollectionValue.mockResolvedValue({
      minimum: Number.NaN,
      median: 500,
      maximum: 1000,
    });

    const response = await GET(createRequest(USERNAME));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid collection value data received",
    });
  });
});
