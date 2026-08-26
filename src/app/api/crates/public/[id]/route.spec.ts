import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { createDbModuleMock } from "src/tests/mocks/mockDb";

const dbMock = createDbModuleMock();

jest.mock("src/lib/public-crate-query.server", () => ({
  findPublicCrateById: jest.fn(),
}));

jest.mock("src/lib/ip-rate-limit", () => ({
  getIpRateLimitResponse: jest.fn(() => null),
  PUBLIC_CRATE_RATE_LIMIT_CONFIG: {},
}));

jest.mock("src/lib/auth-request", () => ({
  getOptionalVerifiedUserFromRequest: jest.fn(),
}));

jest.mock("src/lib/crate-layout-query.server", () => ({
  findCrateReleasesForLayout: jest.fn(),
}));

jest.mock("src/lib/db", () => dbMock);

type RouteModule = typeof import("src/app/api/crates/public/[id]/route");
type PublicCrateQueryModule =
  typeof import("src/lib/public-crate-query.server");
type AuthRequestModule = typeof import("src/lib/auth-request");
type LayoutQueryModule = typeof import("src/lib/crate-layout-query.server");

const PUBLIC_CRATE_ID = "11111111-2222-3333-4444-555555555555";

const publicCrateRow = {
  userId: 123,
  id: PUBLIC_CRATE_ID,
  name: "Public Crate",
  username: "public-user",
  isDefault: true,
  private: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

let GET: RouteModule["GET"];
let mockFindPublicCrateById: jest.MockedFunction<
  PublicCrateQueryModule["findPublicCrateById"]
>;
let mockGetOptionalVerifiedUser: jest.MockedFunction<
  AuthRequestModule["getOptionalVerifiedUserFromRequest"]
>;
let mockFindCrateReleasesForLayout: jest.MockedFunction<
  LayoutQueryModule["findCrateReleasesForLayout"]
>;

beforeAll(async () => {
  const [routeModule, publicCrateQuery, authRequest, layoutQuery] =
    await Promise.all([
      import("src/app/api/crates/public/[id]/route"),
      import("src/lib/public-crate-query.server"),
      import("src/lib/auth-request"),
      import("src/lib/crate-layout-query.server"),
    ]);

  GET = routeModule.GET;
  mockFindPublicCrateById = jest.mocked(publicCrateQuery.findPublicCrateById);
  mockGetOptionalVerifiedUser = jest.mocked(
    authRequest.getOptionalVerifiedUserFromRequest,
  );
  mockFindCrateReleasesForLayout = jest.mocked(
    layoutQuery.findCrateReleasesForLayout,
  );
});

describe("GET /api/crates/public/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetOptionalVerifiedUser.mockResolvedValue(null);
    dbMock.countRows.mockResolvedValue(0);
    mockFindCrateReleasesForLayout.mockResolvedValue([]);
  });

  it("returns 400 for invalid crate ids", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/crates/public/not-a-uuid"),
      {
        params: Promise.resolve({ id: "not-a-uuid" }),
      },
    );

    expect(response.status).toBe(400);
    expect(mockFindPublicCrateById).not.toHaveBeenCalled();
  });

  it("returns 404 when the crate is private or missing", async () => {
    mockFindPublicCrateById.mockResolvedValue(null);

    const response = await GET(
      new NextRequest(`http://localhost/api/crates/public/${PUBLIC_CRATE_ID}`),
      { params: Promise.resolve({ id: PUBLIC_CRATE_ID }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Crate not found or is private",
    });
  });

  it("returns public crate payload when the crate is public", async () => {
    mockFindPublicCrateById.mockResolvedValue(publicCrateRow);

    const response = await GET(
      new NextRequest(`http://localhost/api/crates/public/${PUBLIC_CRATE_ID}`),
      { params: Promise.resolve({ id: PUBLIC_CRATE_ID }) },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.crate.id).toBe(PUBLIC_CRATE_ID);
    expect(body.crate.private).toBe(false);
  });
});
