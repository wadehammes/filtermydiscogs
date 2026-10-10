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
import { verifiedDiscogsUserFactory } from "src/tests/factories/VerifiedDiscogsUser.factory";

jest.mock("src/lib/api-helpers");

jest.mock("src/lib/crate-sync.server", () => {
  const actual = jest.requireActual<typeof import("src/lib/crate-sync.server")>(
    "src/lib/crate-sync.server",
  );
  return {
    ...actual,
    fetchCrateSyncOrphanState: jest.fn(),
    deleteCrateReleasesByInstanceIds: jest.fn(),
  };
});

type RouteModule = typeof import("src/app/api/crates/sync/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type CrateSyncServerModule = typeof import("src/lib/crate-sync.server");

const USER_ID = 42;

let POST: RouteModule["POST"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockAudit: jest.MockedFunction<ApiHelpersModule["auditDatabaseOperation"]>;
let mockFetchCrateSyncOrphanState: jest.MockedFunction<
  CrateSyncServerModule["fetchCrateSyncOrphanState"]
>;
let mockDeleteCrateReleasesByInstanceIds: jest.MockedFunction<
  CrateSyncServerModule["deleteCrateReleasesByInstanceIds"]
>;

const buildInstanceIds = (count: number) =>
  Array.from({ length: count }, (_, index) => String(index + 1));

beforeAll(async () => {
  const [routeModule, apiHelpers, crateSyncServer] = await Promise.all([
    import("src/app/api/crates/sync/route"),
    import("src/lib/api-helpers"),
    import("src/lib/crate-sync.server"),
  ]);

  POST = routeModule.POST;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockAudit = jest.mocked(apiHelpers.auditDatabaseOperation);
  mockFetchCrateSyncOrphanState = jest.mocked(
    crateSyncServer.fetchCrateSyncOrphanState,
  );
  mockDeleteCrateReleasesByInstanceIds = jest.mocked(
    crateSyncServer.deleteCrateReleasesByInstanceIds,
  );
});

describe("POST /api/crates/sync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(
      verifiedDiscogsUserFactory.asVerifiedResult({
        userId: USER_ID,
        username: "crate-digger",
      }),
    );
    mockDeleteCrateReleasesByInstanceIds.mockResolvedValue(20);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("records sync_force_override when force bypasses the deletion threshold", async () => {
    mockFetchCrateSyncOrphanState.mockResolvedValue({
      totalRowCount: 20,
      orphanedRowCount: 20,
      orphanedInstanceIds: buildInstanceIds(20),
    });

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
  });
});
