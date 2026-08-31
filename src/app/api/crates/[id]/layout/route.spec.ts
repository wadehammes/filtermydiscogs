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

const mockTransaction = jest.fn();

jest.mock("src/lib/db", () => ({
  prisma: {
    crate: {
      findUnique: jest.fn(),
    },
    crateRelease: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    crateSetMarker: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

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
type DbModule = typeof import("src/lib/db");

let PUT: RouteModule["PUT"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockFindUnique: jest.MockedFunction<
  DbModule["prisma"]["crate"]["findUnique"]
>;
let mockReleaseFindMany: jest.MockedFunction<
  DbModule["prisma"]["crateRelease"]["findMany"]
>;
let mockMarkerFindMany: jest.MockedFunction<
  DbModule["prisma"]["crateSetMarker"]["findMany"]
>;
let mockReleaseUpdate: jest.MockedFunction<
  DbModule["prisma"]["crateRelease"]["update"]
>;
let mockMarkerDeleteMany: jest.MockedFunction<
  DbModule["prisma"]["crateSetMarker"]["deleteMany"]
>;
let mockMarkerUpsert: jest.MockedFunction<
  DbModule["prisma"]["crateSetMarker"]["upsert"]
>;
let mockAudit: jest.MockedFunction<ApiHelpersModule["auditDatabaseOperation"]>;

const CRATE_ID = "crate-1";
const USER_ID = 42;

const verifiedUser = verifiedDiscogsUserFactory.asVerifiedResult({
  userId: USER_ID,
  username: "crate-digger",
});

const createPutRequest = (body: unknown) =>
  new NextRequest(`http://localhost/api/crates/${CRATE_ID}/layout`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeAll(async () => {
  const [routeModule, apiHelpers, db] = await Promise.all([
    import("src/app/api/crates/[id]/layout/route"),
    import("src/lib/api-helpers"),
    import("src/lib/db"),
  ]);

  PUT = routeModule.PUT;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockFindUnique = jest.mocked(db.prisma.crate.findUnique);
  mockReleaseFindMany = jest.mocked(db.prisma.crateRelease.findMany);
  mockMarkerFindMany = jest.mocked(db.prisma.crateSetMarker.findMany);
  mockReleaseUpdate = jest.mocked(db.prisma.crateRelease.update);
  mockMarkerDeleteMany = jest.mocked(db.prisma.crateSetMarker.deleteMany);
  mockMarkerUpsert = jest.mocked(db.prisma.crateSetMarker.upsert);
  mockAudit = jest.mocked(apiHelpers.auditDatabaseOperation);
});

describe("PUT /api/crates/[id]/layout", () => {
  let markerFindManyCallCount = 0;

  beforeEach(() => {
    markerFindManyCallCount = 0;
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockFindUnique.mockResolvedValue(
      crateFactory.defaultTestCrate({ id: CRATE_ID, user_id: USER_ID }),
    );
    (mockReleaseFindMany as jest.Mock).mockImplementation((args) => {
      if (
        args &&
        typeof args === "object" &&
        "select" in args &&
        args.select &&
        typeof args.select === "object" &&
        "instance_id" in args.select
      ) {
        return Promise.resolve([
          { instance_id: "111" },
          { instance_id: "222" },
        ] as Awaited<
          ReturnType<DbModule["prisma"]["crateRelease"]["findMany"]>
        >);
      }

      return Promise.resolve([
        {
          release_data: releaseFactory.withDisplayDefaults({
            instance_id: "222",
          }),
          found_at: null,
          sort_order: 1000,
        },
        {
          release_data: releaseFactory.withDisplayDefaults({
            instance_id: "111",
          }),
          found_at: null,
          sort_order: 2000,
        },
      ] as Awaited<ReturnType<DbModule["prisma"]["crateRelease"]["findMany"]>>);
    });
    (mockMarkerFindMany as jest.Mock).mockImplementation(() => {
      markerFindManyCallCount += 1;

      if (markerFindManyCallCount === 1) {
        return Promise.resolve([]);
      }

      return Promise.resolve([
        {
          id: "marker-1",
          label: "Peak hour",
          sort_order: 500,
        },
      ]);
    });
    mockTransaction.mockImplementation((async (
      callback: (tx: unknown) => Promise<unknown>,
    ) => {
      const tx = {
        crateRelease: {
          update: mockReleaseUpdate,
        },
        crateSetMarker: {
          deleteMany: mockMarkerDeleteMany,
          upsert: mockMarkerUpsert,
        },
      };
      return callback(tx);
    }) as (...args: unknown[]) => unknown);
    mockReleaseUpdate.mockResolvedValue({} as never);
    mockMarkerDeleteMany.mockResolvedValue({ count: 0 });
    mockMarkerUpsert.mockResolvedValue({} as never);
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
    expect(mockReleaseUpdate).toHaveBeenCalledTimes(2);
    expect(mockMarkerUpsert).toHaveBeenCalledTimes(1);
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
