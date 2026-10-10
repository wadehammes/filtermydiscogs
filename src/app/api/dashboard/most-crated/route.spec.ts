import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { verifiedDiscogsUserFactory } from "src/tests/factories/VerifiedDiscogsUser.factory";

jest.mock("src/lib/dashboard-most-crated.server", () => ({
  fetchMostCratedReleasesForUser: jest.fn(),
}));

jest.mock("src/lib/api-helpers");

type RouteModule = typeof import("src/app/api/dashboard/most-crated/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type DashboardMostCratedModule =
  typeof import("src/lib/dashboard-most-crated.server");

let GET: RouteModule["GET"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockFetchMostCrated: jest.MockedFunction<
  DashboardMostCratedModule["fetchMostCratedReleasesForUser"]
>;

const USER_ID = 42;

const createRequest = (limit?: number) => {
  const params = limit !== undefined ? `?limit=${limit}` : "";

  return new NextRequest(`http://localhost/api/dashboard/most-crated${params}`);
};

beforeAll(async () => {
  const [routeModule, apiHelpers, dashboardMostCrated] = await Promise.all([
    import("src/app/api/dashboard/most-crated/route"),
    import("src/lib/api-helpers"),
    import("src/lib/dashboard-most-crated.server"),
  ]);

  GET = routeModule.GET;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockFetchMostCrated = jest.mocked(
    dashboardMostCrated.fetchMostCratedReleasesForUser,
  );
});

describe("GET /api/dashboard/most-crated", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(
      verifiedDiscogsUserFactory.asVerifiedResult({
        userId: USER_ID,
        username: "crate-digger",
      }),
    );
  });

  it("returns releases that appear in multiple crates sorted by count", async () => {
    const release = releaseFactory.withDisplayDefaults();
    const payload = [
      {
        instance_id: String(release.instance_id),
        crate_count: 2,
        release,
      },
    ];

    mockFetchMostCrated.mockResolvedValue(payload);

    const response = await GET(createRequest(10));

    expect(response.status).toBe(200);
    expect(mockFetchMostCrated).toHaveBeenCalledWith(USER_ID, 10);
    await expect(response.json()).resolves.toEqual({ releases: payload });
  });

  it("returns an empty list when no releases appear in multiple crates", async () => {
    mockFetchMostCrated.mockResolvedValue([]);

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    expect(mockFetchMostCrated).toHaveBeenCalledWith(USER_ID, 10);
    await expect(response.json()).resolves.toEqual({ releases: [] });
  });

  it("returns auth error when verification fails", async () => {
    mockGetVerifiedUser.mockResolvedValue({
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    });

    const response = await GET(createRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Not authenticated",
    });
    expect(mockFetchMostCrated).not.toHaveBeenCalled();
  });
});
