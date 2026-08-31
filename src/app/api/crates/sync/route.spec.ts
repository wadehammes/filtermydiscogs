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

jest.mock("src/lib/api-helpers", () => ({
  getVerifiedUserFromRequestWithRateLimit: jest.fn(),
  auditDatabaseOperation: jest.fn(),
  createErrorResponse: jest.fn((error: unknown) =>
    NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    ),
  ),
}));

jest.mock("src/lib/db", () => ({
  prisma: {
    crateRelease: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

type RouteModule = typeof import("src/app/api/crates/sync/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type DbModule = typeof import("src/lib/db");

const USER_ID = 42;

let POST: RouteModule["POST"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockAudit: jest.MockedFunction<ApiHelpersModule["auditDatabaseOperation"]>;
let mockFindMany: jest.MockedFunction<
  DbModule["prisma"]["crateRelease"]["findMany"]
>;
let mockDeleteMany: jest.MockedFunction<
  DbModule["prisma"]["crateRelease"]["deleteMany"]
>;

const buildInstanceIds = (count: number) =>
  Array.from({ length: count }, (_, index) => String(index + 1));

const buildSyncFindManyRows = (
  count: number,
): Awaited<ReturnType<DbModule["prisma"]["crateRelease"]["findMany"]>> =>
  buildInstanceIds(count).map((instance_id) => ({
    user_id: USER_ID,
    crate_id: "11111111-2222-3333-4444-555555555555",
    instance_id,
    release_data: {},
    added_at: new Date("2026-01-01T00:00:00.000Z"),
    found_at: null,
    sort_order: 1000,
  }));

beforeAll(async () => {
  const [routeModule, apiHelpers, db] = await Promise.all([
    import("src/app/api/crates/sync/route"),
    import("src/lib/api-helpers"),
    import("src/lib/db"),
  ]);

  POST = routeModule.POST;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockAudit = jest.mocked(apiHelpers.auditDatabaseOperation);
  mockFindMany = jest.mocked(db.prisma.crateRelease.findMany);
  mockDeleteMany = jest.mocked(db.prisma.crateRelease.deleteMany);
});

describe("POST /api/crates/sync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(
      verifiedDiscogsUserFactory.asVerifiedResult({
        userId: USER_ID,
        username: "crate-digger",
      }),
    );
    mockDeleteMany.mockResolvedValue({ count: 1 });
  });

  it("records sync_force_override when force bypasses the deletion threshold", async () => {
    mockFindMany.mockResolvedValue(buildSyncFindManyRows(20));

    const request = new NextRequest("http://localhost/api/crates/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collectionInstanceIds: buildInstanceIds(10).map((id) =>
          String(Number(id) + 100),
        ),
        force: true,
      }),
    });

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("crate_sync_force_override"),
    );
    expect(mockAudit).toHaveBeenCalledWith(
      USER_ID,
      "CrateRelease",
      "bulk_delete",
      undefined,
      expect.objectContaining({ operation: "sync_force_override" }),
    );

    warnSpy.mockRestore();
  });
});
