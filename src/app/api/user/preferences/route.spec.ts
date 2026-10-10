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
import { verifiedDiscogsUserFactory } from "src/tests/factories/VerifiedDiscogsUser.factory";
import { createDbModuleMock } from "src/tests/mocks/mockDb";

const dbMock = createDbModuleMock();

jest.mock("src/lib/db", () => dbMock);

jest.mock("src/lib/api-helpers", () => ({
  getVerifiedUserFromRequestWithRateLimit: jest.fn(),
}));

type RouteModule = typeof import("src/app/api/user/preferences/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");

let GET: RouteModule["GET"];
let PATCH: RouteModule["PATCH"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockUsersFirst: typeof dbMock.orm.Users.first;
let mockUsersUpsert: typeof dbMock.orm.Users.upsert;

const USER_ID = 42;
const USERNAME = "crate-digger";

const verifiedUser = verifiedDiscogsUserFactory.asVerifiedResult({
  userId: USER_ID,
  username: USERNAME,
});

const defaultPreferences = userPreferencesFactory.defaults();

beforeAll(async () => {
  const [routeModule, apiHelpers] = await Promise.all([
    import("src/app/api/user/preferences/route"),
    import("src/lib/api-helpers"),
  ]);

  GET = routeModule.GET;
  PATCH = routeModule.PATCH;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockUsersFirst = dbMock.orm.Users.first;
  mockUsersUpsert = dbMock.orm.Users.upsert;
});

describe("/api/user/preferences", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockUsersFirst.mockResolvedValue({
      preferences: defaultPreferences,
    });
    mockUsersUpsert.mockResolvedValue({
      preferences: {
        ...defaultPreferences,
        theme: "dark",
      },
    });
  });

  it("GET returns stored preferences without writing", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/user/preferences"),
    );

    expect(response.status).toBe(200);
    expect(mockUsersFirst).toHaveBeenCalled();
    expect(mockUsersUpsert).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      preferences: defaultPreferences,
    });
  });

  it("GET returns defaults when the user row is missing", async () => {
    mockUsersFirst.mockResolvedValue(null);

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
    expect(mockUsersUpsert).toHaveBeenCalledWith({
      create: {
        discogsUserId: USER_ID,
        username: USERNAME,
        preferences: expect.objectContaining({ theme: "dark" }),
        updatedAt: expect.any(String),
      },
      update: {
        username: USERNAME,
        preferences: expect.objectContaining({ theme: "dark" }),
        updatedAt: expect.any(String),
      },
      conflictOn: { discogsUserId: USER_ID },
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
    expect(mockUsersUpsert).not.toHaveBeenCalled();
  });
});
