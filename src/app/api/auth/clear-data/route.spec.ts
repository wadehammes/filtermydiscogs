import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { verifiedDiscogsUserFactory } from "src/tests/factories/VerifiedDiscogsUser.factory";
import { createDbModuleMock } from "src/tests/mocks/mockDb";

const dbMock = createDbModuleMock();

jest.mock("src/lib/auth-request", () => ({
  getVerifiedUserFromRequest: jest.fn(),
  clearDiscogsSessionCookie: jest.fn(),
  clearReconnectUsernameCookie: jest.fn(),
}));

jest.mock("src/lib/auth-route-guards", () => ({
  enforceAuthRouteIpRateLimit: jest.fn(() => null),
}));

jest.mock("src/lib/db", () => dbMock);

type RouteModule = typeof import("src/app/api/auth/clear-data/route");
type AuthRequestModule = typeof import("src/lib/auth-request");

let POST: RouteModule["POST"];
let mockGetVerifiedUserFromRequest: jest.MockedFunction<
  AuthRequestModule["getVerifiedUserFromRequest"]
>;
let mockDeleteUser: typeof dbMock.orm.Users.delete;
let mockDeleteAnalyticsEvents: typeof dbMock.orm.ProductAnalyticsEvents.deleteAndCount;

const createPostRequest = () =>
  new NextRequest("http://localhost/api/auth/clear-data", {
    method: "POST",
  });

const createUnauthorizedError = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

beforeAll(async () => {
  const [routeModule, authRequest] = await Promise.all([
    import("src/app/api/auth/clear-data/route"),
    import("src/lib/auth-request"),
  ]);

  POST = routeModule.POST;
  mockGetVerifiedUserFromRequest = jest.mocked(
    authRequest.getVerifiedUserFromRequest,
  );
  mockDeleteUser = dbMock.orm.Users.delete;
  mockDeleteAnalyticsEvents = dbMock.orm.ProductAnalyticsEvents.deleteAndCount;
});

describe("POST /api/auth/clear-data", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUserFromRequest.mockResolvedValue(
      verifiedDiscogsUserFactory.asVerifiedResult({
        userId: 42,
        username: "crate-digger",
      }),
    );
    mockDeleteAnalyticsEvents.mockResolvedValue(0);
    mockDeleteUser.mockResolvedValue(null);
  });

  it("deletes analytics events and the user row and clears auth cookies", async () => {
    const response = await POST(createPostRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(dbMock.orm.ProductAnalyticsEvents.where).toHaveBeenCalledWith({
      userId: 42,
    });
    expect(mockDeleteAnalyticsEvents).toHaveBeenCalled();
    expect(dbMock.orm.Users.where).toHaveBeenCalledWith({
      discogsUserId: 42,
    });
    expect(mockDeleteUser).toHaveBeenCalled();
    expect(response.cookies.get("discogs_access_token")?.value).toBe("");
    expect(response.cookies.get("discogs_access_token_secret")?.value).toBe("");
  });

  it("returns auth error when the session is invalid", async () => {
    mockGetVerifiedUserFromRequest.mockResolvedValue({
      error: createUnauthorizedError(),
    });

    const response = await POST(createPostRequest());

    expect(response.status).toBe(401);
    expect(mockDeleteAnalyticsEvents).not.toHaveBeenCalled();
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("returns 500 when database deletion fails", async () => {
    mockDeleteUser.mockRejectedValue(new Error("Database unavailable"));

    const response = await POST(createPostRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to clear stored data",
    });
  });
});
