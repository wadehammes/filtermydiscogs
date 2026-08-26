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
  getReadOnlyVerifiedUserFromRequest: jest.fn(),
}));

jest.mock("src/lib/api-helpers", () => ({
  rethrowNextInternalError: jest.fn(),
  createErrorResponse: jest.fn((error: unknown) =>
    NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    ),
  ),
}));

jest.mock("src/services/discogs-oauth.service", () => ({
  discogsOAuthService: {
    searchReleases: jest.fn(),
  },
}));

type RouteModule = typeof import("src/app/api/search/route");
type AuthRequestModule = typeof import("src/lib/auth-request");
type DiscogsOAuthModule = typeof import("src/services/discogs-oauth.service");

let GET: RouteModule["GET"];
let mockGetReadOnlyVerifiedUserFromRequest: jest.MockedFunction<
  AuthRequestModule["getReadOnlyVerifiedUserFromRequest"]
>;
let mockSearchReleases: jest.MockedFunction<
  DiscogsOAuthModule["discogsOAuthService"]["searchReleases"]
>;

const searchResults = {
  pagination: {
    page: 1,
    pages: 1,
    per_page: 100,
    items: 0,
    urls: { next: "", prev: "" },
  },
  results: [],
};

const createRequest = (params: string) =>
  new NextRequest(`http://localhost/api/search?${params}`);

const createAuthenticatedRequest = (params: string) => {
  const request = createRequest(params);
  request.cookies.set("discogs_access_token", "access-token");
  request.cookies.set("discogs_access_token_secret", "access-token-secret");
  return request;
};

beforeAll(async () => {
  const [routeModule, authRequest, discogsOAuth] = await Promise.all([
    import("src/app/api/search/route"),
    import("src/lib/auth-request"),
    import("src/services/discogs-oauth.service"),
  ]);

  GET = routeModule.GET;
  mockGetReadOnlyVerifiedUserFromRequest = jest.mocked(
    authRequest.getReadOnlyVerifiedUserFromRequest,
  );
  mockSearchReleases = jest.mocked(
    discogsOAuth.discogsOAuthService.searchReleases,
  );
});

describe("GET /api/search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetReadOnlyVerifiedUserFromRequest.mockResolvedValue({
      user: { userId: 42, username: "crate-digger" },
    });
    mockSearchReleases.mockResolvedValue(searchResults);
  });

  it("returns search results for an authenticated request", async () => {
    const response = await GET(createAuthenticatedRequest("q=never+gonna"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(searchResults);
    expect(mockSearchReleases).toHaveBeenCalledWith(
      "access-token",
      "access-token-secret",
      "never gonna",
      1,
      100,
      "release",
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });

  it("returns 400 when query is missing", async () => {
    const response = await GET(createAuthenticatedRequest("page=1"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Query parameter 'q' is required",
    });
  });

  it("returns 400 when search type is invalid", async () => {
    const response = await GET(
      createAuthenticatedRequest("q=test&type=invalid"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("Invalid type parameter"),
    });
  });

  it("returns 401 when OAuth cookies are missing", async () => {
    const response = await GET(createRequest("q=test"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Not authenticated",
    });
    expect(mockSearchReleases).not.toHaveBeenCalled();
  });
});
