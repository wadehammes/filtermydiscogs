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
import type { DiscogsRelease } from "src/types";

jest.mock("src/lib/db", () => ({
  prisma: {
    crateRelease: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("src/lib/api-helpers", () => ({
  getVerifiedUserFromRequestWithRateLimit: jest.fn(),
  sanitizeError: jest.fn((error: unknown) => ({
    status: error instanceof Error ? 500 : 500,
  })),
}));

type RouteModule = typeof import("src/app/api/dashboard/most-crated/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type DbModule = typeof import("src/lib/db");

let GET: RouteModule["GET"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockFindMany: jest.MockedFunction<
  DbModule["prisma"]["crateRelease"]["findMany"]
>;

const USER_ID = 42;

const buildCrateReleaseRow = (release: DiscogsRelease, crateId: string) => ({
  user_id: USER_ID,
  crate_id: crateId,
  instance_id: String(release.instance_id),
  release_data: release,
  added_at: new Date("2024-01-01T00:00:00.000Z"),
  found_at: null,
  sort_order: 0,
});

const createRequest = (limit?: number) => {
  const params = limit !== undefined ? `?limit=${limit}` : "";

  return new NextRequest(`http://localhost/api/dashboard/most-crated${params}`);
};

beforeAll(async () => {
  const [routeModule, apiHelpers, db] = await Promise.all([
    import("src/app/api/dashboard/most-crated/route"),
    import("src/lib/api-helpers"),
    import("src/lib/db"),
  ]);

  GET = routeModule.GET;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockFindMany = jest.mocked(db.prisma.crateRelease.findMany);
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

    mockFindMany.mockResolvedValue([
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

    mockFindMany.mockResolvedValue([buildCrateReleaseRow(release, "crate-a")]);

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
