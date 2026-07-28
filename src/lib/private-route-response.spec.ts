import { describe, expect, it } from "@jest/globals";
import { NextResponse } from "next/server";
import {
  isPrivateSessionApiRoute,
  PRIVATE_ROUTE_CACHE_HEADERS,
  privateRouteRedirect,
  withPrivateRouteHeaders,
} from "src/lib/private-route-response";

describe("isPrivateSessionApiRoute", () => {
  it("matches auth routes", () => {
    expect(isPrivateSessionApiRoute("/api/auth/check")).toBe(true);
  });

  it("matches authenticated crate routes", () => {
    expect(isPrivateSessionApiRoute("/api/crates")).toBe(true);
    expect(isPrivateSessionApiRoute("/api/crates/abc/releases")).toBe(true);
  });

  it("excludes public crate routes", () => {
    expect(isPrivateSessionApiRoute("/api/crates/public/abc")).toBe(false);
  });

  it("excludes unrelated API routes", () => {
    expect(isPrivateSessionApiRoute("/api/collection")).toBe(false);
  });
});

describe("withPrivateRouteHeaders", () => {
  it("sets private cache headers on a response", () => {
    const response = withPrivateRouteHeaders(NextResponse.next());

    for (const [key, value] of Object.entries(PRIVATE_ROUTE_CACHE_HEADERS)) {
      expect(response.headers.get(key)).toBe(value);
    }
  });
});

describe("privateRouteRedirect", () => {
  it("sets private cache headers on redirects", () => {
    const response = privateRouteRedirect("https://example.com/releases");

    expect(response.status).toBe(307);

    for (const [key, value] of Object.entries(PRIVATE_ROUTE_CACHE_HEADERS)) {
      expect(response.headers.get(key)).toBe(value);
    }
  });
});
