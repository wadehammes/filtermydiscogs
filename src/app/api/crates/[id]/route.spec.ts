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

let GET: RouteModule["GET"];
let PUT: RouteModule["PUT"];
let DELETE: RouteModule["DELETE"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockCratesFirst: typeof dbMock.orm.Crates.first;
let mockCratesUpdate: typeof dbMock.orm.Crates.update;
let mockCratesDelete: typeof dbMock.orm.Crates.delete;
let mockCountRows: typeof dbMock.countRows;
let mockCrateReleasesAll: typeof dbMock.orm.CrateReleases.all;
let mockCrateSetMarkersAll: typeof dbMock.orm.CrateSetMarkers.all;
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
  const [routeModule, apiHelpers] = await Promise.all([
    import("src/app/api/crates/[id]/route"),
    import("src/lib/api-helpers"),
  ]);

  GET = routeModule.GET;
  PUT = routeModule.PUT;
  DELETE = routeModule.DELETE;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockCratesFirst = dbMock.orm.Crates.first;
  mockCratesUpdate = dbMock.orm.Crates.update;
  mockCratesDelete = dbMock.orm.Crates.delete;
  mockCountRows = dbMock.countRows;
  mockCrateReleasesAll = dbMock.orm.CrateReleases.all;
  mockCrateSetMarkersAll = dbMock.orm.CrateSetMarkers.all;
  mockAudit = jest.mocked(apiHelpers.auditDatabaseOperation);
});

describe("GET /api/crates/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockCratesFirst.mockResolvedValue(toOrmCrate(defaultCrate));
    mockCountRows.mockResolvedValue(1);
    mockCrateReleasesAll.mockResolvedValue([
      {
        releaseData: releaseFactory.withDisplayDefaults(),
        foundAt: null,
        sortOrder: 1000,
      },
    ]);
    mockCrateSetMarkersAll.mockResolvedValue([]);
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
    mockCratesFirst.mockResolvedValue(null);

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
    mockCratesFirst.mockResolvedValue(null);

    const response = await GET(
      new NextRequest(`http://localhost/api/crates/${otherUserCrateId}`),
      { params: Promise.resolve({ id: otherUserCrateId }) },
    );

    expect(response.status).toBe(404);
    expect(dbMock.orm.Crates.where).toHaveBeenCalledWith({
      userId: 999,
      id: otherUserCrateId,
    });
  });
});

describe("PUT /api/crates/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockCratesFirst.mockResolvedValue(
      toOrmCrate(
        crateFactory.defaultTestCrate({
          id: CRATE_ID,
          user_id: USER_ID,
          name: "My Crate",
          is_default: true,
          private: false,
          packed_enabled: false,
        }),
      ),
    );
    mockCratesUpdate.mockResolvedValue(
      toOrmCrate(
        crateFactory.named("Renamed Crate", { id: CRATE_ID, user_id: USER_ID }),
      ),
    );
  });

  it("updates a crate name", async () => {
    mockCratesFirst
      .mockResolvedValueOnce(
        toOrmCrate(
          crateFactory.defaultTestCrate({
            id: CRATE_ID,
            user_id: USER_ID,
            name: "My Crate",
            is_default: true,
            private: false,
            packed_enabled: false,
          }),
        ),
      )
      .mockResolvedValueOnce(null);

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
    mockCratesFirst
      .mockResolvedValueOnce(
        toOrmCrate(
          crateFactory.defaultTestCrate({
            id: CRATE_ID,
            user_id: USER_ID,
            name: "My Crate",
            is_default: true,
            private: false,
            packed_enabled: false,
          }),
        ),
      )
      .mockResolvedValueOnce(
        toOrmCrate(crateFactory.build({ id: "other-crate", user_id: USER_ID })),
      );

    const response = await PUT(createPutRequest({ name: "Duplicates" }), {
      params: Promise.resolve({ id: CRATE_ID }),
    });

    expect(response.status).toBe(409);
    expect(mockCratesUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when is_default is not a boolean", async () => {
    const response = await PUT(createPutRequest({ is_default: "yes" }), {
      params: Promise.resolve({ id: CRATE_ID }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "is_default must be a boolean",
    });
    expect(mockCratesUpdate).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/crates/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockCountRows.mockResolvedValueOnce(2).mockResolvedValueOnce(3);
    mockCratesDelete.mockResolvedValue(toOrmCrate(defaultCrate));
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
    mockCountRows.mockReset();
    mockCountRows.mockResolvedValue(1);

    const response = await DELETE(createDeleteRequest(), {
      params: Promise.resolve({ id: CRATE_ID }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Cannot delete the last remaining crate",
    });
    expect(mockCratesDelete).not.toHaveBeenCalled();
  });

  it("returns auth error when user is not verified", async () => {
    mockGetVerifiedUser.mockResolvedValue({ error: createUnauthorizedError() });

    const response = await DELETE(createDeleteRequest(), {
      params: Promise.resolve({ id: CRATE_ID }),
    });

    expect(response.status).toBe(401);
  });
});
