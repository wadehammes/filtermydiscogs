import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { adminUserLookupStatsFactory } from "src/tests/factories/AdminUserLookupStats.factory";

jest.mock("src/lib/admin-helpers", () => ({
  verifyAdminFromRequest: jest.fn(),
}));

jest.mock("src/lib/admin-user-lookup.server", () => ({
  getAdminUserLookup: jest.fn(),
}));

type RouteModule = typeof import("src/app/api/admin/users/[username]/route");
type AdminHelpersModule = typeof import("src/lib/admin-helpers");
type AdminUserLookupModule = typeof import("src/lib/admin-user-lookup.server");

let GET: RouteModule["GET"];
let mockVerifyAdminFromRequest: jest.MockedFunction<
  AdminHelpersModule["verifyAdminFromRequest"]
>;
let mockGetAdminUserLookup: jest.MockedFunction<
  AdminUserLookupModule["getAdminUserLookup"]
>;

const USERNAME = "sloanre";

const lookupResult = adminUserLookupStatsFactory.forUsername(USERNAME);

beforeAll(async () => {
  const [routeModule, adminHelpers, adminUserLookup] = await Promise.all([
    import("src/app/api/admin/users/[username]/route"),
    import("src/lib/admin-helpers"),
    import("src/lib/admin-user-lookup.server"),
  ]);

  GET = routeModule.GET;
  mockVerifyAdminFromRequest = jest.mocked(adminHelpers.verifyAdminFromRequest);
  mockGetAdminUserLookup = jest.mocked(adminUserLookup.getAdminUserLookup);
});

describe("GET /api/admin/users/[username]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
  });

  it("returns lookup stats for admin users", async () => {
    mockVerifyAdminFromRequest.mockResolvedValue(true);
    mockGetAdminUserLookup.mockResolvedValue(lookupResult);

    const request = new NextRequest(
      `http://localhost/api/admin/users/${USERNAME}`,
    );

    const response = await GET(request, {
      params: Promise.resolve({ username: USERNAME }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(lookupResult);
    expect(mockGetAdminUserLookup).toHaveBeenCalledWith(USERNAME);
  });

  it("returns 403 for non-admin users", async () => {
    mockVerifyAdminFromRequest.mockResolvedValue(false);

    const request = new Request(
      `http://localhost/api/admin/users/${USERNAME}`,
    ) as NextRequest;

    const response = await GET(request, {
      params: Promise.resolve({ username: USERNAME }),
    });

    expect(response.status).toBe(403);
    expect(mockGetAdminUserLookup).not.toHaveBeenCalled();
  });

  it("returns 404 when the user is not found", async () => {
    mockVerifyAdminFromRequest.mockResolvedValue(true);
    mockGetAdminUserLookup.mockResolvedValue(null);

    const request = new NextRequest(
      `http://localhost/api/admin/users/${USERNAME}`,
    );

    const response = await GET(request, {
      params: Promise.resolve({ username: USERNAME }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "User not found" });
  });
});
