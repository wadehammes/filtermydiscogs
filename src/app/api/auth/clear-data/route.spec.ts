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

jest.mock("src/lib/auth-request", () => ({
  getVerifiedUserFromRequest: jest.fn(),
  clearDiscogsSessionCookie: jest.fn(),
  clearReconnectUsernameCookie: jest.fn(),
}));

jest.mock("src/lib/db", () => ({
  prisma: {
    productAnalyticsEvent: {
      deleteMany: jest.fn(),
    },
    user: {
      delete: jest.fn(),
    },
  },
}));

type RouteModule = typeof import("src/app/api/auth/clear-data/route");
type AuthRequestModule = typeof import("src/lib/auth-request");
type DbModule = typeof import("src/lib/db");

let POST: RouteModule["POST"];
let mockGetVerifiedUserFromRequest: jest.MockedFunction<
  AuthRequestModule["getVerifiedUserFromRequest"]
>;
let mockDeleteUser: jest.MockedFunction<DbModule["prisma"]["user"]["delete"]>;
let mockDeleteAnalyticsEvents: jest.MockedFunction<
  DbModule["prisma"]["productAnalyticsEvent"]["deleteMany"]
>;

const createPostRequest = () =>
  new NextRequest("http://localhost/api/auth/clear-data", {
    method: "POST",
  });

const createUnauthorizedError = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

beforeAll(async () => {
  const [routeModule, authRequest, db] = await Promise.all([
    import("src/app/api/auth/clear-data/route"),
    import("src/lib/auth-request"),
    import("src/lib/db"),
  ]);

  POST = routeModule.POST;
  mockGetVerifiedUserFromRequest = jest.mocked(
    authRequest.getVerifiedUserFromRequest,
  );
  mockDeleteUser = jest.mocked(db.prisma.user.delete);
  mockDeleteAnalyticsEvents = jest.mocked(
    db.prisma.productAnalyticsEvent.deleteMany,
  );
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
    mockDeleteAnalyticsEvents.mockResolvedValue({ count: 0 });
    mockDeleteUser.mockResolvedValue(
      {} as Awaited<ReturnType<DbModule["prisma"]["user"]["delete"]>>,
    );
  });

  it("deletes analytics events and the user row and clears auth cookies", async () => {
    const response = await POST(createPostRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockDeleteAnalyticsEvents).toHaveBeenCalledWith({
      where: { user_id: 42 },
    });
    expect(mockDeleteUser).toHaveBeenCalledWith({
      where: { discogs_user_id: 42 },
    });
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
