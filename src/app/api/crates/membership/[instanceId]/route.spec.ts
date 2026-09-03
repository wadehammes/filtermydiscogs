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

jest.mock("src/lib/db", () => ({
  prisma: {
    crateRelease: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    crate: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("src/lib/crate-layout.server", () => ({
  getPrependCrateLayoutSortOrderForCrate: jest.fn(),
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
type DbModule = typeof import("src/lib/db");
type ReleaseValidationModule = typeof import("src/lib/release-data-validation");

let GET: RouteModule["GET"];
let PUT: RouteModule["PUT"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockFindMany: jest.MockedFunction<
  DbModule["prisma"]["crateRelease"]["findMany"]
>;
let mockFindCrates: jest.MockedFunction<
  DbModule["prisma"]["crate"]["findMany"]
>;
let mockTransaction: jest.MockedFunction<DbModule["prisma"]["$transaction"]>;
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
  const [routeModule, apiHelpers, db, releaseValidation] = await Promise.all([
    import("src/app/api/crates/membership/[instanceId]/route"),
    import("src/lib/api-helpers"),
    import("src/lib/db"),
    import("src/lib/release-data-validation"),
  ]);

  GET = routeModule.GET;
  PUT = routeModule.PUT;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockFindMany = jest.mocked(db.prisma.crateRelease.findMany);
  mockFindCrates = jest.mocked(db.prisma.crate.findMany);
  mockTransaction = jest.mocked(db.prisma.$transaction);
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
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("returns crate ids containing the release", async () => {
    mockGetVerifiedUser.mockResolvedValue({
      user: verifiedDiscogsUserFactory.defaults({ userId: USER_ID }),
    });
    mockFindMany.mockResolvedValue([
      { crate_id: "crate-a" },
      { crate_id: "crate-b" },
    ] as Awaited<ReturnType<DbModule["prisma"]["crateRelease"]["findMany"]>>);

    const response = await GET(
      new NextRequest(`http://localhost/api/crates/membership/${INSTANCE_ID}`),
      { params: Promise.resolve({ instanceId: INSTANCE_ID }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      crateIds: ["crate-a", "crate-b"],
    });
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        user_id: USER_ID,
        instance_id: INSTANCE_ID,
      },
      select: {
        crate_id: true,
      },
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
    mockFindCrates.mockResolvedValue([
      { id: "crate-a" },
      { id: "crate-b" },
    ] as Awaited<ReturnType<DbModule["prisma"]["crate"]["findMany"]>>);
    mockFindMany.mockResolvedValue([{ crate_id: "crate-a" }] as Awaited<
      ReturnType<DbModule["prisma"]["crateRelease"]["findMany"]>
    >);
    mockTransaction.mockImplementation((async (
      callback: (tx: unknown) => Promise<unknown>,
    ) =>
      callback({
        crateRelease: {
          deleteMany: jest.fn(),
          create: jest.fn(),
        },
      })) as DbModule["prisma"]["$transaction"]);
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
  });
});
