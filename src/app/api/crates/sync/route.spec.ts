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

jest.mock("src/lib/db", () => dbMock);

type RouteModule = typeof import("src/app/api/crates/sync/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");

const USER_ID = 42;

let POST: RouteModule["POST"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockAudit: jest.MockedFunction<ApiHelpersModule["auditDatabaseOperation"]>;

const buildInstanceIds = (count: number) =>
  Array.from({ length: count }, (_, index) => String(index + 1));

beforeAll(async () => {
  const [routeModule, apiHelpers] = await Promise.all([
    import("src/app/api/crates/sync/route"),
    import("src/lib/api-helpers"),
  ]);

  POST = routeModule.POST;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockAudit = jest.mocked(apiHelpers.auditDatabaseOperation);
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
    dbMock.orm.CrateReleases.deleteAndCount.mockResolvedValue(1);
  });

  it("records sync_force_override when force bypasses the deletion threshold", async () => {
    dbMock.orm.CrateReleases.all.mockResolvedValue(
      buildInstanceIds(20).map((instanceId) => ({ instanceId })),
    );

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
