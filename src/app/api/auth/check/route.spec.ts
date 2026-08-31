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
  getVerifiedUserFromRequest: jest.fn(),
  getDisplayIdentityFromCookies: jest.fn(),
  getStoredReconnectUsername: jest.fn(),
  getVerifiedUserFromStoredTokens: jest.fn(),
}));

jest.mock("src/lib/user.server", () => ({
  consumeSupportProjectToastPending: jest.fn(),
  touchUserLastSeen: jest.fn(),
}));

type RouteModule = typeof import("src/app/api/auth/check/route");
type AuthRequestModule = typeof import("src/lib/auth-request");
type UserServerModule = typeof import("src/lib/user.server");

let GET: RouteModule["GET"];
let mockGetVerifiedUserFromRequest: jest.MockedFunction<
  AuthRequestModule["getVerifiedUserFromRequest"]
>;
let mockGetDisplayIdentityFromCookies: jest.MockedFunction<
  AuthRequestModule["getDisplayIdentityFromCookies"]
>;
let mockGetStoredReconnectUsername: jest.MockedFunction<
  AuthRequestModule["getStoredReconnectUsername"]
>;
let mockGetVerifiedUserFromStoredTokens: jest.MockedFunction<
  AuthRequestModule["getVerifiedUserFromStoredTokens"]
>;
let mockConsumeSupportProjectToastPending: jest.MockedFunction<
  UserServerModule["consumeSupportProjectToastPending"]
>;
let mockTouchUserLastSeen: jest.MockedFunction<
  UserServerModule["touchUserLastSeen"]
>;

const createRequest = () => new NextRequest("http://localhost/api/auth/check");

const createRateLimitError = () =>
  NextResponse.json(
    { error: "Discogs rate limit exceeded. Please try again shortly." },
    { status: 503, headers: { "Retry-After": "60" } },
  );

beforeAll(async () => {
  const [routeModule, authRequest, userServer] = await Promise.all([
    import("src/app/api/auth/check/route"),
    import("src/lib/auth-request"),
    import("src/lib/user.server"),
  ]);

  GET = routeModule.GET;
  mockGetVerifiedUserFromRequest = jest.mocked(
    authRequest.getVerifiedUserFromRequest,
  );
  mockGetDisplayIdentityFromCookies = jest.mocked(
    authRequest.getDisplayIdentityFromCookies,
  );
  mockGetStoredReconnectUsername = jest.mocked(
    authRequest.getStoredReconnectUsername,
  );
  mockGetVerifiedUserFromStoredTokens = jest.mocked(
    authRequest.getVerifiedUserFromStoredTokens,
  );
  mockConsumeSupportProjectToastPending = jest.mocked(
    userServer.consumeSupportProjectToastPending,
  );
  mockTouchUserLastSeen = jest.mocked(userServer.touchUserLastSeen);
});

describe("GET /api/auth/check", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsumeSupportProjectToastPending.mockResolvedValue(false);
    mockTouchUserLastSeen.mockResolvedValue(undefined);
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
  });

  it("returns authenticated session when OAuth verification succeeds", async () => {
    mockGetVerifiedUserFromRequest.mockResolvedValue({
      user: { userId: 42, username: "crate-digger" },
    });
    mockConsumeSupportProjectToastPending.mockResolvedValue(true);

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    expect(mockConsumeSupportProjectToastPending).toHaveBeenCalledWith(42);
    expect(mockTouchUserLastSeen).toHaveBeenCalledWith(42);
    await expect(response.json()).resolves.toEqual({
      isAuthenticated: true,
      username: "crate-digger",
      userId: "42",
      rateLimited: false,
      reconnectUsername: null,
      showSupportProjectToast: true,
    });
  });

  it("returns cookie-based identity when Discogs is rate limited", async () => {
    mockGetVerifiedUserFromRequest.mockResolvedValue({
      error: createRateLimitError(),
    });
    mockGetDisplayIdentityFromCookies.mockReturnValue({
      userId: 42,
      username: "crate-digger",
    });

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get("Retry-After")).toBe("60");
    await expect(response.json()).resolves.toEqual({
      isAuthenticated: true,
      username: "crate-digger",
      userId: "42",
      rateLimited: true,
      reconnectUsername: null,
      showSupportProjectToast: false,
    });
  });

  it("returns unauthenticated when verification fails", async () => {
    mockGetVerifiedUserFromRequest.mockResolvedValue({
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });
    mockGetStoredReconnectUsername.mockReturnValue(null);
    mockGetVerifiedUserFromStoredTokens.mockResolvedValue({
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      isAuthenticated: false,
      username: null,
      userId: null,
      rateLimited: false,
      reconnectUsername: null,
      showSupportProjectToast: false,
    });
  });

  it("returns reconnect username from stored tokens when session expired", async () => {
    mockGetVerifiedUserFromRequest.mockResolvedValue({
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });
    mockGetStoredReconnectUsername.mockReturnValue(null);
    mockGetVerifiedUserFromStoredTokens.mockResolvedValue({
      user: { userId: 42, username: "crate-digger" },
    });

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      isAuthenticated: false,
      username: null,
      userId: null,
      rateLimited: false,
      reconnectUsername: "crate-digger",
      showSupportProjectToast: false,
    });
  });

  it("prefers reconnect cookie over stored token lookup", async () => {
    mockGetVerifiedUserFromRequest.mockResolvedValue({
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });
    mockGetStoredReconnectUsername.mockReturnValue("saved-account");

    const response = await GET(createRequest());

    expect(mockGetVerifiedUserFromStoredTokens).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      isAuthenticated: false,
      username: null,
      userId: null,
      rateLimited: false,
      reconnectUsername: "saved-account",
      showSupportProjectToast: false,
    });
  });
});
