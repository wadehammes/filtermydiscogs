import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";

jest.mock("src/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

jest.mock("src/lib/api-helpers", () => ({
  getVerifiedUserFromRequestWithRateLimit: jest.fn(),
}));

type RouteModule = typeof import("src/app/api/user/preferences/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type DbModule = typeof import("src/lib/db");

let GET: RouteModule["GET"];
let PATCH: RouteModule["PATCH"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockFindUnique: jest.MockedFunction<
  DbModule["prisma"]["user"]["findUnique"]
>;
let mockUpsert: jest.MockedFunction<DbModule["prisma"]["user"]["upsert"]>;

const USER_ID = 42;
const USERNAME = "crate-digger";

const verifiedUser = {
  user: {
    userId: USER_ID,
    username: USERNAME,
  },
};

const defaultPreferences = userPreferencesFactory.defaults();

beforeAll(async () => {
  const [routeModule, apiHelpers, db] = await Promise.all([
    import("src/app/api/user/preferences/route"),
    import("src/lib/api-helpers"),
    import("src/lib/db"),
  ]);

  GET = routeModule.GET;
  PATCH = routeModule.PATCH;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockFindUnique = jest.mocked(db.prisma.user.findUnique);
  mockUpsert = jest.mocked(db.prisma.user.upsert);
});

describe("/api/user/preferences", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockFindUnique.mockResolvedValue({
      preferences: defaultPreferences,
    } as Awaited<ReturnType<DbModule["prisma"]["user"]["findUnique"]>>);
    mockUpsert.mockResolvedValue({
      preferences: userPreferencesFactory.build({
        ...defaultPreferences,
        theme: "dark",
      }),
    } as Awaited<ReturnType<DbModule["prisma"]["user"]["upsert"]>>);
  });

  it("GET returns stored preferences without writing", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/user/preferences"),
    );

    expect(response.status).toBe(200);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { discogs_user_id: USER_ID },
      select: { preferences: true },
    });
    expect(mockUpsert).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      preferences: defaultPreferences,
    });
  });

  it("GET returns defaults when the user row is missing", async () => {
    mockFindUnique.mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost/api/user/preferences"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      preferences: defaultPreferences,
    });
  });

  it("PATCH upserts merged preferences in one round trip", async () => {
    const response = await PATCH(
      new NextRequest("http://localhost/api/user/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme: "dark" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { discogs_user_id: USER_ID },
      create: {
        discogs_user_id: USER_ID,
        username: USERNAME,
        preferences: expect.objectContaining({ theme: "dark" }),
      },
      update: {
        username: USERNAME,
        preferences: expect.objectContaining({ theme: "dark" }),
      },
      select: { preferences: true },
    });
    await expect(response.json()).resolves.toEqual({
      preferences: {
        ...defaultPreferences,
        theme: "dark",
      },
    });
  });

  it("PATCH rejects invalid filter payloads", async () => {
    const response = await PATCH(
      new NextRequest("http://localhost/api/user/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filters: {
            selectedStyles: "Rock",
          },
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
