import { describe, expect, it, jest } from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";

describe("ip-rate-limit", () => {
  it("returns 429 when the IP limit is exceeded", async () => {
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });

    const {
      AUTH_ROUTE_RATE_LIMIT_CONFIG,
      checkIpRateLimit,
      getIpRateLimitResponse,
    } = await import("src/lib/ip-rate-limit");

    const ip = `203.0.113.${Date.now() % 200}`;
    const request = new NextRequest("http://localhost/api/auth/check", {
      headers: { "x-forwarded-for": ip },
    });
    const maxRequests = AUTH_ROUTE_RATE_LIMIT_CONFIG.maxRequests;

    for (let index = 0; index < maxRequests; index += 1) {
      expect(
        checkIpRateLimit(request, AUTH_ROUTE_RATE_LIMIT_CONFIG).allowed,
      ).toBe(true);
    }

    const blocked = checkIpRateLimit(request, AUTH_ROUTE_RATE_LIMIT_CONFIG);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.response.status).toBe(429);
    }

    const response = getIpRateLimitResponse(
      request,
      AUTH_ROUTE_RATE_LIMIT_CONFIG,
    );
    expect(response?.status).toBe(429);
  });
});
