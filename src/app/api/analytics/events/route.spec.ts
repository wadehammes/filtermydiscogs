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
  getOptionalVerifiedUserFromRequest: jest.fn(),
}));

jest.mock("src/lib/ip-rate-limit", () => ({
  ANALYTICS_EVENTS_RATE_LIMIT_CONFIG: {},
  checkIpRateLimit: jest.fn(() => ({ allowed: true })),
}));

jest.mock("src/lib/product-analytics.server", () => ({
  validateProductAnalyticsBatch: jest.fn(),
  insertProductAnalyticsEvents: jest.fn(),
}));

type RouteModule = typeof import("src/app/api/analytics/events/route");
type AuthRequestModule = typeof import("src/lib/auth-request");
type ProductAnalyticsModule = typeof import("src/lib/product-analytics.server");

let POST: RouteModule["POST"];
let mockGetOptionalVerifiedUserFromRequest: jest.MockedFunction<
  AuthRequestModule["getOptionalVerifiedUserFromRequest"]
>;
let mockValidateProductAnalyticsBatch: jest.MockedFunction<
  ProductAnalyticsModule["validateProductAnalyticsBatch"]
>;
let mockInsertProductAnalyticsEvents: jest.MockedFunction<
  ProductAnalyticsModule["insertProductAnalyticsEvents"]
>;

const sampleEvents = [
  {
    event: "pageView",
    category: "navigation",
    action: "pageView",
    label: "Releases",
    value: "/releases",
    page_path: "/releases",
  },
];

const createPostRequest = (body: string, contentType = "application/json") =>
  new NextRequest("http://localhost/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  });

beforeAll(async () => {
  const [routeModule, authRequest, productAnalytics] = await Promise.all([
    import("src/app/api/analytics/events/route"),
    import("src/lib/auth-request"),
    import("src/lib/product-analytics.server"),
  ]);

  POST = routeModule.POST;
  mockGetOptionalVerifiedUserFromRequest = jest.mocked(
    authRequest.getOptionalVerifiedUserFromRequest,
  );
  mockValidateProductAnalyticsBatch = jest.mocked(
    productAnalytics.validateProductAnalyticsBatch,
  );
  mockInsertProductAnalyticsEvents = jest.mocked(
    productAnalytics.insertProductAnalyticsEvents,
  );
});

describe("POST /api/analytics/events", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetOptionalVerifiedUserFromRequest.mockResolvedValue(null);
    mockValidateProductAnalyticsBatch.mockReturnValue({ events: sampleEvents });
    mockInsertProductAnalyticsEvents.mockResolvedValue(undefined);
  });

  it("stores validated events for anonymous visitors", async () => {
    const response = await POST(
      createPostRequest(JSON.stringify({ events: sampleEvents })),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockInsertProductAnalyticsEvents).toHaveBeenCalledWith(
      sampleEvents,
      null,
    );
  });

  it("accepts text/plain JSON payloads", async () => {
    const response = await POST(
      createPostRequest(JSON.stringify({ events: sampleEvents }), "text/plain"),
    );

    expect(response.status).toBe(200);
    expect(mockInsertProductAnalyticsEvents).toHaveBeenCalledWith(
      sampleEvents,
      null,
    );
  });

  it("returns validation errors without inserting", async () => {
    mockValidateProductAnalyticsBatch.mockReturnValue({
      error: "events must be an array",
    });

    const response = await POST(
      createPostRequest(JSON.stringify({ events: "nope" })),
    );

    expect(response.status).toBe(400);
    expect(mockInsertProductAnalyticsEvents).not.toHaveBeenCalled();
  });
});
