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
import { crateReleaseFactory } from "src/tests/factories/CrateRelease.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { verifiedDiscogsUserFactory } from "src/tests/factories/VerifiedDiscogsUser.factory";
import { runPrismaTransactionWith } from "src/tests/mocks/runPrismaTransactionWith";

const mockTransaction = jest.fn();

jest.mock("src/lib/db", () => ({
  prisma: {
    crate: {
      findFirst: jest.fn(),
    },
    crateRelease: {
      findMany: jest.fn(),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

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
type DbModule = typeof import("src/lib/db");
type LayoutModule = typeof import("src/lib/crate-layout.server");

let POST: RouteModule["POST"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockFindFirst: jest.MockedFunction<
  DbModule["prisma"]["crate"]["findFirst"]
>;
let mockReleaseFindMany: jest.MockedFunction<
  DbModule["prisma"]["crateRelease"]["findMany"]
>;
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
  const [routeModule, apiHelpers, db, layout] = await Promise.all([
    import("src/app/api/crates/migrate/route"),
    import("src/lib/api-helpers"),
    import("src/lib/db"),
    import("src/lib/crate-layout.server"),
  ]);

  POST = routeModule.POST;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockFindFirst = jest.mocked(db.prisma.crate.findFirst);
  mockReleaseFindMany = jest.mocked(db.prisma.crateRelease.findMany);
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
    mockFindFirst.mockResolvedValue(defaultCrate);
    mockReleaseFindMany.mockResolvedValue([]);
    mockGetPrependSortOrder.mockResolvedValue(1000);
    runPrismaTransactionWith(mockTransaction, {
      crateRelease: {
        create: jest.fn(async () => ({})),
      },
    });
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
    expect(mockFindFirst).not.toHaveBeenCalled();
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
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: USER_ID },
        orderBy: [{ is_default: "desc" }, { name: "asc" }],
      }),
    );
    expect(mockTransaction).toHaveBeenCalledTimes(1);
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

    mockReleaseFindMany.mockResolvedValue([
      crateReleaseFactory.forInstance(release.instance_id, {
        crate_id: CRATE_ID,
        user_id: USER_ID,
      }),
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
