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

jest.mock("src/lib/db", () => dbMock);

jest.mock("src/lib/crate-layout.server", () => ({
  getPrependCrateLayoutSortOrderForCrate: jest.fn(async () => 1000),
}));

jest.mock("src/lib/release-data-validation", () => ({
  validateReleaseDataForStorage: jest.fn(),
}));

jest.mock("src/lib/api-helpers", () => ({
  getVerifiedUserFromRequestWithRateLimit: jest.fn(),
  createErrorResponse: jest.fn((error: unknown) =>
    NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    ),
  ),
  auditDatabaseOperation: jest.fn(),
}));

type RouteModule =
  typeof import("src/app/api/crates/membership/[instanceId]/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type ReleaseValidationModule = typeof import("src/lib/release-data-validation");

let GET: RouteModule["GET"];
let PUT: RouteModule["PUT"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockCrateReleasesAll: typeof dbMock.orm.CrateReleases.all;
let mockCratesAll: typeof dbMock.orm.Crates.all;
let mockCrateReleasesDeleteAndCount: typeof dbMock.orm.CrateReleases.deleteAndCount;
let mockCrateReleasesCreate: typeof dbMock.orm.CrateReleases.create;
let mockTransaction: typeof dbMock.db.transaction;
let mockValidateRelease: jest.MockedFunction<
  ReleaseValidationModule["validateReleaseDataForStorage"]
>;

const INSTANCE_ID = "12345";
const USER_ID = 42;

const releasePayload = {
  instance_id: INSTANCE_ID,
  basic_information: {
    id: 1,
    title: "Test Release",
  },
};

beforeAll(async () => {
  const [routeModule, apiHelpers, releaseValidation] = await Promise.all([
    import("src/app/api/crates/membership/[instanceId]/route"),
    import("src/lib/api-helpers"),
    import("src/lib/release-data-validation"),
  ]);

  GET = routeModule.GET;
  PUT = routeModule.PUT;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockCrateReleasesAll = dbMock.orm.CrateReleases.all;
  mockCratesAll = dbMock.orm.Crates.all;
  mockCrateReleasesDeleteAndCount = dbMock.orm.CrateReleases.deleteAndCount;
  mockCrateReleasesCreate = dbMock.orm.CrateReleases.create;
  mockTransaction = dbMock.db.transaction;
  mockValidateRelease = jest.mocked(
    releaseValidation.validateReleaseDataForStorage,
  );
});

describe("GET /api/crates/membership/[instanceId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      const headers = new Headers(init?.headers);

      return {
        status: init?.status ?? 200,
        headers,
        json: async () => body,
      } as NextResponse;
    });
  });

  it("returns auth error when user is not verified", async () => {
    mockGetVerifiedUser.mockResolvedValue({
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const response = await GET(
      new NextRequest(`http://localhost/api/crates/membership/${INSTANCE_ID}`),
      { params: Promise.resolve({ instanceId: INSTANCE_ID }) },
    );

    expect(response.status).toBe(401);
    expect(mockCrateReleasesAll).not.toHaveBeenCalled();
  });

  it("returns crate ids containing the release", async () => {
    mockGetVerifiedUser.mockResolvedValue({
      user: verifiedDiscogsUserFactory.defaults({ userId: USER_ID }),
    });
    mockCrateReleasesAll.mockResolvedValue([
      { crateId: "crate-a" },
      { crateId: "crate-b" },
    ]);

    const response = await GET(
      new NextRequest(`http://localhost/api/crates/membership/${INSTANCE_ID}`),
      { params: Promise.resolve({ instanceId: INSTANCE_ID }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      crateIds: ["crate-a", "crate-b"],
    });
    expect(dbMock.orm.CrateReleases.where).toHaveBeenCalledWith({
      userId: USER_ID,
      instanceId: INSTANCE_ID,
    });
  });
});

describe("PUT /api/crates/membership/[instanceId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      const headers = new Headers(init?.headers);

      return {
        status: init?.status ?? 200,
        headers,
        json: async () => body,
      } as NextResponse;
    });

    mockGetVerifiedUser.mockResolvedValue({
      user: verifiedDiscogsUserFactory.defaults({ userId: USER_ID }),
    });
    mockValidateRelease.mockReturnValue({
      release: releasePayload as never,
    });
    mockCratesAll.mockResolvedValue([{ id: "crate-a" }, { id: "crate-b" }]);
    mockCrateReleasesAll.mockResolvedValue([{ crateId: "crate-a" }]);
    mockCrateReleasesDeleteAndCount.mockResolvedValue(0);
    mockCrateReleasesCreate.mockResolvedValue({});
    mockTransaction.mockImplementation(async (callback) =>
      callback({ orm: { public: dbMock.orm } }),
    );
  });

  it("returns auth error when user is not verified", async () => {
    mockGetVerifiedUser.mockResolvedValue({
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const response = await PUT(
      new NextRequest(`http://localhost/api/crates/membership/${INSTANCE_ID}`, {
        method: "PUT",
        body: JSON.stringify({
          crateIds: ["crate-a"],
          release: releasePayload,
        }),
      }),
      { params: Promise.resolve({ instanceId: INSTANCE_ID }) },
    );

    expect(response.status).toBe(401);
  });

  it("sets membership to the requested crate ids", async () => {
    const response = await PUT(
      new NextRequest(`http://localhost/api/crates/membership/${INSTANCE_ID}`, {
        method: "PUT",
        body: JSON.stringify({
          crateIds: ["crate-a", "crate-b"],
          release: releasePayload,
        }),
      }),
      { params: Promise.resolve({ instanceId: INSTANCE_ID }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      crateIds: ["crate-a", "crate-b"],
    });
    expect(mockTransaction).toHaveBeenCalled();
    expect(mockCrateReleasesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        crateId: "crate-b",
        instanceId: INSTANCE_ID,
      }),
    );
  });
});
