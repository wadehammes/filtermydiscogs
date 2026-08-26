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

const dbMock = createDbModuleMock();

jest.mock("src/lib/db", () => dbMock);

jest.mock("src/lib/crate-layout.server", () => ({
  getPrependCrateLayoutSortOrderForCrate: jest.fn(async () => 1000),
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

type RouteModule = typeof import("src/app/api/crates/migrate/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type LayoutModule = typeof import("src/lib/crate-layout.server");

let POST: RouteModule["POST"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockCratesFirst: typeof dbMock.orm.Crates.first;
let mockCrateReleasesAll: typeof dbMock.orm.CrateReleases.all;
let mockCrateReleasesCreate: typeof dbMock.orm.CrateReleases.create;
let mockTransaction: typeof dbMock.db.transaction;
let mockGetPrependSortOrder: jest.MockedFunction<
  LayoutModule["getPrependCrateLayoutSortOrderForCrate"]
>;
let mockAudit: jest.MockedFunction<ApiHelpersModule["auditDatabaseOperation"]>;

const USER_ID = 42;
const CRATE_ID = "default-crate-id";

const verifiedUser = verifiedDiscogsUserFactory.asVerifiedResult({
  userId: USER_ID,
  username: "crate-digger",
});

const defaultCrate = crateFactory.defaultTestCrate({
  id: CRATE_ID,
  user_id: USER_ID,
});

const createPostRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/crates/migrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

beforeAll(async () => {
  const [routeModule, apiHelpers, layout] = await Promise.all([
    import("src/app/api/crates/migrate/route"),
    import("src/lib/api-helpers"),
    import("src/lib/crate-layout.server"),
  ]);

  POST = routeModule.POST;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockCratesFirst = dbMock.orm.Crates.first;
  mockCrateReleasesAll = dbMock.orm.CrateReleases.all;
  mockCrateReleasesCreate = dbMock.orm.CrateReleases.create;
  mockTransaction = dbMock.db.transaction;
  mockGetPrependSortOrder = jest.mocked(
    layout.getPrependCrateLayoutSortOrderForCrate,
  );
  mockAudit = jest.mocked(apiHelpers.auditDatabaseOperation);
});

describe("POST /api/crates/migrate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockCratesFirst.mockResolvedValue({ id: defaultCrate.id });
    mockCrateReleasesAll.mockResolvedValue([]);
    mockGetPrependSortOrder.mockResolvedValue(1000);
    mockCrateReleasesCreate.mockResolvedValue({});
    mockTransaction.mockImplementation(async (callback) =>
      callback({ orm: { public: dbMock.orm } }),
    );
  });

  it("returns auth error when user is not verified", async () => {
    mockGetVerifiedUser.mockResolvedValue({
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const response = await POST(
      createPostRequest({
        releases: [releaseFactory.withDisplayDefaults()],
      }),
    );

    expect(response.status).toBe(401);
    expect(mockCratesFirst).not.toHaveBeenCalled();
  });

  it("imports legacy releases into the default crate", async () => {
    const release = releaseFactory.withDisplayDefaults();

    const response = await POST(
      createPostRequest({
        releases: [release],
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      crateId: CRATE_ID,
      importedCount: 1,
      skippedCount: 0,
    });
    expect(dbMock.orm.Crates.where).toHaveBeenCalledWith({
      userId: USER_ID,
      isDefault: true,
    });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockCrateReleasesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        crateId: CRATE_ID,
        instanceId: release.instance_id,
      }),
    );
    expect(mockAudit).toHaveBeenCalledWith(
      USER_ID,
      "CrateRelease",
      "create",
      CRATE_ID,
      expect.objectContaining({
        legacy_migration: true,
        imported_count: 1,
      }),
    );
  });

  it("skips releases already present in the default crate", async () => {
    const release = releaseFactory.withDisplayDefaults();

    mockCrateReleasesAll.mockResolvedValue([
      {
        instanceId: release.instance_id,
      },
    ]);

    const response = await POST(
      createPostRequest({
        releases: [release],
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      crateId: CRATE_ID,
      importedCount: 0,
      skippedCount: 1,
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
