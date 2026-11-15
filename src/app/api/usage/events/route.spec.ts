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
import { PRODUCT_ANALYTICS_INGEST_PATH } from "src/types/productAnalytics.types";

jest.mock("src/lib/auth-request", () => ({
  getVerifiedUserFromRequest: jest.fn(),
  hasActiveDiscogsSession: jest.fn(),
}));

jest.mock("src/lib/ip-rate-limit", () => ({
  ANALYTICS_EVENTS_RATE_LIMIT_CONFIG: {},
  checkIpRateLimit: jest.fn(() => ({ allowed: true })),
}));

jest.mock("src/lib/product-analytics.server", () => ({
  validateProductAnalyticsBatch: jest.fn(),
  insertProductAnalyticsEvents: jest.fn(),
}));

type RouteModule = typeof import("src/app/api/usage/events/route");
type AuthRequestModule = typeof import("src/lib/auth-request");
type ProductAnalyticsModule = typeof import("src/lib/product-analytics.server");

let POST: RouteModule["POST"];
let mockGetVerifiedUserFromRequest: jest.MockedFunction<
  AuthRequestModule["getVerifiedUserFromRequest"]
>;
let mockHasActiveDiscogsSession: jest.MockedFunction<
  AuthRequestModule["hasActiveDiscogsSession"]
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
  new NextRequest(`http://localhost${PRODUCT_ANALYTICS_INGEST_PATH}`, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  });

beforeAll(async () => {
  const [routeModule, authRequest, productAnalytics] = await Promise.all([
    import("src/app/api/usage/events/route"),
    import("src/lib/auth-request"),
    import("src/lib/product-analytics.server"),
  ]);

  POST = routeModule.POST;
  mockGetVerifiedUserFromRequest = jest.mocked(
    authRequest.getVerifiedUserFromRequest,
  );
  mockHasActiveDiscogsSession = jest.mocked(
    authRequest.hasActiveDiscogsSession,
  );
  mockValidateProductAnalyticsBatch = jest.mocked(
    productAnalytics.validateProductAnalyticsBatch,
  );
  mockInsertProductAnalyticsEvents = jest.mocked(
    productAnalytics.insertProductAnalyticsEvents,
  );
});

describe(`POST ${PRODUCT_ANALYTICS_INGEST_PATH}`, () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockHasActiveDiscogsSession.mockReturnValue(false);
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
    expect(mockGetVerifiedUserFromRequest).not.toHaveBeenCalled();
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

  it("ignores unverified display cookies when attributing analytics user id", async () => {
    mockHasActiveDiscogsSession.mockReturnValue(true);
    mockGetVerifiedUserFromRequest.mockResolvedValue({
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const response = await POST(
      createPostRequest(JSON.stringify({ events: sampleEvents })),
    );

    expect(response.status).toBe(200);
    expect(mockInsertProductAnalyticsEvents).toHaveBeenCalledWith(
      sampleEvents,
      null,
    );
    expect(mockGetVerifiedUserFromRequest).toHaveBeenCalledTimes(1);
  });

  it("stores events with OAuth-verified user id when session is active", async () => {
    mockHasActiveDiscogsSession.mockReturnValue(true);
    mockGetVerifiedUserFromRequest.mockResolvedValue({
      user: verifiedDiscogsUserFactory.build({ userId: 99, username: "vera" }),
    });

    const response = await POST(
      createPostRequest(JSON.stringify({ events: sampleEvents })),
    );

    expect(response.status).toBe(200);
    expect(mockGetVerifiedUserFromRequest).toHaveBeenCalledTimes(1);
    expect(mockInsertProductAnalyticsEvents).toHaveBeenCalledWith(
      sampleEvents,
      99,
    );
  });

  it("stores events with null user id when OAuth verification fails", async () => {
    mockHasActiveDiscogsSession.mockReturnValue(true);
    mockGetVerifiedUserFromRequest.mockResolvedValue({
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const response = await POST(
      createPostRequest(JSON.stringify({ events: sampleEvents })),
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
