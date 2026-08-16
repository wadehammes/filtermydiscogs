import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";

jest.mock("src/lib/product-analytics-maintenance.server", () => ({
  runProductAnalyticsMaintenance: jest.fn(),
}));

type RouteModule = typeof import("src/app/api/cron/product-analytics/route");
type MaintenanceModule =
  typeof import("src/lib/product-analytics-maintenance.server");

let GET: RouteModule["GET"];
let mockRunProductAnalyticsMaintenance: jest.MockedFunction<
  MaintenanceModule["runProductAnalyticsMaintenance"]
>;

const createCronRequest = (authorization?: string) =>
  new NextRequest("http://localhost/api/cron/product-analytics", {
    method: "GET",
    ...(authorization ? { headers: { Authorization: authorization } } : {}),
  });

beforeAll(async () => {
  const [routeModule, maintenanceModule] = await Promise.all([
    import("src/app/api/cron/product-analytics/route"),
    import("src/lib/product-analytics-maintenance.server"),
  ]);

  GET = routeModule.GET;
  mockRunProductAnalyticsMaintenance = jest.mocked(
    maintenanceModule.runProductAnalyticsMaintenance,
  );
});

describe("GET /api/cron/product-analytics", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockRunProductAnalyticsMaintenance.mockResolvedValue({
      rollup: { daysProcessed: 1, pagePathRows: 2, eventRows: 3 },
      retention: { deleted: 4, cutoff: "2026-05-18T00:00:00.000Z" },
    });
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalCronSecret;
  });

  it("runs maintenance when the cron secret matches", async () => {
    const response = await GET(createCronRequest("Bearer test-cron-secret"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      rollup: { daysProcessed: 1, pagePathRows: 2, eventRows: 3 },
      retention: { deleted: 4, cutoff: "2026-05-18T00:00:00.000Z" },
    });
    expect(mockRunProductAnalyticsMaintenance).toHaveBeenCalledTimes(1);
  });

  it("returns 401 when the cron secret is missing or invalid", async () => {
    const response = await GET(createCronRequest("Bearer wrong-secret"));

    expect(response.status).toBe(401);
    expect(mockRunProductAnalyticsMaintenance).not.toHaveBeenCalled();
  });
});
