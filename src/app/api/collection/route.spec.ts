import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { COLLECTION_PAGE_SIZE } from "src/constants/collection";
import { collectionFactory } from "src/tests/factories/Collection.factory";

jest.mock("src/lib/auth-request", () => ({
  requireAuthenticatedDiscogsUser: jest.fn(),
}));

jest.mock("src/services/discogs-oauth.service", () => ({
  discogsOAuthService: {
    getCollection: jest.fn(),
  },
}));

type RouteModule = typeof import("src/app/api/collection/route");
type AuthRequestModule = typeof import("src/lib/auth-request");
type DiscogsOAuthModule = typeof import("src/services/discogs-oauth.service");

let GET: RouteModule["GET"];
let mockRequireAuthenticatedDiscogsUser: jest.MockedFunction<
  AuthRequestModule["requireAuthenticatedDiscogsUser"]
>;
let mockGetCollection: jest.MockedFunction<
  DiscogsOAuthModule["discogsOAuthService"]["getCollection"]
>;

const USERNAME = "crate-digger";

const createRequest = (params = `username=${USERNAME}`) =>
  new NextRequest(`http://localhost/api/collection?${params}`);

const authenticatedSession = {
  user: { userId: 42, username: USERNAME },
  accessToken: "access-token",
  accessTokenSecret: "access-token-secret",
};

beforeAll(async () => {
  const [routeModule, authRequest, discogsOAuth] = await Promise.all([
    import("src/app/api/collection/route"),
    import("src/lib/auth-request"),
    import("src/services/discogs-oauth.service"),
  ]);

  GET = routeModule.GET;
  mockRequireAuthenticatedDiscogsUser = jest.mocked(
    authRequest.requireAuthenticatedDiscogsUser,
  );
  mockGetCollection = jest.mocked(
    discogsOAuth.discogsOAuthService.getCollection,
  );
});

describe("GET /api/collection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockRequireAuthenticatedDiscogsUser.mockResolvedValue(authenticatedSession);
  });

  it("returns collection data for an authenticated user", async () => {
    const collection = collectionFactory.build({}, { releaseCount: 2 });
    mockGetCollection.mockResolvedValue(collection);

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(collection);
    expect(mockGetCollection).toHaveBeenCalledWith(
      USERNAME,
      "access-token",
      "access-token-secret",
      1,
      COLLECTION_PAGE_SIZE,
      "added",
      "desc",
    );
  });

  it("returns 400 when username is missing", async () => {
    const response = await GET(createRequest("page=1"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Username is required",
    });
  });

  it("returns 400 when sort parameter is invalid", async () => {
    const response = await GET(
      createRequest(`username=${USERNAME}&sort=invalid`),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("Invalid sort parameter"),
    });
  });

  it("returns auth error when session verification fails", async () => {
    mockRequireAuthenticatedDiscogsUser.mockResolvedValue({
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    });

    const response = await GET(createRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Not authenticated",
    });
  });
});
