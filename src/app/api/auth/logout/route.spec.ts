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
  clearVerifiedIdentityCache: jest.fn(),
  clearDiscogsSessionCookie: jest.fn(),
  clearReconnectUsernameCookie: jest.fn(),
  setReconnectUsernameCookie: jest.fn(),
}));

type RouteModule = typeof import("src/app/api/auth/logout/route");
type AuthRequestModule = typeof import("src/lib/auth-request");

let POST: RouteModule["POST"];
let mockClearVerifiedIdentityCache: jest.MockedFunction<
  AuthRequestModule["clearVerifiedIdentityCache"]
>;
let mockSetReconnectUsernameCookie: jest.MockedFunction<
  AuthRequestModule["setReconnectUsernameCookie"]
>;
let mockClearReconnectUsernameCookie: jest.MockedFunction<
  AuthRequestModule["clearReconnectUsernameCookie"]
>;

const createPostRequest = (search = "", cookies: Record<string, string> = {}) =>
  new NextRequest(`http://localhost/api/auth/logout${search}`, {
    method: "POST",
    headers: {
      cookie: Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join("; "),
    },
  });

beforeAll(async () => {
  const [routeModule, authRequest] = await Promise.all([
    import("src/app/api/auth/logout/route"),
    import("src/lib/auth-request"),
  ]);

  POST = routeModule.POST;
  mockClearVerifiedIdentityCache = jest.mocked(
    authRequest.clearVerifiedIdentityCache,
  );
  mockSetReconnectUsernameCookie = jest.mocked(
    authRequest.setReconnectUsernameCookie,
  );
  mockClearReconnectUsernameCookie = jest.mocked(
    authRequest.clearReconnectUsernameCookie,
  );
});

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      const response = new NextResponse(JSON.stringify(body), init);
      return response;
    });
  });

  it("returns success and clears identity cache when tokens are present", async () => {
    const response = await POST(
      createPostRequest("", {
        discogs_access_token: "access-token",
        discogs_access_token_secret: "access-secret",
        discogs_username: "crate-digger",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockClearVerifiedIdentityCache).toHaveBeenCalledWith(
      "access-token",
      "access-secret",
    );
    expect(mockSetReconnectUsernameCookie).toHaveBeenCalled();
    expect(mockClearReconnectUsernameCookie).not.toHaveBeenCalled();
  });

  it("preserves OAuth tokens by default", async () => {
    const response = await POST(
      createPostRequest("", {
        discogs_access_token: "access-token",
        discogs_access_token_secret: "access-secret",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.cookies.get("discogs_access_token")).toBeUndefined();
    expect(response.cookies.get("discogs_access_token_secret")).toBeUndefined();
  });

  it("revokes OAuth tokens when preserve_tokens=false", async () => {
    const response = await POST(
      createPostRequest("?preserve_tokens=false", {
        discogs_access_token: "access-token",
        discogs_access_token_secret: "access-secret",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.cookies.get("discogs_access_token")?.value).toBe("");
    expect(response.cookies.get("discogs_access_token_secret")?.value).toBe("");
    expect(mockClearReconnectUsernameCookie).toHaveBeenCalled();
    expect(mockSetReconnectUsernameCookie).not.toHaveBeenCalled();
  });
});
