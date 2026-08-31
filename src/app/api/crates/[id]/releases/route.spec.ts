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
    crate: {
      findUnique: jest.fn(),
    },
    crateRelease: {
      updateMany: jest.fn(),
    },
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

type RouteModule = typeof import("src/app/api/crates/[id]/releases/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type DbModule = typeof import("src/lib/db");

let PATCH: RouteModule["PATCH"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockFindUnique: jest.MockedFunction<
  DbModule["prisma"]["crate"]["findUnique"]
>;
let mockUpdateMany: jest.MockedFunction<
  DbModule["prisma"]["crateRelease"]["updateMany"]
>;
let mockAudit: jest.MockedFunction<ApiHelpersModule["auditDatabaseOperation"]>;

const CRATE_ID = "crate-1";
const USER_ID = 42;

const createPatchRequest = (body: unknown) =>
  new NextRequest(`http://localhost/api/crates/${CRATE_ID}/releases`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

beforeAll(async () => {
  const [routeModule, apiHelpers, db] = await Promise.all([
    import("src/app/api/crates/[id]/releases/route"),
    import("src/lib/api-helpers"),
    import("src/lib/db"),
  ]);

  PATCH = routeModule.PATCH;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockFindUnique = jest.mocked(db.prisma.crate.findUnique);
  mockUpdateMany = jest.mocked(db.prisma.crateRelease.updateMany);
  mockAudit = jest.mocked(apiHelpers.auditDatabaseOperation);
});

describe("PATCH /api/crates/[id]/releases", () => {
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

    const response = await PATCH(createPatchRequest({ clear_found: true }), {
      params: Promise.resolve({ id: CRATE_ID }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("returns 400 when clear_found is not true", async () => {
    mockGetVerifiedUser.mockResolvedValue(
      verifiedDiscogsUserFactory.asVerifiedResult({
        userId: USER_ID,
        username: "crate-digger",
      }),
    );

    const response = await PATCH(createPatchRequest({ clear_found: false }), {
      params: Promise.resolve({ id: CRATE_ID }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "clear_found must be true",
    });
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when crate is not found", async () => {
    mockGetVerifiedUser.mockResolvedValue(
      verifiedDiscogsUserFactory.asVerifiedResult({
        userId: USER_ID,
        username: "crate-digger",
      }),
    );
    mockFindUnique.mockResolvedValue(null);

    const response = await PATCH(createPatchRequest({ clear_found: true }), {
      params: Promise.resolve({ id: CRATE_ID }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Crate not found",
    });
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("clears packed status for all releases in the crate", async () => {
    mockGetVerifiedUser.mockResolvedValue(
      verifiedDiscogsUserFactory.asVerifiedResult({
        userId: USER_ID,
        username: "crate-digger",
      }),
    );
    mockFindUnique.mockResolvedValue({ id: CRATE_ID } as Awaited<
      ReturnType<DbModule["prisma"]["crate"]["findUnique"]>
    >);
    mockUpdateMany.mockResolvedValue({ count: 3 });

    const response = await PATCH(createPatchRequest({ clear_found: true }), {
      params: Promise.resolve({ id: CRATE_ID }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      cleared_count: 3,
    });
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: {
        user_id_id: {
          user_id: USER_ID,
          id: CRATE_ID,
        },
      },
      select: { id: true },
    });
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: {
        user_id: USER_ID,
        crate_id: CRATE_ID,
        found_at: { not: null },
      },
      data: {
        found_at: null,
      },
    });
    expect(mockAudit).toHaveBeenCalledWith(
      USER_ID,
      "CrateRelease",
      "update",
      CRATE_ID,
      {
        crate_id: CRATE_ID,
        clear_found: true,
        cleared_count: 3,
      },
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "private, no-store, no-cache, must-revalidate, proxy-revalidate",
    );
  });
});
