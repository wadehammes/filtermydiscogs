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
import { createCrateResponseFactory } from "src/tests/factories/CreateCrateResponse.factory";
import { verifiedDiscogsUserFactory } from "src/tests/factories/VerifiedDiscogsUser.factory";
import { createDbModuleMock } from "src/tests/mocks/mockDb";
import type { Crate } from "src/types/crate.types";

const dbMock = createDbModuleMock();

jest.mock("src/lib/db", () => dbMock);

jest.mock("src/lib/crate-preview.server", () => ({
  fetchCratePreviewThumbs: jest.fn(async () => new Map()),
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
  createPaginatedResponse: <T>(
    data: T[],
    total: number,
    page: number,
    pageSize: number,
  ) => {
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  },
}));

type RouteModule = typeof import("src/app/api/crates/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");

let GET: RouteModule["GET"];
let POST: RouteModule["POST"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockCountRows: typeof dbMock.countRows;
let mockCratesAll: typeof dbMock.orm.Crates.all;
let mockCratesFirst: typeof dbMock.orm.Crates.first;
let mockCratesCreate: typeof dbMock.orm.Crates.create;
let mockAudit: jest.MockedFunction<ApiHelpersModule["auditDatabaseOperation"]>;

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

const buildCrateWithCountRow = (
  crate: ReturnType<typeof crateFactory.build>,
  releaseCount = 0,
) => ({
  ...toOrmCrate(crate),
  crateReleases: releaseCount,
});

const createGetRequest = (search = "") =>
  new NextRequest(`http://localhost/api/crates${search}`);

const createPostRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/crates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeAll(async () => {
  const [routeModule, apiHelpers] = await Promise.all([
    import("src/app/api/crates/route"),
    import("src/lib/api-helpers"),
  ]);

  GET = routeModule.GET;
  POST = routeModule.POST;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockCountRows = dbMock.countRows;
  mockCratesAll = dbMock.orm.Crates.all;
  mockCratesFirst = dbMock.orm.Crates.first;
  mockCratesCreate = dbMock.orm.Crates.create;
  mockAudit = jest.mocked(apiHelpers.auditDatabaseOperation);
});

describe("GET /api/crates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
  });

  it("returns paginated crates with release counts", async () => {
    const crate = crateFactory.defaultTestCrate({ user_id: USER_ID });
    mockCountRows.mockResolvedValue(1);
    mockCratesAll.mockResolvedValue([buildCrateWithCountRow(crate)]);

    const response = await GET(createGetRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          user_id: crate.user_id,
          id: crate.id,
          name: crate.name,
          username: crate.username,
          is_default: crate.is_default,
          private: crate.private,
          packed_enabled: crate.packed_enabled,
          notes: crate.notes,
          created_at: crate.created_at.toISOString(),
          updated_at: crate.updated_at.toISOString(),
          releaseCount: 0,
          previewThumbs: [],
        },
      ],
      pagination: {
        page: 1,
        pageSize: 50,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  });

  it("creates a default crate when the user has none", async () => {
    const defaultCrate = crateFactory.defaultTestCrate({
      user_id: USER_ID,
      name: "My Crate",
      is_default: true,
    });

    mockCountRows.mockResolvedValue(0);
    mockCratesAll.mockResolvedValue([]);
    mockCratesCreate.mockResolvedValue(toOrmCrate(defaultCrate));

    const response = await GET(createGetRequest());

    expect(mockCratesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        name: "My Crate",
        isDefault: true,
        username: USERNAME,
      }),
    );
    await expect(response.json()).resolves.toEqual({
      data: [
        expect.objectContaining({
          name: "My Crate",
          is_default: true,
          releaseCount: 0,
          previewThumbs: [],
        }),
      ],
      pagination: {
        page: 1,
        pageSize: 1,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  });

  it("returns auth error when user is not verified", async () => {
    mockGetVerifiedUser.mockResolvedValue({ error: createUnauthorizedError() });

    const response = await GET(createGetRequest());

    expect(response.status).toBe(401);
  });
});

describe("POST /api/crates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockCratesFirst.mockResolvedValue(null);
  });

  it("creates a crate and returns 201", async () => {
    const created = createCrateResponseFactory.named("New Shelf", {
      user_id: USER_ID,
    }).crate;
    mockCratesCreate.mockResolvedValue(toOrmCrate(created));

    const response = await POST(createPostRequest({ name: "New Shelf" }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      crate: {
        ...created,
        created_at: created.created_at.toISOString(),
        updated_at: created.updated_at.toISOString(),
      },
    });
    expect(mockAudit).toHaveBeenCalledWith(
      USER_ID,
      "Crate",
      "create",
      expect.any(String),
      { name: "New Shelf" },
    );
  });

  it("returns 400 when crate name is missing", async () => {
    const response = await POST(createPostRequest({ name: "   " }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Crate name is required",
    });
    expect(mockCratesCreate).not.toHaveBeenCalled();
  });

  it("returns 409 when a crate with the same name already exists", async () => {
    mockCratesFirst.mockResolvedValue(
      toOrmCrate(
        crateFactory.build({ id: "existing-crate", user_id: USER_ID }),
      ),
    );

    const response = await POST(createPostRequest({ name: "Duplicates" }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "A crate with this name already exists",
    });
    expect(mockCratesCreate).not.toHaveBeenCalled();
  });

  it("returns auth error when user is not verified", async () => {
    mockGetVerifiedUser.mockResolvedValue({ error: createUnauthorizedError() });

    const response = await POST(createPostRequest({ name: "New Shelf" }));

    expect(response.status).toBe(401);
  });
});
