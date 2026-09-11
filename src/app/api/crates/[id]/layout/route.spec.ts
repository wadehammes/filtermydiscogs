import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { verifiedDiscogsUserFactory } from "src/tests/factories/VerifiedDiscogsUser.factory";
import { createDbModuleMock } from "src/tests/mocks/mockDb";
import type { Crate } from "src/types/crate.types";

const dbMock = createDbModuleMock();

jest.mock("src/lib/db", () => dbMock);

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

type RouteModule = typeof import("src/app/api/crates/[id]/layout/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");

let PUT: RouteModule["PUT"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockCratesFirst: typeof dbMock.orm.Crates.first;
let mockCrateReleasesAll: typeof dbMock.orm.CrateReleases.all;
let mockCrateSetMarkersAll: typeof dbMock.orm.CrateSetMarkers.all;
let mockCrateReleasesUpdate: typeof dbMock.orm.CrateReleases.update;
let mockCrateSetMarkersDeleteAndCount: typeof dbMock.orm.CrateSetMarkers.deleteAndCount;
let mockCrateSetMarkersUpsert: typeof dbMock.orm.CrateSetMarkers.upsert;
let mockTransaction: typeof dbMock.db.transaction;
let mockAudit: jest.MockedFunction<ApiHelpersModule["auditDatabaseOperation"]>;

const CRATE_ID = "crate-1";
const USER_ID = 42;

const verifiedUser = verifiedDiscogsUserFactory.asVerifiedResult({
  userId: USER_ID,
  username: "crate-digger",
});

const toOrmCrate = (crate: Crate) => ({
  userId: crate.user_id,
  id: crate.id,
  name: crate.name,
  username: crate.username,
  isDefault: crate.is_default,
  private: crate.private,
  packedEnabled: crate.packed_enabled,
  notes: crate.notes,
  createdAt: crate.created_at,
  updatedAt: crate.updated_at,
});

const createPutRequest = (body: unknown) =>
  new NextRequest(`http://localhost/api/crates/${CRATE_ID}/layout`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeAll(async () => {
  const [routeModule, apiHelpers] = await Promise.all([
    import("src/app/api/crates/[id]/layout/route"),
    import("src/lib/api-helpers"),
  ]);

  PUT = routeModule.PUT;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockCratesFirst = dbMock.orm.Crates.first;
  mockCrateReleasesAll = dbMock.orm.CrateReleases.all;
  mockCrateSetMarkersAll = dbMock.orm.CrateSetMarkers.all;
  mockCrateReleasesUpdate = dbMock.orm.CrateReleases.update;
  mockCrateSetMarkersDeleteAndCount = dbMock.orm.CrateSetMarkers.deleteAndCount;
  mockCrateSetMarkersUpsert = dbMock.orm.CrateSetMarkers.upsert;
  mockTransaction = dbMock.db.transaction;
  mockAudit = jest.mocked(apiHelpers.auditDatabaseOperation);
});

describe("PUT /api/crates/[id]/layout", () => {
  let crateReleasesAllCallCount = 0;
  let crateSetMarkersAllCallCount = 0;

  beforeEach(() => {
    crateReleasesAllCallCount = 0;
    crateSetMarkersAllCallCount = 0;
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockCratesFirst.mockResolvedValue(
      toOrmCrate(
        crateFactory.defaultTestCrate({ id: CRATE_ID, user_id: USER_ID }),
      ),
    );
    mockCrateReleasesAll.mockImplementation(async () => {
      crateReleasesAllCallCount += 1;

      if (crateReleasesAllCallCount === 1) {
        return [{ instanceId: "111" }, { instanceId: "222" }];
      }

      return [
        {
          releaseData: releaseFactory.withDisplayDefaults({
            instance_id: "222",
          }),
          foundAt: null,
          sortOrder: 1000,
        },
        {
          releaseData: releaseFactory.withDisplayDefaults({
            instance_id: "111",
          }),
          foundAt: null,
          sortOrder: 2000,
        },
      ];
    });
    mockCrateSetMarkersAll.mockImplementation(async () => {
      crateSetMarkersAllCallCount += 1;

      if (crateSetMarkersAllCallCount === 1) {
        return [];
      }

      return [
        {
          id: "marker-1",
          label: "Peak hour",
          sortOrder: 500,
        },
      ];
    });
    mockCrateReleasesUpdate.mockResolvedValue(null);
    mockCrateSetMarkersDeleteAndCount.mockResolvedValue(0);
    mockCrateSetMarkersUpsert.mockResolvedValue({});
  });

  it("reorders releases and adds a marker", async () => {
    const response = await PUT(
      createPutRequest({
        items: [
          { kind: "marker", label: "Peak hour" },
          { kind: "release", instance_id: "222" },
          { kind: "release", instance_id: "111" },
        ],
      }),
      { params: Promise.resolve({ id: CRATE_ID }) },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.releases).toHaveLength(2);
    expect(body.markers).toHaveLength(1);
    expect(mockCrateReleasesUpdate).toHaveBeenCalledTimes(2);
    expect(mockCrateSetMarkersUpsert).toHaveBeenCalledTimes(1);
    expect(mockAudit).toHaveBeenCalled();
  });

  it("rejects duplicate releases in the payload", async () => {
    const response = await PUT(
      createPutRequest({
        items: [
          { kind: "release", instance_id: "111" },
          { kind: "release", instance_id: "111" },
        ],
      }),
      { params: Promise.resolve({ id: CRATE_ID }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Each release may appear only once in the layout",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects missing releases from the payload", async () => {
    const response = await PUT(
      createPutRequest({
        items: [{ kind: "release", instance_id: "111" }],
      }),
      { params: Promise.resolve({ id: CRATE_ID }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Layout must include every release in the crate",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
