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

jest.mock("src/lib/db", () => ({
  prisma: {
    crate: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    crateRelease: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    crateSetMarker: {
      findMany: jest.fn(),
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
  getPaginationParams: (request: NextRequest) => {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10)),
    );

    return {
      skip: (page - 1) * pageSize,
      take: pageSize,
      page,
      pageSize,
    };
  },
}));

type RouteModule = typeof import("src/app/api/crates/[id]/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type DbModule = typeof import("src/lib/db");

let GET: RouteModule["GET"];
let PUT: RouteModule["PUT"];
let DELETE: RouteModule["DELETE"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockFindUnique: jest.MockedFunction<
  DbModule["prisma"]["crate"]["findUnique"]
>;
let mockFindFirst: jest.MockedFunction<
  DbModule["prisma"]["crate"]["findFirst"]
>;
let mockUpdate: jest.MockedFunction<DbModule["prisma"]["crate"]["update"]>;
let mockDelete: jest.MockedFunction<DbModule["prisma"]["crate"]["delete"]>;
let mockCrateCount: jest.MockedFunction<DbModule["prisma"]["crate"]["count"]>;
let mockReleaseCount: jest.MockedFunction<
  DbModule["prisma"]["crateRelease"]["count"]
>;
let mockReleaseFindMany: jest.MockedFunction<
  DbModule["prisma"]["crateRelease"]["findMany"]
>;
let mockMarkerFindMany: jest.MockedFunction<
  DbModule["prisma"]["crateSetMarker"]["findMany"]
>;
let mockAudit: jest.MockedFunction<ApiHelpersModule["auditDatabaseOperation"]>;

const CRATE_ID = "crate-1";
const USER_ID = 42;
const USERNAME = "crate-digger";

const verifiedUser = verifiedDiscogsUserFactory.asVerifiedResult({
  userId: USER_ID,
  username: USERNAME,
});

const createUnauthorizedError = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const defaultCrate = crateFactory.defaultTestCrate({
  id: CRATE_ID,
  user_id: USER_ID,
});

const createGetRequest = (search = "") =>
  new NextRequest(`http://localhost/api/crates/${CRATE_ID}${search}`);

const createPutRequest = (body: unknown) =>
  new NextRequest(`http://localhost/api/crates/${CRATE_ID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const createDeleteRequest = () =>
  new NextRequest(`http://localhost/api/crates/${CRATE_ID}`, {
    method: "DELETE",
  });

beforeAll(async () => {
  const [routeModule, apiHelpers, db] = await Promise.all([
    import("src/app/api/crates/[id]/route"),
    import("src/lib/api-helpers"),
    import("src/lib/db"),
  ]);

  GET = routeModule.GET;
  PUT = routeModule.PUT;
  DELETE = routeModule.DELETE;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockFindUnique = jest.mocked(db.prisma.crate.findUnique);
  mockFindFirst = jest.mocked(db.prisma.crate.findFirst);
  mockUpdate = jest.mocked(db.prisma.crate.update);
  mockDelete = jest.mocked(db.prisma.crate.delete);
  mockCrateCount = jest.mocked(db.prisma.crate.count);
  mockReleaseCount = jest.mocked(db.prisma.crateRelease.count);
  mockReleaseFindMany = jest.mocked(db.prisma.crateRelease.findMany);
  mockMarkerFindMany = jest.mocked(db.prisma.crateSetMarker.findMany);
  mockAudit = jest.mocked(apiHelpers.auditDatabaseOperation);
});

describe("GET /api/crates/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockFindUnique.mockResolvedValue(defaultCrate);
    mockReleaseCount.mockResolvedValue(1);
    mockReleaseFindMany.mockResolvedValue([
      {
        release_data: releaseFactory.withDisplayDefaults(),
        found_at: null,
        sort_order: 1000,
      },
    ] as Awaited<ReturnType<DbModule["prisma"]["crateRelease"]["findMany"]>>);
    mockMarkerFindMany.mockResolvedValue([]);
  });

  it("returns a crate with paginated releases", async () => {
    const response = await GET(createGetRequest(), {
      params: Promise.resolve({ id: CRATE_ID }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.crate.id).toBe(CRATE_ID);
    expect(body.releases).toHaveLength(1);
    expect(body.markers).toEqual([]);
    expect(body.pagination.total).toBe(1);
  });

  it("returns 404 when the crate does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);

    const response = await GET(createGetRequest(), {
      params: Promise.resolve({ id: CRATE_ID }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Crate not found",
    });
  });

  it("returns 404 when requesting another user's crate id", async () => {
    const otherUserCrateId = "22222222-3333-4444-5555-666666666666";
    mockGetVerifiedUser.mockResolvedValue(
      verifiedDiscogsUserFactory.asVerifiedResult({
        userId: 999,
        username: "other-user",
      }),
    );
    mockFindUnique.mockResolvedValue(null);

    const response = await GET(
      new NextRequest(`http://localhost/api/crates/${otherUserCrateId}`),
      { params: Promise.resolve({ id: otherUserCrateId }) },
    );

    expect(response.status).toBe(404);
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          user_id_id: {
            user_id: 999,
            id: otherUserCrateId,
          },
        },
      }),
    );
  });
});

describe("PUT /api/crates/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockFindUnique.mockResolvedValue(
      crateFactory.defaultTestCrate({
        id: CRATE_ID,
        user_id: USER_ID,
        name: "My Crate",
        is_default: true,
        private: false,
        packed_enabled: false,
      }),
    );
    mockFindFirst.mockResolvedValue(null);
    mockUpdate.mockResolvedValue(
      crateFactory.named("Renamed Crate", { id: CRATE_ID, user_id: USER_ID }),
    );
  });

  it("updates a crate name", async () => {
    const response = await PUT(createPutRequest({ name: "Renamed Crate" }), {
      params: Promise.resolve({ id: CRATE_ID }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      crate: expect.objectContaining({ name: "Renamed Crate" }),
    });
    expect(mockAudit).toHaveBeenCalled();
  });

  it("returns 409 when another crate already uses the name", async () => {
    mockFindFirst.mockResolvedValue(
      crateFactory.build({ id: "other-crate", user_id: USER_ID }),
    );

    const response = await PUT(createPutRequest({ name: "Duplicates" }), {
      params: Promise.resolve({ id: CRATE_ID }),
    });

    expect(response.status).toBe(409);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when is_default is not a boolean", async () => {
    const response = await PUT(createPutRequest({ is_default: "yes" }), {
      params: Promise.resolve({ id: CRATE_ID }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "is_default must be a boolean",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/crates/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockCrateCount.mockResolvedValue(2);
    mockReleaseCount.mockResolvedValue(3);
    mockDelete.mockResolvedValue(defaultCrate);
  });

  it("deletes a crate when others remain", async () => {
    const response = await DELETE(createDeleteRequest(), {
      params: Promise.resolve({ id: CRATE_ID }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockAudit).toHaveBeenCalledWith(
      USER_ID,
      "Crate",
      "delete",
      CRATE_ID,
      { releaseCount: 3 },
    );
  });

  it("returns 400 when deleting the last crate", async () => {
    mockCrateCount.mockResolvedValue(1);

    const response = await DELETE(createDeleteRequest(), {
      params: Promise.resolve({ id: CRATE_ID }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Cannot delete the last remaining crate",
    });
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("returns auth error when user is not verified", async () => {
    mockGetVerifiedUser.mockResolvedValue({ error: createUnauthorizedError() });

    const response = await DELETE(createDeleteRequest(), {
      params: Promise.resolve({ id: CRATE_ID }),
    });

    expect(response.status).toBe(401);
  });
});
