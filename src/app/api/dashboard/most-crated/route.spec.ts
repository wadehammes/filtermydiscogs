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
import { createDbModuleMock } from "src/tests/mocks/mockDb";
import type { DiscogsRelease } from "src/types";

const dbMock = createDbModuleMock();

jest.mock("src/lib/db", () => dbMock);

jest.mock("src/lib/api-helpers", () => ({
  getVerifiedUserFromRequestWithRateLimit: jest.fn(),
  sanitizeError: jest.fn((error: unknown) => ({
    status: error instanceof Error ? 500 : 500,
  })),
}));

type RouteModule = typeof import("src/app/api/dashboard/most-crated/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");

let GET: RouteModule["GET"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockCrateReleasesAll: typeof dbMock.orm.CrateReleases.all;

const USER_ID = 42;

const buildCrateReleaseRow = (release: DiscogsRelease, crateId: string) => ({
  userId: USER_ID,
  crateId,
  instanceId: String(release.instance_id),
  releaseData: release,
  addedAt: new Date("2024-01-01T00:00:00.000Z"),
  foundAt: null,
  sortOrder: 0,
});

const createRequest = (limit?: number) => {
  const params = limit !== undefined ? `?limit=${limit}` : "";

  return new NextRequest(`http://localhost/api/dashboard/most-crated${params}`);
};

beforeAll(async () => {
  const [routeModule, apiHelpers] = await Promise.all([
    import("src/app/api/dashboard/most-crated/route"),
    import("src/lib/api-helpers"),
  ]);

  GET = routeModule.GET;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockCrateReleasesAll = dbMock.orm.CrateReleases.all;
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

    mockCrateReleasesAll.mockResolvedValue([
      buildCrateReleaseRow(release, "crate-a"),
      buildCrateReleaseRow(release, "crate-b"),
      buildCrateReleaseRow(
        releaseFactory.withDisplayDefaults({ instance_id: "999" }),
        "crate-a",
      ),
    ]);

    const response = await GET(createRequest(10));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      releases: [
        {
          instance_id: String(release.instance_id),
          crate_count: 2,
          release,
        },
      ],
    });
  });

  it("returns an empty list when no releases appear in multiple crates", async () => {
    const release = releaseFactory.withDisplayDefaults();

    mockCrateReleasesAll.mockResolvedValue([
      buildCrateReleaseRow(release, "crate-a"),
    ]);

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
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
  });
});
